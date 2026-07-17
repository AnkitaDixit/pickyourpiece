import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "pickYourpiece (PyP)",
    short_name: "PyP",
    description: "PickYourPiece (PyP): compare rings across top jewellery brands with price, metal, and style filters.",
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