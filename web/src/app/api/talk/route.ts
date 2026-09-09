import { NextResponse } from "next/server";
import { talk } from "@/lib/llm";
import type { Offering, Turn } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 45;

/** 家臣に話しかける。返事は口調とその時の心境（mood）つき。 */
export async function POST(req: Request) {
  const { wish, offering, history, message } = (await req.json()) as {
    wish: string; offering: Offering; history: Turn[]; message: string;
  };
  if (!message?.trim()) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const res = await talk({
    wish,
    retainerId: offering.retainer.id,
    retainerName: offering.retainer.name,
    itemName: offering.item.displayName,
    itemPrice: offering.item.price,
    speech: offering.speech,
    history: history.map((t) => ({ from: t.from, text: t.text })),
    message: message.trim(),
  });

  if (!res) {
    // LLM が落ちても会話が途切れないよう、段階に応じた定型で返す
    const turns = history.filter((t) => t.from === "prince").length;
    const fallback = ["……ど、どうか今一度ご覧くださいませ！", "お、お待ちを！ 値は下げまする！", "……御意。覚悟はできております。"];
    return NextResponse.json({
      reply: fallback[Math.min(turns, 2)],
      mood: ["pitch", "desperate", "resigned"][Math.min(turns, 2)],
      priceDelta: 0, addOn: "",
    });
  }
  // 値下げは認めない。上乗せも品の値段の 2 倍までに抑える
  const cap = Math.max(500, Math.round(offering.item.price * 1.0));
  const delta = Math.min(Math.max(0, Math.round(res.priceDelta ?? 0)), cap);
  return NextResponse.json({ ...res, priceDelta: delta });
}
