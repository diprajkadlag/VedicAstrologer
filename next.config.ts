import type { NextConfig } from "next";

/**
 * Two build shapes from one source.
 *
 * Default: a Node app with the /api/geocode proxy — what `npm run dev` and a
 * container deployment use.
 *
 * STATIC_EXPORT=1: a folder of files with no server, for GitHub Pages. Route
 * handlers cannot exist in that build, so the geocode route is excluded and
 * the browser calls Nominatim directly (see lib/geocoding/client.ts).
 *
 * BASE_PATH is set by the Pages workflow to the repository name, because a
 * project page is served from https://<user>.github.io/<repo>/ rather than
 * from the root.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStaticExport
    ? {
        output: "export" as const,
        basePath,
        // Pages serves /foo/ as /foo/index.html, so emit directories.
        trailingSlash: true,
        // The image optimiser needs a server; there is none here.
        images: { unoptimized: true },
      }
    : {
        serverExternalPackages: ["geo-tz"],
        outputFileTracingIncludes: {
          "/api/geocode": ["./node_modules/geo-tz/data/**/*"],
        },
      }),
  // The geocode route lives in route.node.ts. Listing "node.ts" as a page
  // extension is what makes Next treat it as a route handler at all, so
  // leaving it out of the static build excludes the file rather than failing
  // on it — `output: export` rejects any route handler it can see.
  pageExtensions: isStaticExport
    ? ["ts", "tsx"]
    : ["node.ts", "ts", "tsx"],
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: isStaticExport ? "1" : "0",
  },
};

export default nextConfig;
