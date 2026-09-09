import { NextResponse } from "next/server";

/** 商品画像を同一オリジンから返す（結果画像を Canvas で描くときの汚染回避）。楽天のドメインだけ許可 */
export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u") ?? "";
  let target: URL;
  try { target = new URL(u); } catch { return new NextResponse("bad url", { status: 400 }); }
  if (!/\.rakuten\.co\.jp$/.test(target.hostname) || target.protocol !== "https:") {
    return new NextResponse("forbidden", { status: 403 });
  }
  const res = await fetch(target, { cache: "force-cache" });
  if (!res.ok) return new NextResponse("upstream", { status: 502 });
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
