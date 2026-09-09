/**
 * 楽天市場 商品検索 API（2026 年の移行後エンドポイント）。
 * https://webservice.rakuten.co.jp/documentation/ichiba-item-search
 *
 * バックエンドサービス登録の送信元 IP 制限があるため、登録済みの IP からしか通らない。
 * Snowflake から実行時に呼ぶ構成は現実的でない見込み（../docs/tech/05-rakuten-api.md）。
 */
import type { Item } from "./types";

const ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";
const NG = ["アダルト", "18禁", "成人", "ジャンク", "【中古】", "中古品"];
const MIN_INTERVAL = 850; // 連続呼び出しは 429 になる
const cache = new Map<string, Item[]>();
let chain: Promise<unknown> = Promise.resolve();
let last = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 呼び出しを直列化し、最低間隔を空ける */
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = MIN_INTERVAL - (Date.now() - last);
    if (wait > 0) await sleep(wait);
    last = Date.now();
    return fn();
  });
  chain = run.catch(() => {});
  return run as Promise<T>;
}

/**
 * 楽天の商品名は装飾と煽り文句だらけなので、読める形に削る。
 * 例: 「【送料無料】 馬油シャンプー詰替 1000ml×10個セット (4513...)」→「馬油シャンプー詰替 1000ml×10個セット」
 */
const NOISE = [
  /[【\[［(（〔《][^】\]］)）〕》]{0,40}[】\]］)）〕》]/g,  // 括弧で囲まれた宣伝
  /(送料無料|送料込|あす楽|即納|正規品|新品|楽天\s*\d+\s*冠|ランキング\d*位|最安|激安|大特価|限定|セール|SALE|クーポン|ポイント\s*\d+\s*倍|P\d+倍|訳あり|まとめ買い)/gi,
  /[★☆◆◇■□▼▲※!！]+/g,
  /\s*\/\s*$/,
];

export function cleanName(raw: string): string {
  let s = raw;
  for (const re of NOISE) s = s.replace(re, " ");
  s = s.replace(/\s{2,}/g, " ").replace(/^[\s\-–—、,.]+|[\s\-–—、,.]+$/g, "").trim();
  if (s.length < 4) s = raw.replace(/\s{2,}/g, " ").trim();   // 削りすぎたら元に戻す
  // 区切り記号で切って、意味のある頭の部分だけ残す
  const head = s.split(/\s[|｜/／]\s|\s{2,}/)[0].trim();
  return (head.length >= 6 ? head : s).slice(0, 42);
}

function bigImage(url: string): string {
  return url ? `${url.split("?")[0]}?_ex=500x500` : "";
}

export async function search(query: string, hits = 20): Promise<Item[]> {
  const cached = cache.get(query);
  if (cached) return cached;

  const appId = process.env.RAKUTEN_APP_ID ?? "";
  const key = process.env.RAKUTEN_ACCESS_KEY ?? "";
  if (!appId || !key) throw new Error("RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEY が未設定です");

  const params = new URLSearchParams({
    applicationId: appId, accessKey: key, keyword: query,
    hits: String(hits), imageFlag: "1", sort: "standard",
  });

  const items = await throttled(async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`${ENDPOINT}?${params}`, { cache: "no-store" });
      if (res.status === 429 && attempt < 2) { await sleep(1200 * (attempt + 1)); continue; }
      if (!res.ok) {
        let detail = "";
        try { detail = ((await res.json()) as { errors?: { errorMessage?: string } }).errors?.errorMessage ?? ""; } catch { /* 本文なし */ }
        throw new Error(`Rakuten API ${res.status}${detail ? ` ${detail}` : ""}`);
      }
      const data = (await res.json()) as { Items?: { Item?: RawItem }[] };
      return (data.Items ?? [])
        .map((row) => (row.Item ?? row) as unknown as RawItem)
        .filter((it) => it?.itemName && !NG.some((w) => it.itemName.includes(w)))
        .map(toItem)
        .filter((it) => it.image);
    }
    return [];
  });

  cache.set(query, items);
  return items;
}

type RawItem = {
  itemCode?: string; itemName: string; itemPrice?: number; itemUrl?: string; shopName?: string;
  mediumImageUrls?: { imageUrl: string }[]; smallImageUrls?: { imageUrl: string }[];
};

function toItem(it: RawItem): Item {
  const img = it.mediumImageUrls?.[0]?.imageUrl ?? it.smallImageUrls?.[0]?.imageUrl ?? "";
  return {
    itemCode: it.itemCode ?? "", name: it.itemName, displayName: cleanName(it.itemName),
    price: it.itemPrice ?? 0, image: bigImage(img), url: it.itemUrl ?? "", shop: it.shopName ?? "",
  };
}

/** 候補の語を順に試し、最初に当たったものを返す */
export let lastError: string | null = null;

export async function searchAny(queries: string[], hits = 20): Promise<{ items: Item[]; hit: string }> {
  for (const q of queries) {
    if (!q?.trim()) continue;
    try {
      const items = await search(q.trim(), hits);
      if (items.length) { lastError = null; return { items, hit: q.trim() }; }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      // 認証・IP 拒否は候補を変えても直らないので、無駄に叩かない
      if (/403|401/.test(lastError)) break;
    }
  }
  return { items: [], hit: queries[0] ?? "" };
}
