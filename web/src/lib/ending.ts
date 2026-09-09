import { fallbackTimeline } from "./chronicle";
import type { EndingResult, Judgment } from "./types";
import type { Offering } from "./types";

const FABLES: Record<string, [string, string]> = {
  naked_king: ["裸の王様", "諫言する者はもはや城にいない。王子の周りには、うなずく者だけが残った。"],
  warashibe: ["わらしべ長者", "その粗末な品は隣村の祭りで評判を呼び、やがて国の名物となった。"],
  midas: ["ミダス王の黄金", "望みは叶った。ただし、望んだ量のちょうど百分の一の大きさで。"],
  three_wish: ["三つの願い", "王子は望みを一度きり使い、そしてそれを使い切った。"],
  prudent: ["堅実なる治世", "国庫は減らず、民は困らず、そして誰の記憶にも残らなかった。"],
};

export function judge(judgments: Judgment[], outcome: "ADOPTED" | "ALL_BEHEADED", adopted: Offering | null): EndingResult {
  const behead = judgments.filter((j) => j.verdict === "BEHEAD").length;
  const price = adopted?.item.price ?? 0;
  const rid = adopted?.retainer.id;
  const silent = judgments.every((j) => j.reasonCode === "silent");
  const spoken = judgments.filter((j) => j.verdict === "BEHEAD" && j.reasonCode !== "silent");

  const key = outcome === "ALL_BEHEADED" ? "naked_king"
    : rid === "chancellor" ? "prudent"
    : rid === "farmer" ? "warashibe"
    : price >= 10000 ? "midas" : "three_wish";
  const [fable, base] = FABLES[key];

  const title = outcome === "ALL_BEHEADED" ? (silent ? "無言の粛清者" : "五人斬りの暴君")
    : rid === "chancellor" ? "正論に屈した王"
    : rid === "farmer" ? "民の心を買った王"
    : price >= 10000 ? "値札を見ぬ王" : "つつましき暴君";

  let epilogue = base;
  if (spoken.length) epilogue += `\n\n王子は「${spoken[0].reasonLabel}」と言い放った。その一言は、長く語り継がれた。`;
  else if (outcome === "ALL_BEHEADED") epilogue += "\n\n王子は最後まで、ひとことも理由を述べなかった。";
  if (adopted) {
    epilogue += `\n\n国庫からの支出は ${adopted.item.price.toLocaleString()} 円。献上したのは${adopted.retainer.name}であった。`;
  }

  return {
    title, fable, epilogue,
    era: "下民",
    timeline: fallbackTimeline(judgments.map((j) => ({ name: j.retainer.name, verdict: j.verdict, item: j.item.displayName })), outcome),
    scores: {
      暴君度: Math.min(100, behead * 20),
      浪費度: Math.min(100, Math.floor(price / 200)),
      堅実さ: rid === "chancellor" ? 90 : Math.max(0, 40 - behead * 8),
      民の信頼: rid === "farmer" ? 80 : Math.max(0, 70 - behead * 14),
      口の悪さ: Math.min(100, spoken.length * 20),
    },
  };
}

export { FABLES };
