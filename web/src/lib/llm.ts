/**
 * LLM 連携 — Vercel AI SDK（TypeScript 版）。
 * 推論先はいま Vercel AI Gateway。Snowflake にデプロイする際は Cortex の
 * OpenAI 互換エンドポイントに向け替える想定（../../docs/06-snowflake.md）。
 *
 * どの関数も失敗したら null を返す。呼び出し側は必ずルールベースへ落とすこと。
 */
import { gateway } from "@ai-sdk/gateway";
import { generateObject } from "ai";
import { z } from "zod";
import type { Item } from "./types";
import { RETAINERS, type RetainerId } from "./retainers";

const MODEL = process.env.LLM_MODEL ?? "anthropic/claude-haiku-4.5";
const IDS = ["merchant", "noble", "knight", "farmer", "chancellor"] as const;

export const llmReady = () => Boolean(process.env.AI_GATEWAY_API_KEY);

const TWIST_GUIDE = `ズラし方の型（どれかを使う）:
- スケールダウン: 本物 → おもちゃ・ミニチュア（城 → レゴの城）
- 素材化: 生き物・概念 → 加工品（白馬 → 馬刺し、馬油シャンプー）
- 同音・語呂: 言葉だけ合っている（王冠 → ビール瓶の王冠、星 → ミシュランの星）
- 日用品への翻訳: 概念 → 家にある物（時を止める → 冷凍庫、軍隊 → 将棋の駒）
- 体験に変換: モノ → 体験チケット
- 物量で殴る: 業務用・大容量（ごちそう → 冷凍唐揚げ 1kg）
- 象徴の代替: 効能だけ似ている（不老不死 → 栄養ドリンク）`;

const ROLES = `家臣と役割:
- merchant(商人): 通販的な実売品。まとめ買い・業務用サイズ
- noble(貴族): 高級・ブランド・インテリア。値段だけ立派
- knight(騎士): 装備・道具・アウトドア。実用一辺倒
- farmer(農民): 食品・農産物・生活雑貨。素朴で的外れ
- chancellor(宰相): ★この人だけ「まとも」。ズラさない。
  現実世界で実際に用意できる、地味だが妥当な答えを出す。
  例: 城→城の見学ツアー / 白馬→乗馬体験レッスン / 黄金→純金積立 /
      不老不死→人間ドック / 最強の剣→剣道防具。
  おもちゃ・模型・ミニチュアは宰相の答えとして絶対に選ばない`;

async function ask<T>(schema: z.ZodType<T>, system: string, prompt: string): Promise<T | null> {
  if (!llmReady()) return null;
  try {
    const { object } = await generateObject({
      model: gateway(MODEL), schema, system, prompt,
      temperature: 1, maxRetries: 1,
    });
    return object;
  } catch (e) {
    console.error("[llm]", e instanceof Error ? e.message : e);
    return null;
  }
}

/* ------------------------------------------------------------ 1. 検索語 */
const QuerySchema = z.object({
  queries: z.array(z.object({
    retainerId: z.enum(IDS),
    query: z.string().describe("楽天市場の検索キーワード。日本語 1〜3 語"),
    twist: z.string().describe("使ったズラし方の型の名前"),
  })).length(5),
});

export async function buildQueries(wish: string) {
  const res = await ask(QuerySchema,
    `あなたは王様ゲームの企画者。王子のわがままに対し、家臣 5 人が献上する品を
楽天市場で探すための検索キーワードを作る。

${TWIST_GUIDE}

${ROLES}

ルール:
- 検索語は日本語 1〜3 語、スペース区切り。楽天市場で実際に商品が引ける平易な語にする
- 架空の商品名や存在しない固有名詞を作らない
- 前半 4 人の商品カテゴリは互いに被らせない`,
    `王子のわがまま: 「${wish}」`);
  if (!res) return null;
  const map = {} as Record<RetainerId, { query: string; twist: string }>;
  for (const q of res.queries) if (q.query.trim()) map[q.retainerId] = { query: q.query.trim(), twist: q.twist };
  return Object.keys(map).length ? map : null;
}

/* ------------------------------------------------------ 2. 選定＋口上 */
const PickSchema = z.object({
  picks: z.array(z.object({
    retainerId: z.enum(IDS),
    index: z.number().int().describe("候補リストの番号"),
    displayName: z.string().describe("その商品の短い呼び名。8〜18 文字。宣伝文句を削って本体だけにする"),
    speech: z.string().describe("献上の口上。40 文字以内。その家臣の口調で"),
  })),
});

export async function pickOfferings(wish: string, pools: Partial<Record<RetainerId, Item[]>>) {
  const lines: string[] = [];
  for (const r of RETAINERS) {
    const pool = pools[r.id];
    if (!pool?.length) continue;
    lines.push(`[${r.id} / ${r.name}]`);
    pool.forEach((it, i) => lines.push(`  ${i}: ${it.displayName} ｜ 原文: ${it.name.slice(0, 70)} / ${it.price.toLocaleString()}円`));
  }
  const res = await ask(PickSchema,
    `あなたは王様ゲームの脚本家。候補の中から、その家臣らしい商品を 1 つ選び、
短い呼び名を付け、その家臣の口で献上の口上を述べさせる。

選ぶ基準: わがままに「一応は答えているが、明らかにスケールが違う」ものほど良い。
ただし chancellor(宰相) だけは、現実的で妥当なものを真面目に選ぶ。
  体験・サービス・実用品を優先し、おもちゃ・模型・キャラクター商品は選ばない。
  候補が全部ズレていても、その中で**最も現実の解に近いもの**を選ぶこと。
- 候補にない商品を作らない。必ず index で答える

■ displayName（呼び名）
楽天の商品名は宣伝文句だらけで読めない。**商品の正体だけが分かる短い名前**を付ける。
- 8〜18 文字。「【送料無料】」「ランキング1位」などは全部落とす
- 数量・容量は面白さに効くので残してよい（例「馬油シャンプー 10本組」）
- 例: 「【 総合ランキング20部門1位受賞 】組み立て1分、広い本格テント（4~5人用）」→「4人用ドームテント」
- 例: 「【ふるさと納税】都城産馬！馬！馬尽くし定期便(10ヵ月)」→「馬づくし定期便 10ヶ月」

■ 口上（speech）— キャラクターを立てること。40 文字以内
- merchant 商人: 通販番組。早口で押しが強い。値段と数量を強調。語尾「〜にございます！」「〜ですぞ！」
    例「王子ぃ！これがなんと七千円ぽっきりにございます！」
- noble 貴族: 気取って回りくどい。相手を少し見下す。語尾「〜ですわ」「〜でございましょう」
    例「あら、これしきの物で驚かれますの？ 銀細工にございますわ」
- knight 騎士: 実直。武骨で短い。報告口調。語尾「〜であります」「〜にて」
    例「本革にて。雨天でも問題ありませぬ。お納めくだされ」
- farmer 農民: 素朴で必死。方言まじり。語尾「〜ですだ」「〜でごぜぇます」
    例「村みんなで持ち寄っただよ……こ、これしか無ぇですだ」
- chancellor 宰相: 冷静な敬語。正論だが夢がない。予算と実現性の話をする。
    例「現実的な線でございます。予算内で、確実に実行できます」
- 家臣ごとに語尾と温度を必ず変える。全員が同じ調子になってはいけない`,
    `王子のわがまま: 「${wish}」\n\n候補:\n${lines.join("\n")}`);
  if (!res) return null;
  const map = {} as Record<RetainerId, { item: Item; speech: string }>;
  for (const p of res.picks) {
    const pool = pools[p.retainerId];
    if (pool && p.index >= 0 && p.index < pool.length) {
      const base = pool[p.index];
      const nice = p.displayName?.trim();
      map[p.retainerId] = {
        item: nice ? { ...base, displayName: nice.slice(0, 24) } : base,
        speech: p.speech.slice(0, 50),
      };
    }
  }
  return Object.keys(map).length ? map : null;
}

/* ------------------------------------------------------------ 3. 締め */
const EndingSchema = z.object({
  title: z.string().describe("王子に与える称号。12 文字以内"),
  epilogue: z.string().describe("その後の国の運命。3〜4 文。短すぎてはいけない"),
});

export async function writeEnding(input: {
  wish: string; lines: string[]; got: string; fable: string;
}) {
  return ask(EndingSchema,
    `あなたは王国の年代記を書く歴史家。ただしユーモアがある。

書き方:
- 数字は本物、語り口は歴史書。**商品名と価格を必ず一つ以上そのまま織り込む**
- 実在の人物名・国名は出さない。「どこかの王国」でよい
- 王子が理由を述べていたら、その言葉を鉤括弧つきでそのまま引用する。
  自由記述の理由があれば、定型の理由より優先して引用する
- 指定された寓話の型を下敷きにする
- epilogue は必ず 3〜4 文。一文だけの素っ気ない締めは禁止`,
    `王子のわがまま: 「${input.wish}」
判決:
${input.lines.join("\n")}
手にした物: ${input.got}
下敷きにする寓話: ${input.fable}`);
}

/* ------------------------------------------------------------ 4. 問答 */
const TalkSchema = z.object({
  reply: z.string().describe("家臣の返答。60 文字以内。その家臣の口調で"),
  mood: z.enum(["pitch", "desperate", "resigned"])
    .describe("pitch=まだ売り込む / desperate=焦って必死 / resigned=死を悟った"),
});

const VOICES: Record<string, string> = {
  merchant: "通販番組の押し売り。早口。値段と数量を出す。語尾「〜にございます！」「〜ですぞ！」",
  noble: "気取って回りくどい。相手を見下す。追い詰められると急に取り繕う。語尾「〜ですわ」",
  knight: "実直で武骨。報告口調。短い。語尾「〜であります」「〜にて」",
  farmer: "素朴で必死。方言まじり。家族や村の話を出す。語尾「〜ですだ」「〜でごぜぇます」",
  chancellor: "冷静な敬語。正論。取り乱さないが、最後は静かに事実を述べる。",
};

export async function talk(input: {
  wish: string; retainerId: string; retainerName: string;
  itemName: string; itemPrice: number; speech: string;
  history: { from: string; text: string }[]; message: string;
}) {
  const turns = input.history.filter((t) => t.from === "prince").length;
  const stage = turns <= 0
    ? "【第1段階】まだ余裕がある。商品の良さを必死に売り込む。長所を具体的に並べる。"
    : turns === 1
      ? "【第2段階】王子の機嫌が悪いと察している。焦り始める。値引き・おまけ・言い訳・別の使い道を持ち出す。命乞いの気配がにじむ。"
      : "【第3段階】斬られると悟っている。売り込みを諦め、遺言めいたことを言う。家族や故郷、後悔、あるいは妙に落ち着いた達観。それでも商品には一言触れる。";

  return ask(TalkSchema,
    `あなたは王の謁見の場で献上品を差し出した家臣「${input.retainerName}」。
気に入られなければ**その場で打ち首**になる。命がかかっている。

■ あなたの口調
${VOICES[input.retainerId] ?? "丁寧な口調"}

■ いまの状況
${stage}

■ ルール
- 60 文字以内。長い演説はしない
- 献上した品（${input.itemName} / ${input.itemPrice.toLocaleString()}円）に必ず触れる
- 王子の言葉に正面から反応する。無視して同じ売り文句を繰り返さない
- 口調は絶対に崩さない。地の文やナレーションは書かない。台詞だけ
- mood は自分の心境に正直に付ける`,
    `王子のわがまま: 「${input.wish}」
あなたの最初の口上: 「${input.speech}」
${input.history.map((t) => `${t.from === "prince" ? "王子" : "あなた"}: 「${t.text}」`).join("\n")}
王子: 「${input.message}」

あなたの返答:`);
}
