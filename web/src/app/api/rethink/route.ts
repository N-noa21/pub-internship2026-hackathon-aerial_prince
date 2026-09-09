import { NextResponse } from "next/server";
import { rethink } from "@/lib/llm";
import type { RetainerId } from "@/lib/retainers";
import type { Item } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 45;

/**
 * 王子の言葉を受けて、次に出る家臣が品を「少し」見直す。
 * 楽天は引き直さず、候補の上位 4 件から Haiku に選ばせるので数秒で返る。
 */
export async function POST(req: Request) {
  const { wish, feedback, rejected, pools } = (await req.json()) as {
    wish: string; feedback: string[]; rejected: string[];
    pools: Partial<Record<RetainerId, { items: Item[]; currentIndex: number }>>;
  };

  const res = await rethink({ wish, feedback: feedback ?? [], rejected: rejected ?? [], pools });
  if (!res) return NextResponse.json({ changes: [] });

  const changes = res.changes
    .filter((c) => {
      const p = pools[c.retainerId];
      return p && c.index >= 0 && c.index < p.items.length;
    })
    .map((c) => {
      const p = pools[c.retainerId]!;
      const item = p.items[c.index];
      return {
        retainerId: c.retainerId,
        item,
        speech: c.speech.slice(0, 50),
        changed: c.index !== p.currentIndex,
      };
    });

  return NextResponse.json({ changes });
}
