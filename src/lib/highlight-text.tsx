import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

const defaultMarkClassName =
  "rounded-sm bg-yellow-200 text-inherit dark:bg-yellow-500/50";

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightText({
  text,
  highlight,
  markClassName = defaultMarkClassName,
}: {
  text: string;
  highlight?: string;
  markClassName?: string;
}) {
  const query = highlight?.trim();
  if (!query) {
    return <>{text}</>;
  }

  const regex = new RegExp(escapeRegExp(query), "gi");
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(
      <mark key={index} className={cn(markClassName)}>
        {match[0]}
      </mark>,
    );
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
}
