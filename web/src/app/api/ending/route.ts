import { NextResponse } from "next/server";
import { judge } from "@/lib/ending";
import { writeEnding } from "@/lib/llm";
import type { Judgment, Offering } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { wish, judgments, outcome, adopted } = (await req.json()) as {
    wish: string; judgments: Judgment[];
    outcome: "ADOPTED" | "ALL_BEHEADED"; adopted: Offering | null;
  };

  const base = judge(judgments, outcome, adopted);

  const lines = judgments.map((j) => {
    const v = j.verdict === "BEHEAD" ? "打ち首" : "採用";
    const note = j.reasonText?.trim();
    const r = note ? `（王子の言葉: 「${note.slice(0, 60)}」）`
      : j.reasonCode === "silent" ? "（無言）" : `（理由: ${j.reasonLabel}）`;
    return `- ${j.retainer.name}: ${j.item.displayName || j.item.name.slice(0, 40)} ${j.item.price.toLocaleString()}円 → ${v}${r}`;
  });
  const got = adopted
    ? `${adopted.item.displayName}（${adopted.item.price.toLocaleString()}円 / ${adopted.retainer.name}より）`
    : "なし。家臣全員を斬った";

  const gen = await writeEnding({ wish, lines, got, fable: base.fable });
  return NextResponse.json({
    ...base,
    title: gen?.title || base.title,
    epilogue: gen?.epilogue || base.epilogue,
  });
}
