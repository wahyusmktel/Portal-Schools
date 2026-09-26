"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface Props {
  text: string;
  className?: string;
}

// Regex to detect Arabic script characters
const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function isArabicText(str: string): boolean {
  return ARABIC_REGEX.test(str);
}

export function CbtMathArabicViewer({ text, className = "" }: Props) {
  // Parse text into tokens: block math $$...$$, inline math $...$, or text
  const renderedContent = useMemo(() => {
    if (!text) return null;

    // Split text by lines first
    const lines = text.split("\n");

    return lines.map((line, lineIdx) => {
      const isLineArabic = isArabicText(line);

      // Split line by Math delimiters: $$...$$ and $...$
      // Match either $$...$$ or $...$
      const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g;
      const parts = line.split(mathRegex);

      return (
        <p
          key={lineIdx}
          dir={isLineArabic ? "rtl" : "ltr"}
          className={`leading-relaxed my-1 ${
            isLineArabic ? "font-serif text-lg tracking-wide text-right font-normal" : ""
          }`}
        >
          {parts.map((part, partIdx) => {
            if (!part) return null;

            if (part.startsWith("$$") && part.endsWith("$$") && part.length >= 4) {
              const formula = part.slice(2, -2).trim();
              try {
                const html = katex.renderToString(formula, {
                  displayMode: true,
                  throwOnError: false,
                });
                return (
                  <span
                    key={partIdx}
                    className="block my-2 overflow-x-auto text-center py-1"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch (e) {
                return (
                  <code key={partIdx} className="text-red-500 font-mono">
                    {part}
                  </code>
                );
              }
            }

            if (part.startsWith("$") && part.endsWith("$") && part.length >= 2) {
              const formula = part.slice(1, -1).trim();
              try {
                const html = katex.renderToString(formula, {
                  displayMode: false,
                  throwOnError: false,
                });
                return (
                  <span
                    key={partIdx}
                    className="inline-block mx-0.5"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch (e) {
                return (
                  <code key={partIdx} className="text-red-500 font-mono text-sm">
                    {part}
                  </code>
                );
              }
            }

            return <span key={partIdx}>{part}</span>;
          })}
        </p>
      );
    });
  }, [text]);

  return <div className={`cbt-rendered-text ${className}`}>{renderedContent}</div>;
}
