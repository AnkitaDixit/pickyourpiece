import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getBrandSegment, getPrimaryProductId } from "@/lib/product-seo";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const brandParam = url.searchParams.get("brand") ?? "";
  const idParam = (url.searchParams.get("id") ?? "").trim().toLowerCase();

  const brandSegment = getBrandSegment(brandParam);
  if (!brandSegment || !idParam) {
    return NextResponse.json({ message: "Missing brand or id" }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), "scraper", "data", `${brandSegment}.json`);
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return NextResponse.json({ message: "Invalid source data" }, { status: 500 });
    }

    const item = parsed.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const primaryId = getPrimaryProductId(entry as Record<string, unknown>);
      return typeof primaryId === "string" && primaryId.toLowerCase() === idParam;
    });

    if (!item) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ message: "Could not load product detail" }, { status: 500 });
  }
}
