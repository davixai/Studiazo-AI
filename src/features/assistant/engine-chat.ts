import "server-only";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import { getOpenAI, withFreeTierRetry } from "@/lib/ai/client";
import { getAiConfig } from "@/lib/ai/config";
import { AI_LIMITS } from "@/lib/contracts/ai-tools";
import type { AssistantTurn, RunInput } from "./engine";
import { TOOL_DEFINITIONS } from "./tools";

// Aceeași buclă ca în engine.ts, pe Chat Completions: pentru furnizorii compatibili OpenAI care nu au
// Responses API (ex. serviciul public fără cheie). Instrumentele și regulile sunt aceleași.

const CHAT_TOOLS: ChatCompletionTool[] = TOOL_DEFINITIONS.map((t) => ({
  type: "function",
  function: { name: t.name, description: t.description ?? undefined, parameters: t.parameters ?? undefined },
}));

/** Planurile gratuite au ritm limitat: mai puține runde de instrumente, ca răspunsul să vină mai repede. */
const MAX_CHAT_TOOL_STEPS = Math.min(AI_LIMITS.maxToolSteps, 2);

const NO_VISION_NOTE = "(Studentul a atașat o poză, dar acest model nu poate vedea imagini. Spune-i asta pe scurt și roagă-l să descrie exercițiul în text.)";

function toChatMessage(item: ResponseInputItem): ChatCompletionMessageParam | null {
  if (!("role" in item) || (item.role !== "user" && item.role !== "assistant")) return null;
  const content = item.content;
  if (typeof content === "string") return { role: item.role, content } as ChatCompletionMessageParam;
  if (!Array.isArray(content)) return null;
  const parts = content as Array<{ type: string; text?: string }>;
  const text = parts.filter((p) => p.type === "input_text" || p.type === "output_text").map((p) => p.text ?? "").join("\n");
  const hasImage = parts.some((p) => p.type === "input_image");
  return { role: item.role, content: [text, hasImage ? NO_VISION_NOTE : ""].filter(Boolean).join("\n\n") } as ChatCompletionMessageParam;
}

export async function runChatAssistant({ instructions, input, execute }: RunInput): Promise<AssistantTurn> {
  const client = getOpenAI();
  const config = getAiConfig();
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: instructions },
    ...input.map(toChatMessage).filter((m): m is ChatCompletionMessageParam => m !== null),
  ];
  const proposalIds: string[] = [];
  const citations: AssistantTurn["citations"] = [];
  const usage = { inputTokens: 0, outputTokens: 0 };

  for (let step = 0; ; step++) {
    const last = step >= MAX_CHAT_TOOL_STEPS;
    const response = await withFreeTierRetry(() =>
      client.chat.completions.create({
        model: config.model,
        messages,
        ...(last ? {} : { tools: CHAT_TOOLS, tool_choice: "auto" as const }),
      }),
    );
    usage.inputTokens += response.usage?.prompt_tokens ?? 0;
    usage.outputTokens += response.usage?.completion_tokens ?? 0;

    const message = response.choices[0]?.message;
    const calls = (message?.tool_calls ?? []).filter((c) => c.type === "function");
    if (calls.length === 0 || last) {
      const text = (message?.content ?? "").trim();
      return {
        text: text || "Nu am reușit să formulez un răspuns. Încearcă să reformulezi întrebarea.",
        proposalIds,
        citations,
        usage,
      };
    }

    messages.push({ role: "assistant", content: message?.content ?? "", tool_calls: calls });
    for (const call of calls) {
      const result = await execute(call.function.name, call.function.arguments);
      if (result.proposalId) proposalIds.push(result.proposalId);
      if (result.citations) citations.push(...result.citations);
      messages.push({ role: "tool", tool_call_id: call.id, content: result.output });
    }
  }
}
