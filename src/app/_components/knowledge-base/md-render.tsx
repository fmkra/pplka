"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import type { Explanation } from "~/server/db/explanation";
import { X } from "lucide-react";

function MdRender({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
    >
      {children}
    </ReactMarkdown>
  );
}

export default function Render({
  explanations,
}: {
  explanations: Explanation[];
}) {
  const [openImageUrl, setOpenImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenImageUrl(null);
    };
    if (openImageUrl) {
      document.addEventListener("keydown", onEscape);
      return () => document.removeEventListener("keydown", onEscape);
    }
  }, [openImageUrl]);

  return (
    <>
      {explanations.map((explanation) => (
        <div
          className="prose mt-2 max-w-none border-t pt-2"
          key={explanation.id}
        >
          {explanation.type === "text" ? (
            <MdRender key={explanation.id}>{explanation.explanation}</MdRender>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={explanation.explanation}
              alt=""
              className="mx-auto max-h-[70vh] w-full max-w-[54rem] cursor-pointer"
              onClick={() => setOpenImageUrl(explanation.explanation)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenImageUrl(explanation.explanation);
                }
              }}
            />
          )}
        </div>
      ))}

      {openImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
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
            className="max-w-[90vw]object-contain h-full max-h-[90vh] w-full"
          />
        </div>
      )}
    </>
  );
}
