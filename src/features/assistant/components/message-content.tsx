import { Fragment, type ReactNode } from "react";

// Afișează textul asistentului: paragrafe, liste („- ” / „1. ”), **îngroșat**, `cod` și blocuri ```.
// Fără HTML din model: totul devine elemente React, deci nimic nu se poate injecta în pagină.

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "code"; text: string };

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      const code: string[] = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith("```"); i++) code.push(lines[i]);
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }
    if (line.trim() === "") continue;
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const last = blocks[blocks.length - 1];
    if (bullet || numbered) {
      const type = bullet ? "ul" : "ol";
      const item = (bullet ?? numbered)?.[1] ?? "";
      if (last?.type === type) last.items.push(item);
      else blocks.push({ type, items: [item] });
      continue;
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const content = heading ? `**${heading[1]}**` : line;
    if (last?.type === "p" && lines[i - 1]?.trim() !== "") last.lines.push(content);
    else blocks.push({ type: "p", lines: [content] });
  }
  return blocks;
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return (
        <code key={i} className="rounded bg-surface-sunken px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function MessageContent({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-7 text-ink-soft">
      {parseBlocks(text).map((block, i) => {
        if (block.type === "code")
          return (
            <pre key={i} className="overflow-x-auto rounded-md bg-surface-sunken p-3 text-[13px] leading-6 text-ink">
              <code>{block.text}</code>
            </pre>
          );
        if (block.type === "p")
          return (
            <p key={i}>
              {block.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 ? <br /> : null}
                  {inline(line)}
                </Fragment>
              ))}
            </p>
          );
        const List = block.type;
        return (
          <List key={i} className={List === "ul" ? "flex list-disc flex-col gap-1 pl-5 marker:text-accent" : "flex list-decimal flex-col gap-1 pl-5 marker:font-semibold marker:text-accent"}>
            {block.items.map((item, j) => (
              <li key={j} className="pl-1">
                {inline(item)}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
