# 03. プロンプト設計

> [tech/README.md](README.md)

LLM 呼び出しは **3 つだけ**。増やすほど遅くなるので、まとめられるものはまとめる。

| # | 呼び出し | 入力 | 出力 |
| --- | --- | --- | --- |
| 1 | 検索語の生成 | わがまま | 家臣 5 人分の検索語 |
| 2 | 献上品の選定＋口上 | わがまま＋検索結果 | 家臣 5 人分の献上品と台詞 |
| 3 | エンディング生成 | プレイ結果＋下敷きの型 | 診断＋後日談 |

すべて**構造化出力（JSON スキーマ指定）**で受け取る。自由文で受けるとパースで詰まる。

## 1. 検索語の生成

**ここがこのゲームの面白さの中心。** [ズラし方の型](../02-mechanics.md#ズラし方の型プロンプト設計の中心)をそのまま指示に入れる。

指示の骨子:

- あなたは王子のわがままを聞いた家臣たちである
- 前半 4 人（商人・貴族・騎士・農民）は、**わざとズラした**検索語を作る。使う型を 1 つ選んで宣言する
- **宰相だけは、わがままに対する現実的で妥当な解**の検索語を作る
- 検索語は日本語 2〜4 語。実在の商品が引ける語にする（架空の商品名を書かない）
- 4 人の検索語は**商品カテゴリが互いに被らない**ようにする

```json
{
  "type": "object",
  "properties": {
    "queries": {
      "type": "array", "minItems": 5, "maxItems": 5,
      "items": {
        "type": "object",
        "properties": {
          "retainer_id": { "enum": ["merchant","noble","knight","farmer","chancellor"] },
          "query":       { "type": "string" },
          "twist_type":  { "enum": ["scale_down","material","pun","daily_item","experience","bulk","symbol","sane"] }
        },
        "required": ["retainer_id","query","twist_type"]
      }
    }
  },
  "required": ["queries"]
}
```

## 2. 献上品の選定＋口上

楽天の検索結果（家臣ごとに上位 N 件）を渡し、**1 件選ばせて口上まで書かせる**。5 人分を 1 回で取る。

指示の骨子:

- 候補の中から、**その家臣らしい 1 件**を選ぶ。候補外の商品名を作らない（`item_code` で返す）
- 口上はその家臣の口調で、**40 文字以内**。長いとテンポが死ぬ
- 宰相は真面目に、しかし**夢のない言い方**で述べる

```json
{
  "type": "object",
  "properties": {
    "offerings": {
      "type": "array", "minItems": 5, "maxItems": 5,
      "items": {
        "type": "object",
        "properties": {
          "retainer_id": { "enum": ["merchant","noble","knight","farmer","chancellor"] },
          "item_code":   { "type": "string" },
          "speech":      { "type": "string", "maxLength": 40 }
        },
        "required": ["retainer_id","item_code","speech"]
      }
    }
  },
  "required": ["offerings"]
}
```

- **`item_code` が候補に無い値だったら弾いて、その家臣の候補 1 位を使う。** 検証はコード側で必ず行う。

## 3. エンディング生成

プレイ結果と、選んだ**下敷きの型**（寓話 or 史実。[../04-ending.md](../04-ending.md#後日談)）を渡す。

渡す材料:

- わがまま、打ち首の数と相手、採用した献上品（商品名・**実際の価格**）、判決理由（あれば）
- 下敷きの型の `outline`

指示の骨子:

- **数字は本物、語り口は歴史書。** 価格や商品名はそのまま使い、荘厳な文体で語る
- 判決理由が入力されていれば、**プレイヤーの言葉を引用**する
- 実在の人物名・国名は出さない。「どこかの王国」でよい
- 後日談は 3〜4 文。長いと読まれない

```json
{
  "type": "object",
  "properties": {
    "title":    { "type": "string" },
    "verdict":  { "type": "string" },
    "scores":   {
      "type": "object",
      "properties": {
        "tyranny": {"type":"integer"}, "extravagance": {"type":"integer"},
        "taste": {"type":"integer"},   "trust": {"type":"integer"},
        "prudence": {"type":"integer"}
      }
    },
    "epilogue": { "type": "string" }
  },
  "required": ["title","verdict","scores","epilogue"]
}
```

## 共通の注意

- **プロンプトは `prompts/*.md` に置き、コードから読む。** 調整の往復を軽くする。
- 不適切な入力（暴力・差別・個人攻撃）は、1 の前に弾くか、王子の口調で「それは聞かなかったことにする」と返す。
- 出力が壊れたときのフォールバックを**必ず持つ**。展示中に例外を出さないことが最優先。
- モデルは Cortex 経由で選ぶ。対応モデルは
  <https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-regional-availability> を参照。
