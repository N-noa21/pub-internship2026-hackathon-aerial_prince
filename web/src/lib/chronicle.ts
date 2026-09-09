/** 年代記の見せ方まわりの小道具 */
import type { Chronology } from "./types";

/** 1 → 元年、2 → 二年、10 → 十年、12 → 十二年、24 → 二十四年 */
export function kanjiYear(n: number): string {
  if (n <= 1) return "元年";
  const d = "〇一二三四五六七八九";
  if (n < 10) return `${d[n]}年`;
  if (n < 100) {
    const t = Math.floor(n / 10), o = n % 10;
    return `${t > 1 ? d[t] : ""}十${o ? d[o] : ""}年`;
  }
  return `${n}年`;
}

/** 「。」「！」「？」ごとに改行して読みやすくする（閉じ括弧の直前では切らない） */
export function paragraphs(text: string): string {
  return text
    .replace(/\r?\n+/g, "\n")
    .replace(/([。！？])(?![」』）\n])/g, "$1\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** LLM が落ちたときの年表。判決から機械的に組む */
export function fallbackTimeline(cast: { name: string; verdict: "ADOPT" | "BEHEAD"; item: string }[], outcome: "ADOPTED" | "ALL_BEHEADED"): Chronology[] {
  const t: Chronology[] = [{ year: 1, event: "王子、謁見を開く" }];
  let y = 1;
  for (const c of cast) {
    y += 1 + Math.floor(Math.random() * 2);
    t.push({ year: y, event: c.verdict === "BEHEAD" ? `${c.name}、打ち首` : `${c.name}の${c.item.slice(0, 8)}を採用` });
  }
  y += 4 + Math.floor(Math.random() * 6);
  t.push({ year: y, event: outcome === "ALL_BEHEADED" ? "王子処刑" : "王子、玉座を追われる" });
  return t.slice(0, 6);
}
