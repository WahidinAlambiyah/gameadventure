import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BacaNgaji Adventure",
    short_name: "BacaNgaji",
    description: "Child-friendly Bahasa Indonesia and Hijaiyah learning adventures.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf1",
    theme_color: "#2f7d75",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
