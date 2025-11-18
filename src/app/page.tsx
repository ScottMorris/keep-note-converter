"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { convertRichTextToKeepMarkup } from "../lib/keepFormatter";

type CopyState = "idle" | "copied" | "error";

const sampleHtml = `
  <h1>Workshop Notes</h1>
  <p>Key takeaways from today's planning session:</p>
  <ol>
    <li><strong>Outline the release</strong> milestones</li>
    <li>Draft messaging for launch campaign</li>
    <li>
      Prepare QA checklist
      <ul>
        <li>Smoke tests</li>
        <li><em>Performance</em> runs</li>
      </ul>
    </li>
  </ol>
  <h2>Reminders</h2>
  <ul>
    <li>Send recap email</li>
    <li>Drop files in shared folder</li>
  </ul>
`;

export default function Home() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [inputHtml, setInputHtml] = useState("");
  const [richCopyState, setRichCopyState] = useState<CopyState>("idle");
  const [plainCopyState, setPlainCopyState] = useState<CopyState>("idle");

  const converted = useMemo(
    () => convertRichTextToKeepMarkup(inputHtml),
    [inputHtml],
  );

  const handleEditorInput = () => {
    setInputHtml(editorRef.current?.innerHTML ?? "");
  };

  const resetCopyStates = () => {
    setTimeout(() => {
      setRichCopyState("idle");
      setPlainCopyState("idle");
    }, 2000);
  };

  const copyRichText = useCallback(async () => {
    if (!converted.html) {
      return;
    }

    try {
      const clipboardItemCtor =
        typeof window !== "undefined" && "ClipboardItem" in window
          ? (window as typeof window & { ClipboardItem: typeof ClipboardItem }).ClipboardItem
          : null;

      if (
        clipboardItemCtor &&
        navigator.clipboard &&
        "write" in navigator.clipboard
      ) {
        const htmlBlob = new Blob(
          [converted.keepHtml || converted.html],
          { type: "text/html" },
        );
        const textBlob = new Blob(
          [converted.plainText || converted.html.replace(/<[^>]*>/g, "")],
          { type: "text/plain" },
        );
        const item = new clipboardItemCtor({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(
          converted.plainText || converted.html,
        );
      }

      setRichCopyState("copied");
      resetCopyStates();
    } catch (error) {
      console.error("Failed to copy rich text", error);
      setRichCopyState("error");
      setTimeout(() => setRichCopyState("idle"), 2500);
    }
  }, [converted]);

  const copyPlainText = useCallback(async () => {
    if (!converted.plainText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(converted.plainText);
      setPlainCopyState("copied");
      resetCopyStates();
    } catch (error) {
      console.error("Failed to copy plain text", error);
      setPlainCopyState("error");
      setTimeout(() => setPlainCopyState("idle"), 2500);
    }
  }, [converted.plainText]);

  const clearEditor = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setInputHtml("");
  };

  const loadSample = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sampleHtml;
    }
    setInputHtml(sampleHtml);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-white text-slate-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-4 text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-amber-600 shadow-sm shadow-amber-100">
            PWA ready
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Convert rich text into Google Keep friendly notes
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-slate-600 sm:mx-auto lg:mx-0">
            Paste any formatted content, clean it up to the formats Keep understands
            (bold, italic, underline, H1, H2), and automatically translate lists into
            plain text with Keep-compatible numbering, bullet dashes, and four-space
            indents.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm lg:justify-start">
            <div className="rounded-full border border-amber-200 bg-white px-4 py-1 text-amber-700">
              Ordered lists → numbered text
            </div>
            <div className="rounded-full border border-amber-200 bg-white px-4 py-1 text-amber-700">
              Unordered lists → dash bullets
            </div>
            <div className="rounded-full border border-amber-200 bg-white px-4 py-1 text-amber-700">
              Indents → 4 spaces
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-amber-100 bg-white/95 p-6 shadow-lg shadow-amber-100">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Paste or type content
                </h2>
                <p className="text-sm text-slate-500">
                  Rich text is preserved. Paste directly from Docs, Notion, or the web.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={loadSample}
                  className="rounded-full border border-amber-200 px-4 py-1 text-sm font-medium text-amber-700 transition hover:border-amber-300 hover:bg-amber-50"
                >
                  Load sample
                </button>
                <button
                  type="button"
                  onClick={clearEditor}
                  className="rounded-full border border-slate-200 px-4 py-1 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="relative">
              {!inputHtml && (
                <span className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400">
                  Paste something here (⌘/Ctrl + V) and edit freely…
                </span>
              )}
              <div
                ref={editorRef}
                className="editor-surface min-h-[320px] w-full rounded-2xl border border-amber-100 bg-slate-50/80 p-4 text-base leading-relaxed focus-within:border-amber-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-200"
                contentEditable
                tabIndex={0}
                role="textbox"
                aria-label="Formatting editor"
                data-testid="input-editor"
                onInput={handleEditorInput}
                suppressContentEditableWarning
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-3xl border border-amber-100 bg-white/95 p-6 shadow-lg shadow-amber-100">
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  Keep-friendly preview
                </h2>
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  auto-updates
                </span>
              </div>
              <div className="note-card relative min-h-[240px] rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 shadow-inner">
                {converted.html ? (
                  <article
                    className="keep-preview"
                    dangerouslySetInnerHTML={{ __html: converted.html }}
                  />
                ) : (
                  <p className="text-sm text-slate-500">
                    Your converted content will appear here as soon as you start typing.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  Plain text fallback (lists already flattened)
                </p>
                <button
                  type="button"
                  onClick={copyPlainText}
                  disabled={!converted.plainText}
                  className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600 transition disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                >
                  {plainCopyState === "copied"
                    ? "Copied"
                    : plainCopyState === "error"
                      ? "Try again"
                      : "Copy text"}
                </button>
              </div>
              <textarea
                className="h-36 w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-700 focus:border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-100"
                value={converted.plainText}
                readOnly
                placeholder="We'll keep this in sync automatically."
              />
            </div>

            <button
              type="button"
              onClick={copyRichText}
              disabled={!converted.html}
              className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-200"
            >
              {richCopyState === "copied"
                ? "Copied to clipboard"
                : richCopyState === "error"
                  ? "Copy failed · try again"
                  : "Copy Keep-ready rich text"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
