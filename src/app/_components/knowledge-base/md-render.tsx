"use client";

import { useEffect, useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import type { Explanation } from "~/server/db/explanation";
import { ChevronDown, X } from "lucide-react";

export type ExplanationElement = {
  explanation: Explanation;
  isExtraResource: boolean;
};

function MdRender({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
    >
      {children}
    </ReactMarkdown>
  );
}

export default function Render({
  explanations,
}: {
  explanations: ExplanationElement[];
}) {
  const [openImageUrl, setOpenImageUrl] = useState<string | null>(null);
  const [showExtraResources, setShowExtraResources] = useState(false);
  const extraResourcesId = useId();

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenImageUrl(null);
    };
    if (openImageUrl) {
      document.addEventListener("keydown", onEscape);
      return () => document.removeEventListener("keydown", onEscape);
    }
  }, [openImageUrl]);

  const normalResources = explanations.filter((e) => !e.isExtraResource);
  const extraResources = explanations.filter((e) => e.isExtraResource);
  const hasBoth = normalResources.length > 0 && extraResources.length > 0;

  return (
    <>
      {normalResources.map((e) => (
        <ExplanationElement
          key={e.explanation.id}
          explanation={e}
          setOpenImageUrl={setOpenImageUrl}
        />
      ))}
      {hasBoth && (
        <button
          type="button"
          className="text-primary mt-3 flex w-full items-center justify-between gap-3 border-t pt-3 text-left text-sm font-medium hover:underline"
          aria-expanded={showExtraResources}
          aria-controls={extraResourcesId}
          onClick={() => setShowExtraResources((isOpen) => !isOpen)}
        >
          <span>
            {showExtraResources
              ? "Ukryj bardziej szczegółowe wyjaśnienie"
              : "Pokaż bardziej szczegółowe wyjaśnienie"}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${showExtraResources ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      )}
      <div id={extraResourcesId} hidden={hasBoth && !showExtraResources}>
        {extraResources.map((e) => (
          <ExplanationElement
            key={e.explanation.id}
            explanation={e}
            setOpenImageUrl={setOpenImageUrl}
          />
        ))}
      </div>

      {openImageUrl && (
        <div
          className="fixed inset-x-0 top-0 z-50 flex h-screen items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setOpenImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Obraz w pełnym ekranie"
        >
          <button
            type="button"
            onClick={() => setOpenImageUrl(null)}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg transition hover:bg-white"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={openImageUrl}
            alt=""
            className="h-auto max-h-[90vh] w-auto max-w-[90vw] object-contain"
          />
        </div>
      )}
    </>
  );
}

function ExplanationElement({
  explanation: e,
  setOpenImageUrl,
}: {
  explanation: ExplanationElement;
  setOpenImageUrl: (url: string) => void;
}) {
  return (
    <div
      className="prose [&_td]:border-border [&_th]:border-border mt-2 max-w-none border-t pt-2 [&_blockquote_p:first-of-type::before]:content-none [&_blockquote_p:last-of-type::after]:content-none [&_td]:border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:px-3 [&_th]:py-2"
      key={e.explanation.id}
    >
      {e.explanation.type === "text" ? (
        <MdRender key={e.explanation.id}>{e.explanation.explanation}</MdRender>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={e.explanation.explanation}
          alt=""
          className="mx-auto h-auto max-h-[70vh] w-auto max-w-full cursor-pointer"
          onClick={() => setOpenImageUrl(e.explanation.explanation)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpenImageUrl(e.explanation.explanation);
            }
          }}
        />
      )}
    </div>
  );
}
