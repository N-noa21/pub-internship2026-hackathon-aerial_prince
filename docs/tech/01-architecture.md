# 01. アーキテクチャ

> [tech/README.md](README.md)

## 画面遷移

```
TITLE ──START──▶ WISH ──入力──▶ AUDIENCE ──採用 or 5人斬った──▶ ENDING ──▶ TITLE
                                    │  ▲
                                    └──┘ 打ち首（次の家臣へ）
```

- 状態は 4 つだけ。Streamlit の再実行モデルと相性が良いように、**画面 = 1 つの列挙値**で持つ。
- 重い処理（LLM・楽天 API）は **WISH → AUDIENCE の遷移時に 1 回だけ**走らせる。
  以降の「斬る／選ぶ」は再描画のみで、待ち時間ゼロにする。

## モジュール構成

```
app/
  streamlit_app.py          エントリ。画面遷移だけを持つ
  screens/
    title.py                ロゴ + START
    wish.py                 わがまま入力 + お題ガチャ
    audience.py             謁見。カード表示・採用/打ち首・退場演出
    ending.py               診断レポート + 後日談
  core/
    state.py                GameState（session_state のラッパ）
    agents.py               LLM 呼び出し（検索語生成 / 献上品選定 / エンディング）
    catalog.py              楽天 API 呼び出しとキャッシュ
    anim.py                 アニメーション断片の読み込みと iframe 組み立て
    repo.py                 Snowflake テーブルへの読み書き
  assets/
    animations/*.css        打ち首アニメーション（AI が量産する）
    img/                    家臣の立ち絵・背景・額縁
  prompts/*.md              プロンプト本文（コードから分離する）
```

- **プロンプトはコードに埋めない。** `prompts/` に置いて差し替えやすくする。
  面白さの調整はプロンプトの往復回数で決まるので、ここを軽くしておくと効く。
- `core/` は Streamlit に依存させない。単体で叩いて出力を確認できるようにしておくと、
  「提案が面白いか」をアプリを起動せずに回せる。

## 状態管理

```python
@dataclass
class Offering:            # 献上品ひとつ
    retainer_id: str       # "merchant" | "noble" | "knight" | "farmer" | "chancellor"
    item_code: str
    item_name: str
    price: int
    image_url: str
    item_url: str
    speech: str            # 家臣の口上
    twist_type: str        # 使ったズラし方の型

@dataclass
class Judgment:            # 1 人ぶんの判決
    seq: int
    offering: Offering
    verdict: str           # "BEHEAD" | "ADOPT"
    reason_code: str | None
    reason_text: str | None
    anim_id: str | None

@dataclass
class GameState:
    screen: str            # "TITLE" | "WISH" | "AUDIENCE" | "ENDING"
    play_id: str
    wish: str
    queue: list[Offering]  # 献上の列（宰相が最後）
    cursor: int
    judgments: list[Judgment]
    outcome: str | None    # "ADOPTED" | "ALL_BEHEADED"
```

- `st.session_state` に `GameState` を 1 個だけ置く。**画面間で受け渡す値を増やさない。**
- 永続化は「プレイ終了時にまとめて 1 回書く」で足りる（[02-data-model.md](02-data-model.md)）。
  途中で書くと、Streamlit の再実行で二重書き込みしやすい。

## 生成のタイミングとレイテンシ

| タイミング | 処理 | 目標 |
| --- | --- | --- |
| WISH 確定時 | 検索語生成 → 楽天 API → 献上品選定（5 人分を 1 回の構造化出力で） | **5 秒以内** |
| 打ち首・採用 | 再描画とアニメーション再生のみ | 即時 |
| ENDING 表示時 | 診断＋後日談の生成 | 3 秒以内 |

- WISH 確定時の待ち時間は「家臣が集まっております…」の演出で隠す。
- 楽天 API の 5 本並列と LLM 1 回、という構成にすると読みやすい。
  遅ければ**検索を 1〜2 本に減らして 5 人で分け合う**（[05-rakuten-api.md](05-rakuten-api.md)）。
- **失敗時は必ず落とし所を作る。** 楽天が落ちたらキャッシュ、LLM が落ちたら固定文言。
  展示中に例外画面を出さないことを優先する。

## Streamlit 実装上の注意

- 「斬る／選ぶ」のボタンはコールバックで状態を更新し、`st.rerun()` で描き直す。
- 退場アニメーションは `st.components.v1.html` の iframe に流す（[04-animation-spec.md](04-animation-spec.md)）。
  iframe の中身が変わらないと再生されないので、**再生ごとにキーを変える**。
- 画像は楽天の URL を直接参照するか、内部ステージに保存したものを使う。
  外部ステージは Streamlit in Snowflake では使えない（[../references.md](../references.md#snowflake--streamlit-in-snowflake)）。
