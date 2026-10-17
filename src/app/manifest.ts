import type { MetadataRoute } from "next";

// Manifest PWA. Fără service worker în etapa 1: nimic nu se păstrează offline,
// deci nicio dată privată nu rămâne în cache-ul dispozitivului. Vezi docs/ARCHITECTURE.md.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Studiazo AI",
    short_name: "Studiazo",
    description: "Al doilea creier al studentului ieșean.",
    lang: "ro",
    start_url: "/azi",
    scope: "/",
    display: "standalone",
    background_color: "#f7f6f3",
    theme_color: "#f7f6f3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
