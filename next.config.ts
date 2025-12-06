import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable:
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_DISABLE_PWA === "true",
  register: true,
});

const normalizedBasePath = (() => {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
  const trimmed = raw.replace(/(^\/+|\/+$)/g, "");
  return trimmed ? `/${trimmed}` : "";
})();

const nextConfig: NextConfig = {
  assetPrefix:
    process.env.NEXT_PUBLIC_ASSET_PREFIX ??
    (normalizedBasePath ? normalizedBasePath : undefined),
  basePath: normalizedBasePath || undefined,
  output: "export",
  turbopack: {},
};

export default withPWA(nextConfig);
