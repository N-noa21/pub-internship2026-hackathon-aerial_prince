# 下民ショッピング — Streamlit プロトタイプ

企画・設計は [../docs/](../docs/README.md)。これは**軽く体験するための最小版**。

## 動かす

```
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python streamlit
.venv/bin/streamlit run streamlit_app.py
```

資格情報は `.streamlit/secrets.toml`（gitignore 済み）か環境変数
`RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` で渡す。

## 実装済み（LLM 版）

- **Vercel AI SDK for Python**（`ai` パッケージ）で LLM 連携。推論先は Vercel AI Gateway、
  モデルは `anthropic/claude-haiku-4.5`。構造化出力は pydantic
  - 検索語の生成（ズラし方の型をプロンプトに投入）
  - 検索結果からの選定＋家臣の口調での口上
  - 称号と後日談（寓話を下敷きに）
  - **どれも失敗したらルールベースに落ちる**ので、LLM が死んでも遊べる
- タイトル → わがまま入力 → 謁見（5 人）→ 打ち首／採用 → エンディング
- 楽天市場 商品検索 API から**実在商品**を取得（家臣ごとに検索語を変える）
- 玉座の間（柱・赤絨毯・松明のゆらぎ・舞う埃・周辺減光）を CSS で作画
- 打ち首アニメーション 4 種（落とし穴 / 連行 / 大砲 / 却下スタンプ）。
  赤フラッシュ＋斬撃線＋「打ち首じゃ！」のテロップ → 本編、という 2 段構成。CSS のみ
- 採用演出（光条・紙吹雪・「大儀である」）、エンディングは巻物が開く
- 判決理由（任意）。選んだ理由でアニメーションが変わる
- 診断レポート（5 軸）＋ 寓話ベースの後日談

## まだ無いもの

- Snowflake へのデプロイ、カタログの事前取り込み（[../docs/tech/05-rakuten-api.md](../docs/tech/05-rakuten-api.md)）
- カメラで王子アバター

## 環境変数 / secrets

| キー | 用途 |
| --- | --- |
| `RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` | 楽天 商品検索 API |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway |
| `LLM_MODEL`（任意） | 既定 `anthropic/claude-haiku-4.5` |

## 既知の制約

- 楽天 API は連続呼び出しで **429** を返す。`rakuten.py` で最低 1.0 秒間隔＋再試行＋キャッシュを入れている。
  そのため**わがまま入力後に 10 秒前後待つ**（LLM 2 回 + 楽天 5 回）。
  待ち時間は「触れを出しております」→「市を巡っております」→「口上を練っております」の演出で見せている
- 楽天のバックエンドサービス登録は**送信元 IP 制限**があるため、登録した IP のマシンからしか動かない
- Vercel AI Gateway は**チームのモデル制限**がかかっている。使えるのは Anthropic 系の一部
  （`claude-haiku-4.5` / `claude-sonnet-5` / `claude-opus-5` など）。
  OpenAI・Google 系は `restricted` で弾かれる
