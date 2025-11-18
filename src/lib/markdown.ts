import MarkdownIt from "markdown-it";

const markdownParser = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return "";
  }

  const normalized = markdown.replace(/\r\n?/g, "\n").trim();
  return markdownParser.render(normalized);
}
