import { buildQueries, llmReady, pickOne } from "@/lib/llm";
import { searchAny } from "@/lib/rakuten";
import { lineup, type RetainerId } from "@/lib/retainers";
import type { Item, Offering } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

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

/**
 * 献上品を NDJSON で逐次配信する。
 *   {type:"cast"}     … 顔ぶれ（すぐ）
 *   {type:"offering"} … 家臣一人ぶん（揃った順。宰相が最後）
 *   {type:"done"}
 * 楽天の検索は直列（レート制限）だが、選定の LLM は次の検索と並行して走らせる。
 */
export async function POST(req: Request) {
  const { wish } = (await req.json()) as { wish?: string };
  if (!wish?.trim()) return new Response(JSON.stringify({ error: "wish is required" }), { status: 400 });
  const w = wish.trim();
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      const cast = lineup();
      emit({ type: "cast", cast, llm: llmReady() });

      const plan = await buildQueries(w);
      const cores = coreNouns(w);
      const queriesFor = (id: RetainerId, twists: string[]) => {
        const twist = twists[Math.floor(Math.random() * twists.length)];
        const fallback = [...cores.map((c) => `${c} ${twist}`), ...cores];
        const q = plan?.[id]?.query;
        return q ? [q, ...fallback] : fallback;
      };

      const seen = new Set<string>();
      type Slot = { r: (typeof cast)[number]; pool: Item[]; hit: string; pick: Awaited<ReturnType<typeof pickOne>> };
      // 家臣ごとの「揃ったら解決する」枠。検索ループと配信ループを同時に走らせる
      const slots = cast.map(() => {
        let resolve!: (v: Slot) => void;
        const promise = new Promise<Slot>((res) => { resolve = res; });
        return { promise, resolve };
      });

      void (async () => {
        for (let i = 0; i < cast.length; i++) {
          const r = cast[i];
          let items: Item[] = []; let hit = "";
          try { ({ items, hit } = await searchAny(queriesFor(r.id, r.twists), 20)); } catch { /* 空のまま */ }
          const pool = items.filter((x) => !seen.has(x.itemCode)).slice(0, 6);
          pool.forEach((x) => seen.add(x.itemCode));
          if (!pool.length) { slots[i].resolve({ r, pool, hit, pick: null }); continue; }
          // 選定は待たずに次の検索へ。終わり次第この枠を解決する
          void pickOne(w, r.id, r.name, pool).catch(() => null)
            .then((pick) => slots[i].resolve({ r, pool, hit, pick }));
        }
      })();

      for (const slot of slots) {
        const { r, pool, hit, pick } = await slot.promise;
        if (!pool.length) continue;
        const item = pick?.item ?? pool[Math.floor(Math.random() * pool.length)];
        const offering: Offering = {
          retainer: r, item, query: hit,
          speech: pick?.speech ?? r.speech[Math.floor(Math.random() * r.speech.length)],
        };
        const at = pool.findIndex((x) => x.itemCode === item.itemCode);
        emit({ type: "offering", offering, pool: { items: pool, currentIndex: at < 0 ? 0 : at } });
      }
      emit({ type: "done", meta: { llm: { queries: Boolean(plan), enabled: llmReady() } } });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
