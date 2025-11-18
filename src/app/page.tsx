"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertRichTextToKeepMarkup } from "../lib/keepFormatter";

type CopyState = "idle" | "copied" | "error";
type Theme = "light" | "dark";

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
  const userPreference = useRef<Theme | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const storedPreference = window.localStorage.getItem("theme");
    if (storedPreference === "light" || storedPreference === "dark") {
      return storedPreference;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const isDark = theme === "dark";

  const converted = useMemo(
    () => convertRichTextToKeepMarkup(inputHtml),
    [inputHtml],
  );

  const handleEditorInput = () => {
    setInputHtml(editorRef.current?.innerHTML ?? "");
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedPreference = window.localStorage.getItem("theme");
    if (storedPreference === "light" || storedPreference === "dark") {
      userPreference.current = storedPreference;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (userPreference.current) {
        return;
      }
      setTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      userPreference.current = next;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("theme", next);
      }
      return next;
    });
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
    <div
      className={`min-h-screen transition-colors duration-500 ${isDark ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100" : "bg-gradient-to-b from-amber-50 via-orange-50 to-white text-slate-900"}`}
    >
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex justify-center lg:justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={`Toggle to ${isDark ? "sunlit" : "starlit"} mode`}
            className={`group inline-flex items-center gap-3 rounded-full border px-4 py-1 text-sm font-semibold tracking-wide transition ${isDark ? "border-indigo-500/60 bg-slate-900/60 text-indigo-100 shadow-lg shadow-black/30 hover:border-indigo-300 hover:bg-slate-900" : "border-amber-200 bg-white/80 text-amber-700 shadow-sm shadow-amber-200 hover:border-amber-300 hover:bg-white"}`}
          >
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span
                className={`absolute inset-0 rounded-full blur-md transition ${isDark ? "bg-indigo-500/50" : "bg-amber-300/70"}`}
              />
              <span
                className={`relative flex h-7 w-7 items-center justify-center rounded-full border text-base transition ${isDark ? "border-indigo-400/70 bg-slate-900 text-indigo-100" : "border-amber-300 bg-gradient-to-br from-amber-200 to-yellow-100 text-amber-600"}`}
              >
                {isDark ? "✨" : "☀️"}
              </span>
              <span
                className={`absolute -bottom-1 right-0 h-2 w-2 rounded-full transition ${isDark ? "bg-cyan-300" : "bg-orange-300"}`}
              />
            </span>
            {isDark ? "Starlit" : "Sunlit"} mode
          </button>
        </div>
        <header className="space-y-4 text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-amber-600 shadow-sm shadow-amber-100">
            PWA ready
          </p>
          <h1 className={`text-4xl font-semibold leading-tight sm:text-5xl ${isDark ? "text-white" : "text-slate-900"}`}>
            Convert rich text into Google Keep friendly notes
          </h1>
          <p
            className={`max-w-3xl text-base leading-relaxed sm:mx-auto lg:mx-0 ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            Paste any formatted content, clean it up to the formats Keep understands
            (bold, italic, underline, H1, H2), and automatically translate lists into
            plain text with Keep-compatible numbering, bullet dashes, and four-space
            indents.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm lg:justify-start">
            <div
              className={`rounded-full border px-4 py-1 ${isDark ? "border-slate-700 bg-slate-900/70 text-slate-200" : "border-amber-200 bg-white text-amber-700"}`}
            >
              Ordered lists → numbered text
            </div>
            <div
              className={`rounded-full border px-4 py-1 ${isDark ? "border-slate-700 bg-slate-900/70 text-slate-200" : "border-amber-200 bg-white text-amber-700"}`}
            >
              Unordered lists → dash bullets
            </div>
            <div
              className={`rounded-full border px-4 py-1 ${isDark ? "border-slate-700 bg-slate-900/70 text-slate-200" : "border-amber-200 bg-white text-amber-700"}`}
            >
              Indents → 4 spaces
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div
            className={`rounded-3xl border p-6 shadow-lg transition ${isDark ? "border-slate-800 bg-slate-950/70 shadow-black/30" : "border-amber-100 bg-white/95 shadow-amber-100"}`}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Paste or type content
                </h2>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Rich text is preserved. Paste directly from Docs, Notion, or the web.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={loadSample}
                  className={`rounded-full px-4 py-1 text-sm font-medium transition ${isDark ? "border border-indigo-400/70 text-indigo-100 hover:border-indigo-300 hover:bg-slate-900/50" : "border border-amber-200 text-amber-700 hover:border-amber-300 hover:bg-amber-50"}`}
                >
                  Load sample
                </button>
                <button
                  type="button"
                  onClick={clearEditor}
                  className={`rounded-full px-4 py-1 text-sm font-medium transition ${isDark ? "border border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-900/50" : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="relative">
              {!inputHtml && (
                <span
                  className={`pointer-events-none absolute left-4 top-4 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  Paste something here (⌘/Ctrl + V) and edit freely…
                </span>
              )}
              <div
                ref={editorRef}
                className={`editor-surface min-h-[320px] w-full rounded-2xl border p-4 text-base leading-relaxed transition focus-within:ring-2 ${isDark ? "border-slate-700 bg-slate-900/60 focus-within:border-indigo-400 focus-within:bg-slate-900 focus-within:ring-indigo-400/50" : "border-amber-100 bg-slate-50/80 focus-within:border-amber-300 focus-within:bg-white focus-within:ring-amber-200"}`}
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

          <div
            className={`flex flex-col gap-6 rounded-3xl border p-6 shadow-lg transition ${isDark ? "border-slate-800 bg-slate-950/70 shadow-black/30" : "border-amber-100 bg-white/95 shadow-amber-100"}`}
          >
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Keep-friendly preview
                </h2>
                <span className={`text-xs uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  auto-updates
                </span>
              </div>
              <div
                className={`note-card relative min-h-[240px] rounded-2xl border p-5 shadow-inner transition ${isDark ? "border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-black/40" : "border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-amber-100/60"}`}
              >
                {converted.html ? (
                  <article
                    className="keep-preview"
                    dangerouslySetInnerHTML={{ __html: converted.html }}
                  />
                ) : (
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Your converted content will appear here as soon as you start typing.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                  Plain text fallback (lists already flattened)
                </p>
                <button
                  type="button"
                  onClick={copyPlainText}
                  disabled={!converted.plainText}
                  className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest transition disabled:cursor-not-allowed ${isDark ? "border border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-900 disabled:border-slate-800 disabled:text-slate-600" : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:border-slate-100 disabled:text-slate-300"}`}
                >
                  {plainCopyState === "copied"
                    ? "Copied"
                    : plainCopyState === "error"
                      ? "Try again"
                      : "Copy text"}
                </button>
              </div>
              <textarea
                className={`h-36 w-full rounded-2xl border p-4 text-sm transition focus:outline-none focus:ring-2 ${isDark ? "border-slate-800 bg-slate-900/70 text-slate-200 focus:border-indigo-400 focus:ring-indigo-400/50" : "border-slate-100 bg-slate-50/80 text-slate-700 focus:border-amber-200 focus:ring-amber-100"}`}
                value={converted.plainText}
                readOnly
                placeholder="We'll keep this in sync automatically."
              />
            </div>

            <button
              type="button"
              onClick={copyRichText}
              disabled={!converted.html}
              className={`inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold shadow-lg transition disabled:cursor-not-allowed ${isDark ? "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 shadow-amber-200/30 hover:from-amber-300 hover:to-amber-400 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500" : "bg-amber-500 text-white shadow-amber-200 hover:bg-amber-600 disabled:bg-amber-200"}`}
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
