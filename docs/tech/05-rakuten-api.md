# 05. 楽天 API 連携

> [tech/README.md](README.md) ／ 方針は [../05-data.md](../05-data.md)

**楽天市場 商品検索 API**
<https://webservice.rakuten.co.jp/documentation/ichiba-item-search>

## 結論: リアルタイムに叩かず、事前バッチで取り込む

**2026 年 2 月のインフラ移行で、送信元の検査が厳格化された。** これが設計を決める。

| アプリ種別 | 検査 | 弾かれ方 |
| --- | --- | --- |
| **Web アプリケーション** | HTTP Referer を検査。登録ドメインからのみ | `403 REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING`。**localhost は許可リストに入れない限りブロック** |
| **バックエンドサービス** | **送信元 IP アドレスを検査。登録した固定 IP からのみ** | `403 CLIENT_IP_NOT_ALLOWED`。IP の登録数には上限がある（9 件程度） |

サーバーサイドから叩く我々は「バックエンドサービス」に当たるが、
**Snowflake からの外部通信の送信元 IP を固定・列挙できる見込みが薄い**（クラウドの NAT で出るため、
少数の固定 IP に収まらない可能性が高い。GAS のようなマルチ IP のサービスで同じ問題が起きている）。

→ **アプリ実行中に Snowflake から楽天 API を呼ぶ構成は採らない。**
→ **IP を登録できる場所（開発者のマシン）から事前にバッチで取得し、Snowflake に焼き込む。**

### これで失うもの・得るもの

| | |
| --- | --- |
| 失う | わがままに対して「無限の品揃えから毎回引く」ことができなくなる。カタログの範囲内で戦う |
| 得る | **外部通信（EAI）が不要になる**。レギュレーション上の懸念も消える。デモ中の外部依存ゼロ、レイテンシも短縮 |

**外部通信が要らなくなるのは、今回の制約（Snowflake 完結）にとってはむしろ好都合。**
そのぶん、カタログの作り込みと検索方式が重要になる（[../05-data.md](../05-data.md)）。

## 取り込みバッチ（開発時に実行）

```
[開発者のマシン: IP を楽天に登録済み]
    │  楽天 商品検索 API を叩く（キーワードを大量に回す）
    ▼
  items.jsonl ＋ 画像ファイル
    │  snow CLI で PUT
    ▼
[Snowflake]  内部ステージ → COPY INTO → item_catalog テーブル
```

- アプリ本体は**このテーブルしか見ない**。楽天 API はアプリのコードに登場しない。
- 画像も**取得時にダウンロードして内部ステージに置く**。実行時に楽天のドメインを踏まないので、
  Referer / CSP まわりの不確定要素をまとめて消せる。
- カタログを増やしたくなったら、バッチをもう一度回すだけ。

### エンドポイントと認証

```
https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701
  ?applicationId=<アプリID>&accessKey=<アクセスキー>&keyword=...&hits=30
```

- **ドメインが `openapi.rakuten.co.jp` に変わっている。** 旧 `app.rakuten.co.jp/services/api/` は
  2026-05-14 に停止済み。古い記事のサンプルをそのまま使わないこと。
- `applicationId` と `accessKey` の両方が必須。`accessKey` はヘッダーでも渡せる。
- アプリの登録には**有効期限（1 年）**があり、更新操作が要る。

### 収集キーワードの設計

カタログの面白さは**集めるキーワードで決まる**。ズラし方の型（[../02-mechanics.md](../02-mechanics.md#ズラし方の型プロンプト設計の中心)）を
逆から使い、「ズレた献上品になりやすい語」を広く集める。

- カテゴリ横断で散らす: おもちゃ / 食品 / 日用品 / 家電 / 書籍 / 体験チケット / 健康食品 / 園芸 / ペット
- 「ミニチュア」「業務用」「1kg」「体験」「レプリカ」「開運」など、**型に対応する修飾語**を軸にする
- 宰相（まとも枠）用に、**現実的な解になる商品**も集めておく（体験ツアー、保険、サービス券など）
- 1 キーワードあたり上位 30 件、キーワード 200〜500 語で数千〜万件規模を目安にする

### 収集時のフィルタ

**ここを雑にすると展示で事故る。** 取り込み時点で落としておく。

- 成人向け・危険物・医薬品まがいの商品
- 極端に高額／安価なもの（笑いにならない）
- 商品名が長すぎる、記号だらけ、SEO 目的の羅列
- 画像が取得できないもの

## 実行時のフォールバック（外部通信が使える場合のみ）

もし送信元 IP の問題が解決し、レギュレーション上も外部通信が許されるなら、
**カタログに無い語が来たときだけリアルタイムに叩く**というハイブリッドにできる。
その場合の EAI 設定は以下。

```sql
CREATE OR REPLACE NETWORK RULE rakuten_rule
  MODE = EGRESS TYPE = HOST_PORT
  VALUE_LIST = ('openapi.rakuten.co.jp');

CREATE OR REPLACE SECRET rakuten_key
  TYPE = GENERIC_STRING SECRET_STRING = '...';

CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION rakuten_eai
  ALLOWED_NETWORK_RULES = (rakuten_rule)
  ALLOWED_AUTHENTICATION_SECRETS = (rakuten_key)
  ENABLED = TRUE;

ALTER STREAMLIT gemin_shopping SET EXTERNAL_ACCESS_INTEGRATIONS = (rakuten_eai);
```

- Streamlit in Snowflake での EAI 指定:
  <https://docs.snowflake.com/en/developer-guide/streamlit/features/external-access>
- 資格情報は Snowflake のシークレットに置き、コンテナランタイムの `st.secrets` から読む。

## 確認しておくこと

- [ ] **Snowflake の外部通信の送信元 IP を固定・列挙できるか**（できるなら実行時呼び出しも選択肢に戻る）
- [ ] アクセスキーの取得と、**アプリ種別を「バックエンドサービス」で登録**すること
- [ ] 取り込みを実行するマシンの IP を登録する（即時反映される。登録数に上限があるので使い回す）
- [ ] 画像 URL のサイズ。**64px / 128px の正方形サムネイル**しか取れないなら、カードをそれ前提で組む
- [ ] 商品情報・画像を**保存して再利用してよいか**（規約。ダウンロードして持つ設計なので、ここは必ず確認する）
- [ ] 検索結果の表示に関する規約（クレジット表記・リンクの扱い）
- [ ] Yahoo!ショッピング API に同様の送信元制限があるか（<https://developer.yahoo.co.jp/webapi/shopping/>）
