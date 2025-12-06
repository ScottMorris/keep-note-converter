import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath =
  (() => {
    const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
    const trimmed = raw.replace(/(^\/+|\/+$)/g, "");
    return trimmed ? `/${trimmed}` : "";
  })() || "";

const withBasePath = (path: string) =>
  `${basePath}${path.startsWith("/") ? path : `/${path}`}`;

export const metadata: Metadata = {
  title: "Keep Note Converter",
  description:
    "Convert any pasted rich text into Google Keep friendly formatting and grab it in a single click.",
  manifest: withBasePath("/manifest.webmanifest"),
  icons: {
    icon: [
      {
        url: withBasePath("/icons/icon-192x192.png"),
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: withBasePath("/icons/icon-512x512.png"),
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: withBasePath("/icons/icon-192x192.png"),
  },
};

export const viewport: Viewport = {
  themeColor: "#f5a623",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
