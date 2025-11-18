type ConvertedMarkup = {
  html: string;
  keepHtml: string;
  plainText: string;
};

const inlineTagMap: Record<string, string> = {
  B: "b",
  STRONG: "b",
  I: "i",
  EM: "i",
  U: "u",
};

const blockTags = new Set([
  "P",
  "DIV",
  "SECTION",
  "ARTICLE",
  "HEADER",
  "FOOTER",
  "H1",
  "H2",
  "BR",
  "OL",
  "UL",
]);

export function convertRichTextToKeepMarkup(rawHtml: string): ConvertedMarkup {
  const normalizedInput = rawHtml.replace(/\u00a0/g, " ");
  const textOnly = normalizedInput.replace(/<[^>]*>/g, "").trim();

  if (!textOnly) {
    return { html: "", keepHtml: "", plainText: "" };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${normalizedInput}</div>`, "text/html");
  const fragments = Array.from(doc.body.childNodes)
    .map((node) => serializeNode(node, false, 0))
    .filter(Boolean)
    .join("");

  const cleanHtml = cleanupOutput(fragments);
  const keepHtml = convertToKeepClipboardHtml(cleanHtml);
  const plainText = markupToPlainText(cleanHtml);

  return { html: cleanHtml, keepHtml, plainText };
}

function serializeNode(node: Node, inlineContext: boolean, depth: number): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const value = (node.textContent ?? "").replace(/\s+/g, " ");
    return escapeHtml(value);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toUpperCase();

  if (tagName === "SCRIPT" || tagName === "STYLE") {
    return "";
  }

  if (inlineTagMap[tagName]) {
    const tag = inlineTagMap[tagName];
    const inner = serializeChildren(element, true, depth);
    return inner ? `<${tag}>${inner}</${tag}>` : "";
  }

  if (/^H[1-6]$/.test(tagName)) {
    const level = tagName === "H1" ? "h1" : "h2";
    const inner = serializeChildren(element, true, depth);
    return inner ? `<${level}>${inner}</${level}>` : "";
  }

  if (tagName === "BR") {
    return "<br />";
  }

  if (tagName === "OL" || tagName === "UL") {
    return convertList(element, tagName === "OL", depth);
  }

  if (blockTags.has(tagName) && !inlineContext) {
    const inner = serializeChildren(element, false, depth);
    return wrapParagraph(inner);
  }

  const inner = serializeChildren(element, inlineContext, depth);
  return inlineContext ? inner : wrapParagraph(inner);
}

function serializeChildren(element: Element, inlineContext: boolean, depth: number): string {
  const joined = Array.from(element.childNodes)
    .map((child) => serializeNode(child, inlineContext, depth))
    .join("");

  return joined;
}

function wrapParagraph(content: string): string {
  if (!content) {
    return "";
  }

  if (isEffectivelyEmpty(content)) {
    return "";
  }

  return `<p>${content.trim()}</p>`;
}

function convertList(listElement: Element, isOrdered: boolean, depth: number): string {
  const items = Array.from(listElement.children).filter(
    (child) => child.tagName && child.tagName.toUpperCase() === "LI",
  );

  if (!items.length) {
    return "";
  }

  const indent = depth > 0 ? "&nbsp;".repeat(depth * 4) : "";
  const startValue = isOrdered ? parseInt(listElement.getAttribute("start") ?? "1", 10) : 1;
  let current = startValue;
  const fragments: string[] = [];

  items.forEach((item) => {
    const li = item as HTMLElement;
    const childNodes = Array.from(li.childNodes);
    const nested = childNodes.filter(
      (child) =>
        child.nodeType === Node.ELEMENT_NODE &&
        ["OL", "UL"].includes((child as Element).tagName.toUpperCase()),
    ) as Element[];

    const inlineContent = childNodes
      .filter((child) => !nested.includes(child as Element))
      .map((child) => serializeNode(child, true, depth))
      .join("")
      .trim();

    const prefix = isOrdered ? `${current}. ` : "- ";
    const lineContent = inlineContent || "&nbsp;";
    fragments.push(`<p>${indent}${prefix}${lineContent}</p>`);

    nested.forEach((nestedList) => {
      fragments.push(convertList(nestedList, nestedList.tagName.toUpperCase() === "OL", depth + 1));
    });

    current += 1;
  });

  return fragments.join("");
}

function cleanupOutput(markup: string): string {
  return markup
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<p[^>]*>)(\s+)/gi, "$1")
    .replace(/(<h[12][^>]*>)(\s+)/gi, "$1")
    .replace(/(<br\s*\/?>)\s+/gi, "$1")
    .replace(/\s+(<\/?(?:h1|h2|p|br)[^>]*>)/gi, "$1")
    .trim();
}

function markupToPlainText(markup: string): string {
  if (!markup) {
    return "";
  }

  const tmp = document.createElement("div");
  tmp.innerHTML = injectHeadingSeparators(markup)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[12]>/gi, "\n");

  const textContent = tmp.innerText.replace(/\u00a0/g, " ");
  const normalizedLines = textContent
    .split("\n")
    .map((line) => (line.startsWith("    ") ? line : line.replace(/^\s+/, "")))
    .join("\n");

  return normalizedLines.replace(/\n{2,}/g, "\n\n").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isEffectivelyEmpty(fragment: string): boolean {
  const stripped = fragment
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, "");

  return stripped.length === 0;
}

function injectHeadingSeparators(markup: string): string {
  let updated = markup.replace(
    /(<\/(?:p|ol|ul)>)(\s*)(<h[12][^>]*>)/gi,
    "$1<p>&nbsp;</p>$2$3",
  );
  updated = updated.replace(/^(\s*<h[12][^>]*>)/i, "<p>&nbsp;</p>$1");
  return updated;
}

const KEEP_BLOCK_STYLE = "line-height:1.38;margin-top:0pt;margin-bottom:0pt;";
const KEEP_TEXT_BASE =
  "font-size:11pt;font-family:'Google Sans Text';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;";
const KEEP_H1_TEXT =
  "font-size:15pt;font-family:'Google Sans';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;";
const KEEP_H2_TEXT =
  "font-size:13.5pt;font-family:'Google Sans';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;";

function convertToKeepClipboardHtml(markup: string): string {
  if (!markup) {
    return "";
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${markup}</div>`, "text/html");
  const blocks = Array.from(doc.body.querySelectorAll("p,h1,h2"));

  blocks.forEach((block) => {
    const tag = block.tagName.toLowerCase();
    const spanStyle =
      tag === "h1" ? KEEP_H1_TEXT : tag === "h2" ? KEEP_H2_TEXT : KEEP_TEXT_BASE;
    block.setAttribute("dir", "ltr");
    block.setAttribute("style", KEEP_BLOCK_STYLE);
    wrapChildrenWithSpan(block, spanStyle);
  });

  return doc.body.innerHTML;
}

function wrapChildrenWithSpan(block: Element, spanStyle: string) {
  const doc = block.ownerDocument;
  if (!doc) {
    return;
  }

  const wrapper = doc.createElement("span");
  wrapper.setAttribute("style", spanStyle);

  while (block.firstChild) {
    wrapper.appendChild(block.firstChild);
  }

  block.appendChild(wrapper);
}
