# 06. Snowflake で完結させるアーキテクチャ

> 一覧に戻る: [README.md](README.md) ／ 前: [05-data.md](05-data.md) ／ 次: [07-implementation-plan.md](07-implementation-plan.md)

**制約: デプロイはすべて Snowflake 内で完結させる必要がある。**

## 全体像

```
[ブラウザ]
   │
   ▼
Streamlit in Snowflake（アプリ本体・UI・アニメーション）
   │
   ├─ AI SDK for Python … 家臣 5 人の口上・献上品の選定・エンディング生成
   │      └─ 推論先は Cortex（OpenAI 互換エンドポイント）を第一候補にする
   ├─ テーブル … 商品カタログ / プレイログ / エンディング分岐マスタ
   ├─ ステージ … 商品画像・キャラ画像・アニメーション断片・BGM
   └─（画像生成を使う場合のみ）External Access Integration … 外部の画像生成 API
      ※ 商品データは事前に焼き込むため、実行時の外部通信は不要
```

すべて Snowflake のオブジェクトとして作られるので、**デプロイは Snowflake CLI（`snow`）からの SQL と stage PUT で完結する**。
この devcontainer には `snow` と `cortex` が入っている。
- Snowflake CLI: <https://docs.snowflake.com/en/developer-guide/snowflake-cli/index>

## アプリのホスティング

### 第一候補: Snowflake App Runtime（Node.js / Next.js）

public preview。**Node.js のフルスタック Web アプリ（Next.js 前提）を Snowflake 内で動かせる。**
- 概要: <https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/about-snowflake-app-runtime>
- 手順: <https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/getting-started>
- マニフェスト: <https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/app-yml>
- 制限: <https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/limitations>

**これを選ぶ理由は、UI とアニメーションの自由度。** Streamlit ではデザインの幅が足りない。
TypeScript / React のエコシステムがそのまま使え、**Vercel AI SDK も本家の TypeScript 版**が使える。

| 項目 | 内容 |
| --- | --- |
| デプロイ | `snow app setup` → `snow app deploy` → `snow app open` |
| 必要環境 | Node.js **22 以上**。トライアルアカウントは非対応 |
| 設定 | `app.yml` に build / run / `external_access_integrations` / `secrets` / compute |
| シークレット | `/secrets/<name>/` にファイルとしてマウントされる |
| 認証 | Snowflake の SSO・ロールをそのまま継承。ライブ URL が生える |
| 注意 | ビルド時の外部アクセスは既定で絞られている（npm や Google Fonts に EAI が要る場合がある） |

実装は `web/` にある。

### 第二候補: Streamlit in Snowflake / コンテナランタイム

**プロトタイプ用**（`app/` に残してある）。UI の作り込みには限界があるが、Python で最速に組める。


2026-03-09 に**コンテナランタイムが GA** になっている。
出典: <https://docs.snowflake.com/en/release-notes/2026/other/2026-03-09-sis-container-runtime-ga>

GA で入った要素のうち、今回に効くもの：

- **より広い Python パッケージのサポート** … 外部ライブラリ（AI SDK for Python 等）を入れやすい
- **スリープタイマーなしの長時間実行**
- **`st.secrets` で Snowflake のシークレットにアクセスできる** … API キーの持ち方が素直になる
- **Snowsight を経由しない app-viewer URL でアプリを共有できる**
  → **展示のときに観客へどう見せるかの問題が、ここでかなり楽になる**（要検証）
- GPU が使えるコンピュートプール上で動く

### 第二候補: Snowpark Container Services (SPCS)

<https://docs.snowflake.com/en/developer-guide/snowpark-container-services/overview>

- 任意のコンテナ（Next.js 等）を Snowflake 内で動かし、Web UI を公開できる
- UI の自由度は最大だが、イメージビルドとコンピュートプール運用の分だけ重い
- **Streamlit の表現力で足りなくなった場合の逃げ道**として持っておく

## 生成 AI の置き場所

### AI SDK を使う

「Vercel AI SDK を使いたい」という要望があるが、**AI SDK は元々 TypeScript のライブラリ**で、Streamlit（Python）とは直接同居しない。
ただし **AI SDK for Python が公開されている**ので、Streamlit のまま使える。

- ドキュメント: <https://vercel.com/docs/ai-gateway/sdks-and-apis/ai-sdk-python>
- リポジトリ: <https://github.com/vercel-labs/ai-python>
- PyPI: <https://pypi.org/project/vercel-ai-sdk/>

**注意点（いずれも要検証）:**

| 項目 | 内容 |
| --- | --- |
| ステータス | **public beta**。仕様が動く可能性がある |
| Python バージョン | **3.12 以上が必要**。Streamlit in Snowflake の Python バージョンが満たすか要確認（ウェアハウスランタイムの既定は 3.11 だった時期がある） |
| パッケージ導入 | コンテナランタイムなら通りやすいはず。ウェアハウスランタイムで入るかは要確認 |
| 通信 | AI Gateway 経由で使う場合は**外部通信**になるので EAI が必要 |

### 推論先: Cortex の OpenAI 互換エンドポイント

**Cortex には OpenAI 互換の Chat Completions エンドポイントがある。**

- Cortex Chat Completions API（OpenAI SDK がそのまま使える）: <https://docs.snowflake.com/en/user-guide/snowflake-cortex/open_ai_sdk>
- Cortex REST API 全体: <https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api>
- SQL から使う AI 関数（AISQL）: <https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql>
- モデルとリージョンの対応: <https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql-regional-availability>

つまり **AI SDK の書き味を保ったまま、推論先だけ Cortex に向ける**構成が狙える。
これができれば、**外部通信なしで Snowflake 内に閉じたまま AI SDK が使える**。

- AI SDK for Python が任意の base URL を持つ OpenAI 互換プロバイダを指定できるかは**要検証**。
- できない場合の落とし方は 2 つ。
  1. 推論だけ OpenAI SDK / Cortex の Python API で直接呼ぶ（AI SDK を諦める）
  2. AI SDK を AI Gateway 経由で使い、EAI で外部通信する（Snowflake 内で動いてはいるが外に出る）
- 構造化出力（JSON スキーマ指定）を使えば、**家臣 5 人分の献上品を 1 リクエストでまとめて取れる**。レイテンシ的にもこれが本命。

### 画像生成（王子アバター）

- **Cortex に画像生成モデルは見当たらない。** `AI_COMPLETE` のマルチモーダルは画像の**入力（理解）**に対応するもの。
  <https://docs.snowflake.com/en/sql-reference/functions/complete-snowflake-cortex-multimodal>
- したがって「写真を王子風に変換」は、**外部の画像生成 API を EAI 経由で呼ぶ**構成になる想定。
  - External Access Integration: <https://docs.snowflake.com/en/developer-guide/external-network-access/external-network-access-overview>
  - Streamlit in Snowflake での外部アクセス: <https://docs.snowflake.com/en/developer-guide/streamlit/features/external-access>
  - `CREATE/ALTER STREAMLIT ... EXTERNAL_ACCESS_INTEGRATIONS` を付ければ、**コードが動く場所は Snowflake の中のまま**
- **「外部 API 呼び出しがレギュレーション上 OK か」は主催側に確認する。** ここが NG だと設計が変わる。
- NG の場合の代替: 王子アバターは**事前に用意した衣装・白馬の画像を CSS で合成**する（顔だけ切り抜いて重ねる）。
  生成に頼らず成立させられるので、**まずこちらで作ってから生成を足す**のが安全。

## データとアセット

- 商品カタログ・プレイログ・エンディングマスタは**テーブル**
- 画像・音・アニメーション断片は**内部ステージ**
  - **外部ステージは Streamlit in Snowflake では非対応**（<https://docs.snowflake.com/en/developer-guide/streamlit/limitations>）
- ウェアハウスランタイムは表示データに 32MB の上限があるので、画像は都度読み込む

## デプロイ手順（想定）

1. `snow sql` でデータベース／スキーマ／テーブル／ステージを作成
2. カタログ CSV と画像アセットを `PUT` でステージへ、`COPY INTO` でテーブルへ
3. Streamlit アプリのソースをステージへ `PUT`
4. `CREATE STREAMLIT`（必要なら `EXTERNAL_ACCESS_INTEGRATIONS` を付与）
5. ロールと権限を付与し、デモで見せる相手がアクセスできる状態にする
