/**
 * 共有。サーバーを持たず、結果を URL に畳み込む方式。
 * - 文章共有: Web Share API → 無ければクリップボード
 * - 画像保存: Canvas で一枚絵にする（商品画像は同一オリジンの /api/img 経由で取り、canvas 汚染を避ける）
 * - 結果 URL: /r?d=<base64(JSON)> で読み取り専用の顛末を開ける
 */
import { kanjiYear, paragraphs } from "./chronicle";
import type { EndingResult, Judgment, Offering } from "./types";

export type Shared = {
  v: 1;
  wish: string;
  title: string; fable: string; epilogue: string;
  scores: Record<string, number>;
  era?: string;
  timeline?: { year: number; event: string }[];
  adopted: { name: string; price: number; image: string; by: string } | null;
  cast: { id: string; name: string; verdict: "ADOPT" | "BEHEAD"; item: string; price: number; image: string; url: string }[];
};

export function pack(res: EndingResult, adopted: Offering | null, judgments: Judgment[], wish: string): Shared {
  return {
    v: 1, wish, title: res.title, fable: res.fable, epilogue: res.epilogue, scores: res.scores,
    era: res.era, timeline: res.timeline,
    adopted: adopted ? { name: adopted.item.displayName, price: adopted.item.price, image: adopted.item.image, by: adopted.retainer.name } : null,
    cast: judgments.map((j) => ({ id: j.retainer.id, name: j.retainer.name, verdict: j.verdict, item: j.item.displayName, price: j.item.price, image: j.item.image, url: j.item.url })),
  };
}

const enc = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const dec = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

export function toUrl(d: Shared): string {
  const base = typeof location !== "undefined" ? location.origin : "";
  return `${base}/r?d=${enc(JSON.stringify(d))}`;
}
export function fromParam(p: string | null): Shared | null {
  if (!p) return null;
  try { const d = JSON.parse(dec(p)); return d?.v === 1 ? (d as Shared) : null; } catch { return null; }
}

export function shareText(d: Shared): string {
  const got = d.adopted ? `${d.adopted.name}（${d.adopted.price.toLocaleString()}円）` : "なし";
  const beheaded = d.cast.filter((c) => c.verdict === "BEHEAD").length;
  const last = d.timeline?.length ? d.timeline[d.timeline.length - 1] : null;
  const tail = last && d.era ? `\n${d.era}${kanjiYear(last.year)}　${last.event}` : "";
  return `【下民ショッピング】\n「${d.wish}」と申した王子は「${d.title}」となった。\n手にした物: ${got} ／ 打ち首: ${beheaded} 人\n— ${d.fable} —${tail}`;
}

/** Web Share API。使えなければクリップボードにコピー。戻り値は "shared" | "copied" | "failed" */
export async function share(d: Shared): Promise<"shared" | "copied" | "failed"> {
  const text = shareText(d); const url = toUrl(d);
  try {
    if (typeof navigator !== "undefined" && navigator.share) { await navigator.share({ title: "下民ショッピング", text, url }); return "shared"; }
  } catch (e) { if ((e as Error).name === "AbortError") return "failed"; }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); return "copied"; } catch { return "failed"; }
}

/* ------------------------------------------------------------ 結果画像 */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const ch of para) {
      if (ctx.measureText(line + ch).width > max && line) { out.push(line); line = ch; } else line += ch;
    }
    out.push(line);
  }
  return out;
}

async function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im); im.onerror = () => resolve(null);
    im.src = src;
  });
}

/** 縦長の一枚絵（1080×1350）。戻り値は PNG の Blob */
export async function renderImage(d: Shared): Promise<Blob | null> {
  const W = 1080, H = 1350;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d"); if (!ctx) return null;
  const serif = '"Hiragino Mincho ProN","Yu Mincho",serif';

  // 背景（深紅）と羊皮紙
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#2a0f10"); bg.addColorStop(1, "#150708");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#d9b544"; ctx.fillRect(60, 60, W - 120, H - 120);
  const pg = ctx.createLinearGradient(0, 70, 0, H - 70); pg.addColorStop(0, "#f9f0d9"); pg.addColorStop(1, "#dbc79a");
  ctx.fillStyle = pg; ctx.fillRect(68, 68, W - 136, H - 136);

  ctx.textAlign = "center"; ctx.fillStyle = "#8a6a1c";
  ctx.font = `600 22px ${serif}`; ctx.fillText("下 民 シ ョ ッ ピ ン グ ・ 王 国 年 代 記", W / 2, 130);
  ctx.fillStyle = "#4a3220"; ctx.font = `500 30px ${serif}`;
  ctx.fillText(`「${d.wish}」`, W / 2, 190);

  ctx.fillStyle = "#7d1010"; ctx.font = `900 74px ${serif}`;
  ctx.fillText(d.title, W / 2, 300);
  ctx.fillStyle = "#8a6a1c"; ctx.font = `500 26px ${serif}`;
  ctx.fillText(`— ${d.fable} —`, W / 2, 350);

  ctx.strokeStyle = "#b99a54"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(140, 390); ctx.lineTo(W - 140, 390); ctx.stroke();

  // 後日談
  ctx.textAlign = "left"; ctx.fillStyle = "#2c1c12"; ctx.font = `500 31px ${serif}`;
  let y = 450;
  for (const ln of wrap(ctx, paragraphs(d.epilogue), W - 280)) { ctx.fillText(ln, 140, y); y += 50; }
  if (d.timeline?.length) {
    y += 16;
    ctx.fillStyle = "#8a6a1c"; ctx.font = `600 22px ${serif}`; ctx.fillText(`${d.era ?? ""}年表`, 140, y); y += 34;
    ctx.fillStyle = "#2c1c12"; ctx.font = `500 26px ${serif}`;
    for (const t of d.timeline) { ctx.fillText(`${d.era ?? ""}${kanjiYear(t.year)}　${t.event}`, 160, y); y += 36; }
  }
  y += 24;

  // 戦利品
  if (d.adopted) {
    const im = d.adopted.image ? await loadImg(`/api/img?u=${encodeURIComponent(d.adopted.image)}`) : null;
    if (im) {
      ctx.fillStyle = "#fffaf0"; ctx.fillRect(140, y, 200, 200);
      ctx.strokeStyle = "#8a6a1c"; ctx.strokeRect(140, y, 200, 200);
      const s = Math.min(180 / im.width, 180 / im.height);
      ctx.drawImage(im, 240 - im.width * s / 2, y + 100 - im.height * s / 2, im.width * s, im.height * s);
    }
    ctx.fillStyle = "#8a6a1c"; ctx.font = `600 22px ${serif}`; ctx.fillText("王子が手にした物", 370, y + 40);
    ctx.fillStyle = "#2c1c12"; ctx.font = `700 34px ${serif}`;
    for (const ln of wrap(ctx, d.adopted.name, W - 520).slice(0, 2)) { ctx.fillText(ln, 370, y + 90); y += 42; }
    ctx.fillStyle = "#7d1010"; ctx.font = `900 44px ${serif}`; ctx.fillText(`${d.adopted.price.toLocaleString()} 円`, 370, y + 110);
    ctx.fillStyle = "#8a6a1c"; ctx.font = `500 22px ${serif}`; ctx.fillText(`${d.adopted.by}より`, 370, y + 150);
    y += 240;
  } else {
    ctx.fillStyle = "#7d1010"; ctx.font = `700 34px ${serif}`; ctx.fillText("王子は何も手にせず、家臣を斬り尽くした。", 140, y + 40); y += 100;
  }

  // 評定
  ctx.fillStyle = "#8a6a1c"; ctx.font = `600 22px ${serif}`; ctx.fillText("評 定", 140, y);
  y += 30;
  for (const [k, v] of Object.entries(d.scores)) {
    ctx.fillStyle = "#2c1c12"; ctx.font = `500 26px ${serif}`; ctx.fillText(k, 140, y + 24);
    ctx.fillStyle = "#e8dcc0"; ctx.fillRect(300, y, 560, 22);
    const g = ctx.createLinearGradient(300, 0, 860, 0); g.addColorStop(0, "#8f1b1b"); g.addColorStop(1, "#d9b544");
    ctx.fillStyle = g; ctx.fillRect(300, y, 560 * v / 100, 22);
    ctx.fillStyle = "#7d1010"; ctx.textAlign = "right"; ctx.fillText(String(v), 930, y + 24); ctx.textAlign = "left";
    y += 44;
  }

  // 家臣
  y += 20;
  ctx.fillStyle = "#8a6a1c"; ctx.font = `600 22px ${serif}`; ctx.fillText("家 臣 た ち", 140, y); y += 40;
  ctx.font = `500 26px ${serif}`;
  for (const c of d.cast) {
    ctx.fillStyle = c.verdict === "ADOPT" ? "#8a6a1c" : "#7d1010";
    ctx.fillText(`${c.verdict === "ADOPT" ? "👑 採用" : "🗡 打ち首"}　${c.name}　${c.item}（${c.price.toLocaleString()}円）`, 140, y); y += 40;
  }

  return new Promise((resolve) => cv.toBlob((b) => resolve(b), "image/png"));
}
