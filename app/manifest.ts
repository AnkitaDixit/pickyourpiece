import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PickYourPiece",
    short_name: "PickYourPiece",
    description: "Compare rings across top jewellery brands with price, metal, and style filters.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#DA001C",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}