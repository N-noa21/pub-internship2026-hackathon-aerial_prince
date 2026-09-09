import { NextResponse } from "next/server";
import { rethink } from "@/lib/llm";
import type { RetainerId } from "@/lib/retainers";
import type { Item } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 45;

/**
 * 王子の言葉を受けて、まだ献上していない家臣が品を選び直す。
 * 楽天は引き直さず、最初に取った候補リストの中から選ばせるので速い。
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
        item: { ...item, displayName: c.displayName?.trim() ? c.displayName.slice(0, 24) : item.displayName },
        speech: c.speech.slice(0, 50),
        changed: c.changed && c.index !== p.currentIndex,
      };
    });

  return NextResponse.json({ changes });
}
