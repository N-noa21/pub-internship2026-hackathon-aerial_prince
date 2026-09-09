# 02. データモデル

> [tech/README.md](README.md)

すべて Snowflake のテーブル。DDL は**案**なので、実装時に型と桁を詰めること。

## マスタ

### RETAINERS（家臣）

5 人固定なので、コードに埋めずテーブルに置くとキャラ調整が楽になる。

```sql
CREATE OR REPLACE TABLE retainers (
  retainer_id   STRING PRIMARY KEY,   -- merchant / noble / knight / farmer / chancellor
  display_name  STRING,               -- 商人 / 貴族 / 騎士 / 農民 / 宰相
  tone          STRING,               -- 口調の指示文（プロンプトに差し込む）
  query_hint    STRING,               -- 検索語に足す語（"業務用" "高級" など）
  is_sane       BOOLEAN,              -- 宰相のみ TRUE（まとも枠）
  queue_order   NUMBER                -- 5 = 宰相。1-4 はシャッフル対象
);
```

### ENDING_TEMPLATES（エンディングの下敷き）

寓話・史実の型をマスタに持ち、LLM には**型に沿って具体化させる**（[../04-ending.md](../04-ending.md#後日談)）。

```sql
CREATE OR REPLACE TABLE ending_templates (
  template_id   STRING PRIMARY KEY,
  kind          STRING,   -- FABLE | HISTORY
  name          STRING,   -- 裸の王様 / 財政破綻 など
  outline       STRING,   -- 話の骨格（LLM への指示文）
  match_rule    STRING    -- 適用条件。まずは単純な式か、コード側の判定でよい
);
```

## 商品キャッシュ

楽天 API の結果を貯める。**保険であり、そのままカタログとして育つ**（[05-rakuten-api.md](05-rakuten-api.md)）。

```sql
CREATE OR REPLACE TABLE item_cache (
  query         STRING,          -- 検索に使った語
  rank          NUMBER,          -- 検索結果内の順位
  item_code     STRING,          -- 楽天の商品コード
  item_name     STRING,
  price         NUMBER,
  item_url      STRING,
  image_url     STRING,
  shop_name     STRING,
  raw           VARIANT,         -- レスポンスをそのまま残す（後で欲しくなる）
  fetched_at    TIMESTAMP_NTZ,
  PRIMARY KEY (query, item_code)
);
```

- `raw` を持っておくと、後から使いたい項目が増えても再取得が要らない。
- 外部通信が禁止された場合は、**このテーブルだけで動くように切り替える**。

## プレイログ

### PLAYS（1 プレイ = 1 行）

```sql
CREATE OR REPLACE TABLE plays (
  play_id            STRING PRIMARY KEY,
  started_at         TIMESTAMP_NTZ,
  ended_at           TIMESTAMP_NTZ,
  wish               STRING,          -- 入力されたわがまま
  outcome            STRING,          -- ADOPTED | ALL_BEHEADED
  adopted_retainer   STRING,          -- 採用した家臣（全員斬りなら NULL）
  adopted_item_code  STRING,
  adopted_price      NUMBER,
  behead_count       NUMBER,
  scores             VARIANT,         -- 診断レポートの各軸
  title              STRING,          -- 与えた称号
  ending_template_id STRING
);
```

### JUDGMENTS（1 判決 = 1 行）

```sql
CREATE OR REPLACE TABLE judgments (
  play_id      STRING,
  seq          NUMBER,          -- 1..5
  retainer_id  STRING,
  item_code    STRING,
  item_name    STRING,
  price        NUMBER,
  twist_type   STRING,          -- 使ったズラし方の型
  verdict      STRING,          -- BEHEAD | ADOPT
  reason_code  STRING,          -- 定型理由（NULL 可）
  reason_text  STRING,          -- 自由入力（NULL 可）
  anim_id      STRING,          -- 再生した退場アニメーション
  decided_at   TIMESTAMP_NTZ
);
```

## 書き込みのタイミング

- **プレイ終了時に `plays` 1 行 + `judgments` 5 行以内をまとめて書く。**
  Streamlit は再実行が頻繁なので、途中で書くと二重書き込みしやすい。
- `item_cache` は楽天 API を叩いた直後に MERGE で書く。

## この設計で出せるもの

展示中に見せられる集計（[../08-open-questions.md](../08-open-questions.md)）。

```sql
-- 打ち首率ランキング（どの家臣が斬られやすいか）
SELECT retainer_id,
       COUNT_IF(verdict = 'BEHEAD') / COUNT(*) AS behead_rate
FROM judgments GROUP BY retainer_id ORDER BY behead_rate DESC;

-- 宰相（まとも枠）はどれくらい採用されているか
SELECT COUNT_IF(adopted_retainer = 'chancellor') / COUNT(*) AS sane_rate FROM plays;

-- 人気の献上品
SELECT item_name, COUNT(*) AS n
FROM judgments WHERE verdict = 'ADOPT' GROUP BY item_name ORDER BY n DESC LIMIT 10;
```
