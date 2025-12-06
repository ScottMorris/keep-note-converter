# Keep Note Converter – Product Spec

## Overview
- Lightweight Next.js PWA that converts pasted rich text into Google Keep–friendly output.
- Preserves inline emphasis (bold, italic, underline) and clamps headings to H1/H2.
- Flattens lists into plain text numbers/dashes with four-space indents so Keep renders them consistently.
- Provides copy options for both Keep-ready rich text and plain text; no server-side storage.

## Goals
- Make pasting rich content into Keep look identical to the preview with minimal cleanup.
- Keep the conversion flow fast and local-only, suitable for offline PWA use.
- Offer a simple UI that mirrors Keep spacing and heading styles.

## User Flows
- Paste rich text (Docs/Notion/etc.) into the editor, review the rendered preview, and copy:
  - **Copy Keep-ready rich text** to preserve headings, emphasis, and Keep-compatible spacing.
  - **Copy text** to strip markup while keeping list/heading spacing.
- Toggle theme: follow system preference by default, allow switching between “Sunlit” and “Starlit.”
- Optional: install as a PWA and use offline once cached.

## Functional Requirements
- **Input & Parsing**
  - Accept paste of HTML-rich content and normalize it in the editor.
  - Limit heading levels to H1/H2; treat deeper headings as H2-equivalent.
  - Preserve inline bold/italic/underline; drop unsupported markup.
- **List Flattening**
  - Ordered lists → numbered lines (`1. Item`), preserving order.
  - Unordered lists → dash bullets (`- Item`).
  - Nested lists → four-space indents per level with the same numbering/bullet rules.
- **Copy Actions**
  - Rich text copy emits Keep-compatible HTML (matching Keep’s clipboard schema).
  - Plain text copy strips tags while retaining spacing/indents so pasted text matches the preview.
- **Preview**
  - Live preview reflects final Keep rendering (headings, spacing, list indents, emphasis).
- **Theming**
  - Default to system theme; allow manual toggle between defined palettes.
- **PWA**
  - Installable via manifest + icons; service worker handles offline caching for the core experience.

## Non-Functional Requirements
- Runs fully client-side; no user content persisted or transmitted.
- Responsive layout for desktop and mobile.
- Performance: conversion and copy actions should feel instant for typical note sizes.
- Accessibility: keyboard-friendly controls and semantic markup for headings/lists/buttons.

## Open Items / Future Work
- Markdown paste support that converts directly into Keep-friendly formatting.
- Optional Dockerized deployment target.
- Mobile PWA validation for install/offline behavior.
