## Keep Note Converter

A lightweight PWA that takes any pasted rich text and converts it into formatting that works perfectly in Google Keep. Bold, italic, underline, H1, and H2 headings are preserved, while ordered/unordered lists (and nested indents) are translated into plain text numbers, dashes, and four-space indents so they render consistently inside Keep.

### Features

- Paste directly from Docs, Notion, the web, or any editor that outputs HTML-rich content.
- Automatically flattens lists into Keep-friendly plain text:
  - Ordered lists become numbered lines (`1. Title`).
  - Unordered lists become dash bullets (`- Item`).
  - Nested lists are indented with four spaces per level.
- Copy the converted note to the clipboard as rich text (`text/html`) for a perfect paste into Keep, or fall back to plain text with one click.
- Installable PWA powered by `next-pwa` plus a web manifest and icons for offline support.

### Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000 to use the tool locally. The content editor lives in `src/app/page.tsx` and the formatting logic is in `src/lib/keepFormatter.ts`.

### Production build

```bash
npm run build
npm start
```

This runs the PWA with the generated service worker.

### Next steps (internal)

- [ ] Add Markdown paste support that converts directly into Keep-friendly formatting
- [ ] Provide a Docker container to deploy the app on a homelab server
- [ ] Exercise the PWA experience on a phone to validate install/offline behavior
- [ ] Expand the documentation with usage notes and deployment instructions
- [ ] Add dark mode styling toggle for both the editor and preview
