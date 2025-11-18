import { describe, expect, it } from "vitest";
import { convertRichTextToKeepMarkup } from "./keepFormatter";

describe("convertRichTextToKeepMarkup", () => {
  it("returns empty markup for whitespace-only inputs", () => {
    const result = convertRichTextToKeepMarkup("   \n&nbsp; \t");

    expect(result).toEqual({ html: "", keepHtml: "", plainText: "" });
  });

  it("normalizes headings and inline formatting", () => {
    const result = convertRichTextToKeepMarkup(
      "<h1>Title</h1><div>Body <strong>text</strong></div>",
    );

    expect(result.html).toContain("<h1>Title</h1>");
    expect(result.html).toContain("<p>Body <b>text</b></p>");
    expect(result.plainText).toBe("Title\nBody text");
    expect(result.keepHtml).toContain("font-size:15pt");
    expect(result.keepHtml).toContain("font-size:11pt");
  });

  it("converts nested lists to Keep-friendly paragraphs", () => {
    const result = convertRichTextToKeepMarkup(
      "<ol start=\"3\"><li>First</li><li>Second<ul><li>Nested</li></ul></li></ol>",
    );

    expect(result.html).toContain("<p>3. First</p>");
    expect(result.html).toContain("<p>4. Second</p>");
    expect(result.html).toContain("<p>&nbsp;&nbsp;&nbsp;&nbsp;- Nested</p>");
    expect(result.plainText).toBe("3. First\n4. Second\n    - Nested");
    expect(result.keepHtml).toContain("line-height:1.38");
  });
});
