import "server-only";
import { createHash } from "node:crypto";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import { getOpenAI } from "@/lib/ai/client";
import { getAiConfig } from "@/lib/ai/config";
import { AI_LIMITS } from "@/lib/contracts/ai-tools";
import { TOOL_DEFINITIONS, type ToolResult } from "./tools";

// Bucla asistentului (Responses API): modelul răspunde sau cere instrumente; codul le execută și îi dă
// rezultatul. Cel mult AI_LIMITS.maxToolSteps runde de instrumente, apoi răspunsul final e obligatoriu.

export type AssistantTurn = {
  text: string;
  proposalIds: string[];
  citations: Array<{ materialId: string; page: number }>;
  usage: { inputTokens: number; outputTokens: number };
};

type RunInput = {
  instructions: string;
  input: ResponseInputItem[];
  userId: string;
  execute: (name: string, args: string) => Promise<ToolResult>;
};

export async function runAssistant({ instructions, input, userId, execute }: RunInput): Promise<AssistantTurn> {
  const client = getOpenAI();
  const config = getAiConfig();
  const items: ResponseInputItem[] = [...input];
  const proposalIds: string[] = [];
  const citations: AssistantTurn["citations"] = [];
  const usage = { inputTokens: 0, outputTokens: 0 };

  for (let step = 0; ; step++) {
    const response = await client.responses.create({
      model: config.model,
      instructions,
      input: items,
      tools: TOOL_DEFINITIONS,
      tool_choice: step >= AI_LIMITS.maxToolSteps ? "none" : "auto",
      reasoning: { effort: "low" },
      max_output_tokens: config.maxOutputTokens,
      // Conversațiile rămân la noi (Supabase), nu și la OpenAI.
      store: false,
      include: ["reasoning.encrypted_content"],
      prompt_cache_key: "studiazo-assistant-v1",
      safety_identifier: createHash("sha256").update(userId).digest("hex").slice(0, 32),
    });
    usage.inputTokens += response.usage?.input_tokens ?? 0;
    usage.outputTokens += response.usage?.output_tokens ?? 0;

    const calls = response.output.filter((item) => item.type === "function_call");
    if (calls.length === 0 || step >= AI_LIMITS.maxToolSteps) {
      const text = response.output_text.trim();
      return {
        text: text || "Nu am reușit să formulez un răspuns. Încearcă să reformulezi întrebarea.",
        proposalIds,
        citations,
        usage,
      };
    }

    items.push(...(response.output as ResponseInputItem[]));
    for (const call of calls) {
      const result = await execute(call.name, call.arguments);
      if (result.proposalId) proposalIds.push(result.proposalId);
      if (result.citations) citations.push(...result.citations);
      items.push({ type: "function_call_output", call_id: call.call_id, output: result.output });
    }
  }
}
