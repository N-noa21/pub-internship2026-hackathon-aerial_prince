import type { AnimId, ReasonCode, Retainer } from "./retainers";

export type Item = {
  itemCode: string;
  /** 楽天の生の商品名。装飾だらけなので詳細表示でのみ使う */
  name: string;
  /** 画面に出す短い呼び名。LLM が付ける。無ければ name を整形したもの */
  displayName: string;
  price: number;
  image: string;
  url: string;
  shop: string;
};

export type Offering = {
  retainer: Retainer;
  item: Item;
  speech: string;
  query: string;
};

export type Mood = "pitch" | "desperate" | "resigned";

export type Turn = { from: "prince" | "retainer"; text: string; mood?: Mood };

export type Judgment = {
  retainer: Retainer;
  item: Item;
  verdict: "BEHEAD" | "ADOPT";
  reasonCode: ReasonCode;
  reasonLabel: string;
  /** 「なぜ選ばなかったのか」の自由記述。任意 */
  reasonText?: string;
  /** その家臣との問答 */
  dialogue?: Turn[];
  anim: AnimId | null;
};

export type EndingResult = {
  title: string;
  fable: string;
  epilogue: string;
  scores: Record<string, number>;
};
