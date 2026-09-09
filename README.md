# 下民ショッピング

内定者ハッカソン 2026 / チーム aerial_prince

プレイヤーは**わがままな王子様**。無茶な要求を口にすると、**5 人の家臣**が献上品を持って
謁見の場に列をなしてやってくる。気に入らない献上品は片っ端から**「打ち首だ！」**。
最後に採用した一品と、斬った数によって、その後の国の運命が語られる。

献上されるのは**実在する商品**（楽天市場 商品検索 API）。
「城が欲しい」と言えばレゴの城やダンボールの城が出てくる。5 人目の宰相だけは、まともな答えを持ってくる。

## ディレクトリ

| 場所 | 中身 |
| --- | --- |
| [`docs/`](docs/README.md) | 企画・設計ドキュメント。まずここを読む |
| [`docs/tech/`](docs/tech/README.md) | 技術設計（構成・DDL・プロンプト・アニメーション仕様・API 連携） |
| [`web/`](web/README.md) | **本命の実装。** Next.js + TypeScript + Vercel AI SDK。Snowflake App Runtime 向け |
| [`app/`](app/README.md) | 検証用のプロトタイプ。Streamlit + AI SDK for Python |

## 動かす

```
cd web
npm install
npm run dev        # http://localhost:3300
```

`web/.env.local` に `AI_GATEWAY_API_KEY` と `RAKUTEN_APP_ID` / `RAKUTEN_ACCESS_KEY` を置く
（`.gitignore` 済み。詳細は [`web/README.md`](web/README.md)）。

---

# Snowflake CoCo の実行環境


# セットアップ
以下はCodespace上での実行を前提とします（ローカル実行する人は自力で頑張って）

0. config.toml.exampleをコピーしてconfig.tomlを作成し、YOUR_USERNAMEを自身のSnowflakeユーザ名に書きかえる。

```
cp .snowflake/config.toml.example .snowflake/config.toml
```

1. 拡張機能からSnowflakeを開いてユーザ名を入力する

![Snowflake拡張機能でユーザ名を入力](asset/01.png)

2. Snowflakeのログイン画面に遷移するのでユーザ名、パスワードを入れる

![ブラウザを開くダイアログ](asset/02-1.png)

![Snowflakeログイン画面](asset/02-2.png)

3. リダイレクトがエラーになるが**これは問題ない**。接続先のURLをコピーする

![リダイレクトエラー画面](asset/03.png)

4. Codespaceに戻りターミナルに以下を入力

```
curl -sL "コピーしたurl" > /dev/null
```

5. アカウント名が表示されればOK

![Snowflake拡張機能ログイン後](asset/05.png)
