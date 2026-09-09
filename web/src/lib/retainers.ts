export type RetainerId = "merchant" | "noble" | "knight" | "farmer" | "chancellor";

export type Retainer = {
  id: RetainerId;
  name: string;
  emoji: string;
  color: string;
  /** LLM が落ちたときのフォールバック用の検索語 */
  twists: string[];
  speech: string[];
};

/** 5 人固定。宰相は必ず最後（まとも枠）。 */
export const RETAINERS: Retainer[] = [
  {
    id: "merchant", name: "商人", emoji: "🧺", color: "#c9762a",
    twists: ["おもちゃ", "ミニチュア", "グッズ"],
    speech: ["王子！なんと本日限りにございます！", "在庫はあとわずか、お求めやすく！", "これはお買い得にございますぞ！"],
  },
  {
    id: "noble", name: "貴族", emoji: "🎩", color: "#8b5fbf",
    twists: ["高級", "ブランド", "インテリア"],
    speech: ["ふふ、お目が高い。", "格式というものを、ご覧に入れましょう。", "これぞ王家にふさわしき一品かと。"],
  },
  {
    id: "knight", name: "騎士", emoji: "🛡️", color: "#4a7ba7",
    twists: ["セット", "本格", "アウトドア"],
    speech: ["実用に耐えまする。お納めください。", "この身に代えても、と選び抜きました。", "堅牢にございます。間違いございませぬ。"],
  },
  {
    id: "farmer", name: "農民", emoji: "🌾", color: "#7a9a3c",
    twists: ["食品", "詰め合わせ", "1kg"],
    speech: ["うちの村の精一杯でごぜぇます……", "こ、こんなもんしか無ぇですが……", "みんなで持ち寄ったですだ！"],
  },
  {
    id: "chancellor", name: "宰相", emoji: "📜", color: "#5f6b7a",
    twists: ["入門 セット", "実用", "体験"],
    speech: ["現実的な線で申し上げます。", "夢はございませんが、確実にございます。", "予算と実現性を考えますと、これに尽きます。"],
  },
];

export const BY_ID = Object.fromEntries(RETAINERS.map((r) => [r.id, r])) as Record<RetainerId, Retainer>;

export type ReasonCode = "rude" | "cheap" | "not_my_taste" | "too_pricey" | "off_point" | "silent";

export const REASONS: { code: ReasonCode; label: string; anim: AnimId | null }[] = [
  { code: "rude", label: "無礼者！", anim: "cannon" },
  { code: "cheap", label: "安っぽい", anim: "stamp" },
  { code: "not_my_taste", label: "趣味ではない", anim: "fall" },
  { code: "too_pricey", label: "高すぎる", anim: "stamp" },
  { code: "off_point", label: "解釈違いじゃ", anim: "drag" },
  { code: "silent", label: "無言で斬る", anim: null },
];

export type AnimId = "fall" | "drag" | "cannon" | "stamp";
/** 地味 → 派手 */
export const ANIM_ORDER: AnimId[] = ["fall", "drag", "stamp", "cannon"];

export function pickAnim(reason: ReasonCode, combo: number, used: AnimId[]): AnimId {
  if (combo >= 5) return "cannon";                        // 5 人目は一番派手に固定
  const mapped = REASONS.find((r) => r.code === reason)?.anim;
  if (mapped) return mapped;
  const unused = ANIM_ORDER.filter((a) => !used.includes(a));
  const pool = unused.length ? unused : ANIM_ORDER;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const SAMPLE_WISHES = [
  "でっかい城が欲しいのじゃ", "白馬に乗りたいのじゃ", "黄金が欲しいのじゃ",
  "不老不死の薬をよこせ", "世界を征服したいのじゃ", "最強の剣を持て",
  "空を飛びたいのじゃ", "宴じゃ、ごちそうを持て", "海が欲しいのじゃ",
  "星が欲しいのじゃ", "忠実な側近が欲しい", "無敵の軍隊が欲しいのじゃ",
];
