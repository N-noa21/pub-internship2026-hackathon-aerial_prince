import { NextResponse } from "next/server";
import { buildQueries, llmReady, pickOfferings } from "@/lib/llm";
import { searchAny } from "@/lib/rakuten";
import { lineup, type RetainerId } from "@/lib/retainers";
import type { Item, Offering } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** 「でっかい城が欲しいのじゃ」→「城」。LLM が落ちたときのフォールバック用。 */
function coreNouns(wish: string): string[] {
  let s = wish.trim().replace(/。/g, "、").split("、").pop() ?? wish;
  s = s.replace(/^(わしは|余は|私は|僕は|俺は)/, "");
  s = s.replace(/(が|を|は|も)?\s*(ほしい|欲しい|よこせ|与えよ|持て|くれ|ください|したい|なりたい|乗りたい|行きたい|食べたい|見たい)?\s*(のじゃ|のだ|んじゃ|じゃ|だ|です|ぞ|よ|な|！|!|。)*\s*$/, "");
  const p = s.search(/[をにへ]/);
  if (p >= 1) s = s.slice(0, p);
  s = s.replace(/^[぀-ゟ]{2,}/, "") || s;
  const out = [s];
  if (s.includes("の")) out.push(s.split("の").pop()!);
  const nouns = wish.match(/[一-鿿゠-ヿー]{2,}/g);
  if (nouns) out.push(nouns.sort((a, b) => b.length - a.length)[0]);
  return [...new Set(out.filter(Boolean))];
}

export async function POST(req: Request) {
  const { wish } = (await req.json()) as { wish?: string };
  if (!wish?.trim()) return NextResponse.json({ error: "wish is required" }, { status: 400 });

  // 1. 検索語を作る（LLM → 失敗ならルールベース）
  const plan = await buildQueries(wish.trim());
  const usedLlmQuery = Boolean(plan);
  const cores = coreNouns(wish.trim());
  const queriesFor = (id: RetainerId, twists: string[]): string[] => {
    const fromLlm = plan?.[id]?.query;
    const twist = twists[Math.floor(Math.random() * twists.length)];
    const fallback = [...cores.map((c) => `${c} ${twist}`), ...cores];
    return fromLlm ? [fromLlm, ...fallback] : fallback;
  };

  // 2. 楽天で引く
  const cast = lineup();
  const pools: Partial<Record<RetainerId, Item[]>> = {};
  const hits: Partial<Record<RetainerId, string>> = {};
  const seen = new Set<string>();
  for (const r of cast) {
    try {
      const { items, hit } = await searchAny(queriesFor(r.id, r.twists), 20);
      const pool = items.filter((i) => !seen.has(i.itemCode)).slice(0, 6);
      if (pool.length) { pools[r.id] = pool; hits[r.id] = hit; }
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "楽天 API の呼び出しに失敗しました" },
        { status: 502 });
    }
  }

  // 3. 選ばせて口上を書かせる（LLM → 失敗ならランダム＋定型）
  const picks = await pickOfferings(wish.trim(), pools);

  const offerings: Offering[] = [];
  for (const r of cast) {                      // 宰相が最後になる並び
    const pool = pools[r.id];
    if (!pool?.length) continue;
    const chosen = picks?.[r.id];
    let item = chosen?.item ?? pool[Math.floor(Math.random() * pool.length)];
    if (seen.has(item.itemCode)) item = pool.find((i) => !seen.has(i.itemCode)) ?? item;
    seen.add(item.itemCode);
    offerings.push({
      retainer: r, item, query: hits[r.id] ?? "",
      speech: chosen?.speech ?? r.speech[Math.floor(Math.random() * r.speech.length)],
    });
  }

  // 差し替え（/api/rethink）で使えるよう、候補リストもそのまま返す
  const poolOut: Record<string, { items: Item[]; currentIndex: number }> = {};
  for (const o of offerings) {
    const pool = pools[o.retainer.id];
    if (!pool) continue;
    const at = pool.findIndex((i) => i.itemCode === o.item.itemCode);
    poolOut[o.retainer.id] = { items: pool, currentIndex: at < 0 ? 0 : at };
  }

  return NextResponse.json({
    offerings,
    pools: poolOut,
    meta: { llm: { queries: usedLlmQuery, picks: Boolean(picks), enabled: llmReady() } },
  });
}
