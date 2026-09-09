/**
 * キャラクターの立ち絵。
 * 画像が無い家臣は絵文字にフォールバックする（Stage.tsx / Beheading.tsx 側で分岐）。
 */
import type { StaticImageData } from "next/image";
import heishi from "@/assets/heishi.png";
import kenshi from "@/assets/kenshi.png";
import noumin from "@/assets/noumin.png";
import noumin_fufu from "@/assets/noumin_fufu.png";
import noumin_oji from "@/assets/noumin_oji.png";
import prince from "@/assets/prince.png";
import renkinjutsu from "@/assets/renkinjutsu.png";
import type { RetainerId } from "./retainers";

/** 農民は 2 枚を席順で使い分ける */
export const FARMERS: StaticImageData[] = [noumin_oji, noumin];

/**
 * 配役。手持ちの絵に合わせて割り当てている。
 * - heishi（甲冑＋槍）    → 騎士
 * - kenshi（冠飾り＋マント）→ 宰相（格式ある役人に見えるため）
 * - noumin_fufu（かご一杯の作物）→ 商人（市の売り手）
 * - noumin_oji / noumin   → 農民
 * - renkinjutsu           → 錬金術師
 * 貴族の絵だけ手持ちに無いので、いまは登場させていない（retainers.ts の ROTATING_IDS）
 */
export const ART: Partial<Record<RetainerId, StaticImageData>> = {
  merchant: noumin_fufu,
  knight: heishi,
  farmer: noumin_oji,
  alchemist: renkinjutsu,
  chancellor: kenshi,
};

export const GUARD = heishi;   // 打ち首のとき連行に来る衛兵
export const PRINCE = prince;  // タイトルとロード画面の王子

/** 家臣 1 人ぶんの立ち絵を返す。農民だけは席順で絵を変える。 */
export function artFor(id: RetainerId, variant = 0): StaticImageData | undefined {
  if (id === "farmer") return FARMERS[variant % FARMERS.length];
  return ART[id];
}
