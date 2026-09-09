# 下民ショッピング — Next.js 版（Snowflake App Runtime 向け）

企画・設計は [../docs/](../docs/README.md)。
Streamlit 版は [../app/](../app/README.md) に残してある（こちらが本命、あちらは検証用）。

## なぜ Next.js か

Snowflake App Runtime（public preview）が **Node.js / Next.js** をサポートしており、
Streamlit より UI とアニメーションの自由度が高いため。
<https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/about-snowflake-app-runtime>

## 動かす

```
npm install
npm run dev        # http://localhost:3300
```

`.env.local`（gitignore 済み）に以下を置く。

| キー | 用途 |
| --- | --- |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway |
| `RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` | 楽天 商品検索 API |
| `LLM_MODEL` | 既定 `anthropic/claude-haiku-4.5` |

## 構成

```
src/
  app/
    page.tsx                画面遷移（TITLE→WISH→AUDIENCE→演出→ENDING）
    globals.css             デザイントークンと全スタイル
    api/offerings/route.ts  わがまま → 検索語 → 楽天 → 選定＋口上
    api/ending/route.ts     判決 → 称号と後日談
  components/
    ThroneRoom.tsx          謁見の間（SVG で作画）
    Stage.tsx               家臣・献上カード・口上・列インジケータ
    Beheading.tsx           打ち首演出 4 種
    AdoptBurst.tsx          採用演出
    TitleScreen.tsx         タイトル
    EndingScroll.tsx        巻物が開くエンディング
  lib/
    retainers.ts            家臣 5 人（宰相＝まとも枠）、判決理由、演出の出し分け
    rakuten.ts              楽天 API（直列化・最低間隔・キャッシュ）
    llm.ts                  Vercel AI SDK（generateObject + zod）
    ending.ts               寓話の型とスコア
app.yml                     Snowflake App Runtime のマニフェスト
```

## 実装済み

- **Vercel AI SDK（TypeScript）** で LLM 連携。`@ai-sdk/gateway` + `generateObject` + zod
  - 検索語の生成（ズラし方の型をプロンプトに投入）／候補からの選定と口上／称号と後日談
  - **どれも失敗したらルールベースに落ちる**ので、LLM が死んでも遊べる
- 楽天市場 商品検索 API から実在商品を取得（家臣ごとに検索語を変える）
- **謁見の間を一点透視の大広間として SVG で作画**。石積みの側壁、天井のリブ、
  奥の玉座と段、薔薇窓、遠近のついた床タイルと赤絨毯
- **照明**: 壁の松明 4 本（炎が揺れ、壁と床に光だまりを落とす）、揺れるシャンデリア、
  薔薇窓から差す光の柱、その中を舞う埃、家臣の足元の光だまり、強い周辺減光
- **商品を開いて検分できる**（大きな画像・呼び名・価格・正式な品名・商い・探した言葉・楽天へのリンク）
- **商品名は LLM が短い呼び名を付ける**。楽天の生の商品名は装飾を削ってから渡し、詳細でのみ全文を出す
- **家臣ごとに口調が違う**（商人＝通販番組／貴族＝気取り／騎士＝報告口調／農民＝方言／宰相＝敬語）
- **打ち首の理由を文章で書ける**。書いた言葉は演出中に表示され、後日談にそのまま引用される
- 打ち首演出 4 種（落とし穴 / 連行 / 大砲 / 却下スタンプ）。
  赤フラッシュ＋斬撃線＋「打ち首じゃ！」→ 本編、の 2 段構成。motion で記述
- 採用演出（光条・紙吹雪・「大儀である」）、エンディングは巻物が開く
- 判決理由（任意）。選んだ理由で演出が変わる。5 人目は必ず一番派手なもの

## Snowflake へのデプロイ

```
snow app setup      # app.yml とアプリサービスを用意する
snow app deploy
snow app open
```

- Node.js **22 以上**が必要。トライアルアカウントは非対応
- 外部 API を呼ぶ場合は `app.yml` の `external_access_integrations` に EAI を並べる
- 資格情報は Snowflake のシークレットを `secrets:` でマウントする（`/secrets/<name>/` にファイルとして入る）
- 手順: <https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/getting-started>

## 既知の制約

- **楽天 API は送信元 IP 制限がある**（バックエンドサービス登録）。登録した IP からしか通らないため、
  Snowflake から実行時に呼ぶ構成は成立しない見込み。
  本番は事前カタログ化に切り替える（[../docs/tech/05-rakuten-api.md](../docs/tech/05-rakuten-api.md)）
- 楽天 API は連続呼び出しで 429 になるため、最低 850ms 間隔＋再試行＋キャッシュを入れている。
  結果として**わがまま入力後に 10 秒前後待つ**（LLM 2 回 + 楽天 5 回）
- Vercel AI Gateway は**チームのモデル制限**がかかっている。使えるのは Anthropic 系の一部
  （`claude-haiku-4.5` / `claude-sonnet-5` / `claude-opus-5` など）。OpenAI・Google 系は弾かれる
- Web フォントは使っていない（App Runtime のビルドは外部アクセスが絞られており、
  Google Fonts に EAI が要る場合があるため）
