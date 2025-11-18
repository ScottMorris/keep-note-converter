## Keep Note Converter

A lightweight PWA that takes any pasted rich text and converts it into formatting that works perfectly in Google Keep. Bold, italic, underline, H1, and H2 headings are preserved, while ordered/unordered lists (and nested indents) are translated into plain text numbers, dashes, and four-space indents so they render consistently inside Keep.

### Features

- Paste directly from Docs, Notion, Writer, or any editor that outputs HTML-rich content.
- Automatically flattens lists into Keep-friendly plain text:
  - Ordered lists become numbered lines (`1. Title`).
  - Unordered lists become dash bullets (`- Item`).
  - Nested lists use four-space indents to mimic Keep’s pseudo-list style.
- Supports inline styling (bold, italic, underline) and clamps headings to H1/H2 so they survive in Keep.
- Copy the converted note with one click:
  - Rich text copy emits Keep-formatted HTML (matching its clipboard schema) so pastes keep their styles.
  - Plain text copy removes markup while keeping list/heading spacing intact.
- Installable PWA powered by `@ducanh2912/next-pwa`, with manifest + icons, so it can live on your phone or desktop docked like a native app.

### Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000 to use the tool locally. The content editor lives in `src/app/page.tsx`; conversion/utilities live in `src/lib/keepFormatter.ts`.

### Usage tips

1. Paste formatted text into the editor. Headings/lists should render immediately.
2. Tweak the content if needed (the editor keeps formatting where possible).
3. Click **Copy Keep-ready rich text** to copy a clipboard payload Keep understands (same spans/line heights it emits).  
   - If you only need plain text, use the **Copy text** button below the preview.
4. Paste into a Keep note. Headings, emphasis, and list spacing should match the preview.

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
- [x] Expand the documentation with usage notes and deployment instructions
- [ ] Add dark mode styling toggle for both the editor and preview
