import type { MetadataRoute } from "next";

/**
 * Web app manifest so the site can be added to a phone home screen.
 *
 * This is a static metadata route and is emitted by both the Node build and
 * the GitHub Pages export. Every URL carries the base path because a project
 * page is served from https://<user>.github.io/<repo>/, and a manifest with
 * root-relative paths would point at files that do not exist there.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// `output: "export"` refuses any route it cannot prove static; the manifest
// depends only on a build-time variable, so declare it.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jyotish Observatory",
    short_name: "Jyotish",
    description:
      "Explore a Lahiri-sidereal birth chart through an interactive 3D celestial sphere, traditional Vedic charts, and Jyotish analysis.",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#070914",
    theme_color: "#060711",
    // Chrome on Android wants a 192px and a 512px icon before it offers to
    // install. A "maskable"-only icon does not count towards that: the
    // purpose list is exhaustive, so the 512 declares both roles.
    icons: [
      {
        src: `${basePath}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: `${basePath}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      // Listed twice rather than as "any maskable", which Next's manifest
      // type does not accept: one entry per role is equivalent.
      {
        src: `${basePath}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${basePath}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
