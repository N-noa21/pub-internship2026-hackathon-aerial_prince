# 参照した外部情報

> 一覧に戻る: [README.md](README.md)

調査日: **2026-09-09**。仕様は変わるので、実装時に必ず現物を見直すこと。

「確認」列の意味：

- **実ページ確認** … このドキュメント作成時に実際にページを開いて内容を確かめた
- **検索結果のみ** … 検索結果に出てきた URL。内容は要約から取っており、ページ本体は未確認
- **二次情報** … 公式ではないブログ・まとめ記事

## Snowflake / Streamlit in Snowflake

| 用途 | URL | 確認 |
| --- | --- | --- |
| SiS の制限事項（`st.components.v1.html` 可否、Custom Components v2、CSP、32MB 上限、外部ステージ非対応） | <https://docs.snowflake.com/en/developer-guide/streamlit/limitations> | 実ページ確認 |
| SiS コンテナランタイム GA（2026-03-09。広い Python パッケージ、`st.secrets`、app-viewer URL 共有、GPU） | <https://docs.snowflake.com/en/release-notes/2026/other/2026-03-09-sis-container-runtime-ga> | 実ページ確認 |
| SiS の外部ネットワークアクセス（`EXTERNAL_ACCESS_INTEGRATIONS`） | <https://docs.snowflake.com/en/developer-guide/streamlit/features/external-access> | 検索結果のみ |
| 外部ネットワークアクセス全般（EAI・シークレット） | <https://docs.snowflake.com/en/developer-guide/external-network-access/external-network-access-overview> | 実ページ確認 |
| Snowpark Container Services（コンテナで Web UI を動かす） | <https://docs.snowflake.com/en/developer-guide/snowpark-container-services/overview> | 実ページ確認 |
| Snowflake CLI（`snow`。Streamlit アプリの管理も含む） | <https://docs.snowflake.com/en/developer-guide/snowflake-cli/index> | 実ページ確認 |

### `st.camera_input` の GA について

- **Streamlit in Snowflake で `st.camera_input` は GA**（`st.experimental_audio_input` と同時に、**2025-03-24** の
  Streamlit in Snowflake リリースノートで一般提供化）。
- **この記述の根拠は検索結果の要約であり、該当リリースノートの直リンクは特定できていない**
  （推測した URL は 404 だった）。カメラ機能の実装前に、リリースノートまたは制限事項ページで**必ず裏を取ること**。
- サポート状況の一次情報として使えるのは <https://docs.snowflake.com/en/developer-guide/streamlit/limitations>。

## Snowflake App Runtime

| 用途 | URL | 確認 |
| --- | --- | --- |
| App Runtime の概要（Node.js / Next.js 対応、public preview） | <https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/about-snowflake-app-runtime> | 検索結果のみ |
| 使い方（`snow app setup` / `deploy` / `open`、Node 22 以上、トライアル不可） | <https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/getting-started> | 実ページ確認 |
| `app.yml` マニフェスト（run / build / EAI / secrets / compute） | <https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/app-yml> | 実ページ確認 |
| 制限事項（Node.js のみ、Python は予定。ビルド時の外部アクセスは制限あり） | <https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/limitations> | 実ページ確認 |

- シークレットは `/secrets/<name>/` にファイルとしてマウントされる。
- ビルド時の外部アクセスは既定で絞られており、**npm や Google Fonts に EAI が必要になる場合がある**。

## Snowflake Cortex

| 用途 | URL | 確認 |
| --- | --- | --- |
| Cortex Chat Completions API（**OpenAI 互換**。OpenAI SDK がそのまま使える） | <https://docs.snowflake.com/en/user-guide/snowflake-cortex/open_ai_sdk> | 検索結果のみ |
| Cortex REST API 全般 | <https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api> | 検索結果のみ |
| Cortex AI Functions（AISQL。SQL から使う AI 関数） | <https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql> | 検索結果のみ |
| `AI_COMPLETE`（マルチモーダル。**画像は入力側**であって生成ではない） | <https://docs.snowflake.com/en/sql-reference/functions/complete-snowflake-cortex-multimodal> | 検索結果のみ |
| モデルとリージョンの対応表 | <https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-regional-availability> | 検索結果のみ |
| Cortex Search（ベクトル＋キーワードのハイブリッド検索。埋め込み管理不要） | <https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-search/cortex-search-overview> | 実ページ確認 |
| `VECTOR_COSINE_SIMILARITY` | <https://docs.snowflake.com/en/sql-reference/functions/vector_cosine_similarity> | 実ページ確認 |

- **画像生成モデルは Cortex のドキュメントに見当たらなかった**（検索でも見つからず）。
  「無い」ことの証明はできていないので、**画像生成が必要になった時点で改めて確認すること**。

## Vercel AI SDK

| 用途 | URL | 確認 |
| --- | --- | --- |
| AI SDK for Python 公式ドキュメント | <https://vercel.com/docs/ai-gateway/sdks-and-apis/ai-sdk-python> | 検索結果のみ |
| リポジトリ | <https://github.com/vercel-labs/ai-python> | 検索結果のみ |
| PyPI パッケージ `vercel-ai-sdk` | <https://pypi.org/project/vercel-ai-sdk/> | 検索結果のみ |
| AI SDK（TypeScript 版・本家） | <https://ai-sdk.dev/docs/introduction> | 検索結果のみ |

- **public beta**。TypeScript 版の Python 再実装で、ストリーミング・ツール呼び出し・構造化出力に対応。
- **Python 3.12 以上が必要。** パッケージの公開は 2026-04-13。
- いずれも検索結果の要約に基づく情報なので、**採用前に実物を確認すること**。

## 商品データ（EC API）

| 用途 | URL | 確認 |
| --- | --- | --- |
| 楽天市場 商品検索 API（2026-07-01 版）。エンドポイントは `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701`。`applicationId` と `accessKey` が必須（accessKey はヘッダーでも可） | <https://webservice.rakuten.co.jp/documentation/ichiba-item-search> | 実ページ確認 |
| 2026 年の API 移行仕様（アプリ種別、Referer / 送信元 IP の検査、新ドメイン、旧 API の停止日） | <https://kanaxx.hatenablog.jp/entry/rakuten-webservice-new-spec> | 二次情報 |
| Yahoo!ショッピング Web API | <https://developer.yahoo.co.jp/webapi/shopping/> | 実ページ確認 |

- 楽天: 商品名・価格・URL・ショップ情報・レビュー・画像 URL が返る。
  **`applicationId` に加えてアクセスキーが必要。画像は 64px / 128px の正方形サムネイル**（ゲーム画面には小さい可能性）。
- **送信元の検査（重要）**: 2026 年 2 月のインフラ移行で厳格化された。
  「Web アプリケーション」登録は **Referer 検査**で、登録ドメイン以外（**localhost を含む**）は
  `403 REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING`。
  「バックエンドサービス」登録は**送信元 IP の許可リスト**で、未登録 IP は `403 CLIENT_IP_NOT_ALLOWED`。
  旧ドメイン `app.rakuten.co.jp/services/api/` は **2026-05-14 に停止**。
  **この段落は二次情報が出典**（公式の API リファレンスには送信元制限の記載が見当たらなかった）。
  実装前にアプリ登録画面と公式ヘルプで裏を取ること。
- Yahoo!: 商品検索で JSON が返る。商品検索 API と画像 API が別建てに見えるため、**画像の扱いは要確認**。

## その他

| 用途 | URL | 確認 |
| --- | --- | --- |
| 青空文庫（著作権の切れた寓話の原典。エンディングの下敷きに使う場合の参照先） | <https://www.aozora.gr.jp/> | 未確認（収録の有無も未調査） |

## エージェント向けコマース

| 用途 | URL | 確認 |
| --- | --- | --- |
| Agentic Commerce Protocol（OpenAI + Stripe が策定） | <https://github.com/agentic-commerce-protocol/agentic-commerce-protocol> | 検索結果のみ |
| プロトコルの現状まとめ（ACP の 2026-04-17 リリース内容の出典） | <https://agenticplug.ai/current-state-of-agentic-commerce> | 二次情報 |
| UCP（Google 陣営、2026 年 1 月発表）に触れた記事 | <https://opascope.com/insights/ai-shopping-assistant-guide-2026-agentic-commerce-protocols/> | 二次情報 |

- ACP が 2026-04-17 のリリースで cart / feed / orders / 認証 と MCP 互換を追加した、という記述は**二次情報が出典**。
  採用を検討する段階になったら、**公式リポジトリの仕様で裏を取ること**。
