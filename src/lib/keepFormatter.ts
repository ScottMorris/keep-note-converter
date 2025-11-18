type ConvertedMarkup = {
  html: string;
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
    return { html: "", plainText: "" };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${normalizedInput}</div>`, "text/html");
  const fragments = Array.from(doc.body.childNodes)
    .map((node) => serializeNode(node, false, 0))
    .filter(Boolean)
    .join("");

  const cleanHtml = cleanupOutput(fragments);
  const plainText = markupToPlainText(cleanHtml);

  return { html: cleanHtml, plainText };
}

function serializeNode(node: Node, inlineContext: boolean, depth: number): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const value = (node.textContent ?? "").replace(/\s+/g, (match) =>
      match.includes("\n") ? "\n" : " "
    );
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

  if (tagName === "H1" || tagName === "H2") {
    const level = tagName.toLowerCase();
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

  return inlineContext ? joined : joined.trim();
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
    .replace(/\s+(<\/?(?:h1|h2|p|b|i|u|br)[^>]*>)/gi, "$1")
    .trim();
}

function markupToPlainText(markup: string): string {
  if (!markup) {
    return "";
  }

  const tmp = document.createElement("div");
  tmp.innerHTML = markup
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[12]>/gi, "\n\n");

  return tmp.innerText.replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
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
