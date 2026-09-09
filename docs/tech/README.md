# 技術設計

> ゲーム側のドキュメントは [../README.md](../README.md)

「下民ショッピング」を**どう作るか**をまとめる。企画（何を作るか）は親フォルダ、ここは実装の話だけ。

| ファイル | 内容 |
| --- | --- |
| [01-architecture.md](01-architecture.md) | 画面遷移・モジュール構成・状態管理 |
| [02-data-model.md](02-data-model.md) | テーブル設計（DDL 案） |
| [03-prompts.md](03-prompts.md) | LLM 呼び出しの分割と構造化出力スキーマ |
| [04-animation-spec.md](04-animation-spec.md) | 打ち首アニメーションの実装仕様（AI に渡すコントラクト） |
| [05-rakuten-api.md](05-rakuten-api.md) | 楽天 API 連携（EAI・クエリ・キャッシュ） |
| [06-ui-libraries.md](06-ui-libraries.md) | UI / アニメーションライブラリの調査（Tailwind・GSAP・Magic UI 等） |

## 前提

| 項目 | 決定 | 出典・詳細 |
| --- | --- | --- |
| 実行環境 | Streamlit in Snowflake（コンテナランタイム） | [../06-snowflake.md](../06-snowflake.md) |
| 言語 | Python | — |
| AI ライブラリ | AI SDK for Python（`vercel-ai-sdk`、public beta） | [../references.md](../references.md#vercel-ai-sdk) |
| 推論先 | Cortex の OpenAI 互換エンドポイント（第一候補） | [../06-snowflake.md](../06-snowflake.md#推論先-cortex-の-openai-互換エンドポイント) |
| 商品データ | 楽天市場 商品検索 API + キャッシュ | [05-rakuten-api.md](05-rakuten-api.md) |
| アニメーション | CSS のみの断片を iframe で再生 | [04-animation-spec.md](04-animation-spec.md) |

**着手初日に潰す検証項目**（ここが崩れると設計が変わる）:

1. Streamlit in Snowflake の Python が 3.12 以上か、`vercel-ai-sdk` を入れられるか
2. AI SDK から Cortex の OpenAI 互換エンドポイントに向けられるか
3. External Access Integration で楽天 API を叩けるか（レギュレーション上の可否も含む）
