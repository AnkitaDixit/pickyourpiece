import { NextRequest, NextResponse } from "next/server";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isBlockedHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return true;
  if (BLOCKED_HOSTS.has(normalized)) return true;
  if (normalized.endsWith(".local")) return true;
  return false;
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url query parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!ALLOWED_PROTOCOLS.has(targetUrl.protocol)) {
    return NextResponse.json({ error: "Unsupported url protocol" }, { status: 400 });
  }

  if (isBlockedHost(targetUrl.hostname)) {
    return NextResponse.json({ error: "Blocked hostname" }, { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "user-agent": "PickYourPiece-Studio-Image-Proxy/1.0",
      },
      cache: "force-cache",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream responded with ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const cacheControl = upstream.headers.get("cache-control");
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl && cacheControl.includes("max-age")
          ? cacheControl
          : "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch upstream image" }, { status: 502 });
  }
}
