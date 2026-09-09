"""LLM 連携 — Vercel AI SDK for Python（`ai` パッケージ）を使う。

推論先はいま Vercel AI Gateway。Snowflake にデプロイする際は
Cortex の OpenAI 互換エンドポイントに向け替える想定（../docs/06-snowflake.md）。

どの関数も失敗したら None を返す。呼び出し側は必ずルールベースへ落とすこと。
"""
import asyncio
import os

from pydantic import BaseModel, Field

try:
    import ai
    _SDK = True
except Exception:      # SDK が入っていない環境でもアプリは動く
    _SDK = False

MODEL_ID = os.environ.get("LLM_MODEL", "anthropic/claude-haiku-4.5")
RETAINER_IDS = ("merchant", "noble", "knight", "farmer", "chancellor")

TWIST_GUIDE = """ズラし方の型（どれかを使う）:
- スケールダウン: 本物 → おもちゃ・ミニチュア（城 → レゴの城）
- 素材化: 生き物・概念 → 加工品（白馬 → 馬刺し、馬油シャンプー）
- 同音・語呂: 言葉だけ合っている（王冠 → ビール瓶の王冠、星 → ミシュランの星）
- 日用品への翻訳: 概念 → 家にある物（時を止める → 冷凍庫、軍隊 → 将棋の駒）
- 体験に変換: モノ → 体験チケット
- 物量で殴る: 業務用・大容量（ごちそう → 冷凍唐揚げ 1kg）
- 象徴の代替: 効能だけ似ている（不老不死 → 栄養ドリンク）"""

ROLES = """家臣と役割:
- merchant(商人): 通販的な実売品。まとめ買い・業務用サイズ
- noble(貴族): 高級・ブランド・インテリア。値段だけ立派
- knight(騎士): 装備・道具・アウトドア。実用一辺倒
- farmer(農民): 食品・農産物・生活雑貨。素朴で的外れ
- chancellor(宰相): ★この人だけ「まとも」。ズラさない。
  わがままに対して現実世界で実際に用意できる、地味だが妥当な答えを出す。
  例: 城→城の見学ツアー / 白馬→乗馬体験レッスン / 黄金→純金積立 /
      不老不死→人間ドック / 最強の剣→剣道防具。
  おもちゃ・模型・ミニチュアは宰相の答えとして絶対に選ばない"""


# ------------------------------------------------------------------ スキーマ
class QueryItem(BaseModel):
    retainer_id: str = Field(description="merchant/noble/knight/farmer/chancellor")
    query: str = Field(description="楽天市場の検索キーワード。日本語 1〜3 語")
    twist: str = Field(description="使ったズラし方の型の名前")


class Queries(BaseModel):
    queries: list[QueryItem]


class PickItem(BaseModel):
    retainer_id: str
    index: int = Field(description="候補リストの番号")
    speech: str = Field(description="献上の口上。30 文字以内")


class Picks(BaseModel):
    picks: list[PickItem]


class Ending(BaseModel):
    title: str = Field(description="王子に与える称号。12 文字以内")
    epilogue: str = Field(description="その後の国の運命。3 文以内")


# ------------------------------------------------------------------ 実行基盤
def available() -> bool:
    return _SDK and bool(os.environ.get("AI_GATEWAY_API_KEY") or _secret())


def _secret() -> str:
    try:
        import streamlit as st
        k = st.secrets.get("AI_GATEWAY_API_KEY", "")
        if k:
            os.environ.setdefault("AI_GATEWAY_API_KEY", k)
        return k
    except Exception:
        return ""


async def _agen(system: str, user: str, schema):
    model = ai.ai_gateway(MODEL_ID)
    result = await ai.stream(
        model,
        [ai.system_message(system), ai.user_message(user)],
        output_type=schema,
    )
    async for _ in result:
        pass
    for attr in ("output", "structured_output", "parsed"):
        val = getattr(result, attr, None)
        if isinstance(val, schema):
            return val
    return schema.model_validate_json(result.text)


def _gen(system: str, user: str, schema):
    if not available():
        return None
    try:
        return asyncio.run(_agen(system, user, schema))
    except Exception:
        return None


# ------------------------------------------------------------------ 1. 検索語
def build_queries(wish: str) -> dict[str, dict] | None:
    system = f"""あなたは王様ゲームの企画者。王子のわがままに対し、家臣 5 人が献上する品を
楽天市場で探すための検索キーワードを作る。

{TWIST_GUIDE}

{ROLES}

ルール:
- 検索語は日本語 1〜3 語、スペース区切り。楽天市場で実際に商品が引ける平易な語にする
- 架空の商品名や存在しない固有名詞を作らない
- 前半 4 人の商品カテゴリは互いに被らせない
- 必ず 5 人ぶん、指定の retainer_id で返す"""
    res = _gen(system, f"王子のわがまま: 「{wish}」", Queries)
    if not res:
        return None
    out = {q.retainer_id: {"query": q.query.strip(), "twist": q.twist}
           for q in res.queries if q.retainer_id in RETAINER_IDS and q.query.strip()}
    return out or None


# ------------------------------------------------------------ 2. 選定＋口上
def pick_offerings(wish: str, pools: dict[str, list[dict]]) -> dict[str, dict] | None:
    names = {"merchant": "商人", "noble": "貴族", "knight": "騎士",
             "farmer": "農民", "chancellor": "宰相"}
    lines = []
    for rid, items in pools.items():
        lines.append(f"[{rid} / {names.get(rid, rid)}]")
        for i, it in enumerate(items):
            lines.append(f"  {i}: {it['name'][:60]} / {it['price']:,}円")

    system = """あなたは王様ゲームの脚本家。候補の中から、その家臣らしい商品を 1 つ選び、
献上の口上を書く。

選ぶ基準: わがままに「一応は答えているが、明らかにスケールが違う」ものほど良い。
ただし chancellor(宰相) だけは、現実的で妥当なものを真面目に選ぶ。

口上のルール:
- 30 文字以内。長いとテンポが死ぬ
- 商人=押しの強い通販番組 / 貴族=気取った見栄っ張り / 騎士=実直 /
  農民=素朴で必死 / 宰相=落ち着いた常識人（正しいが夢がない）
- 候補にない商品を作らない。必ず index で答える"""
    user = f"王子のわがまま: 「{wish}」\n\n候補:\n" + "\n".join(lines)
    res = _gen(system, user, Picks)
    if not res:
        return None
    out = {}
    for p in res.picks:
        if p.retainer_id in pools and 0 <= p.index < len(pools[p.retainer_id]):
            out[p.retainer_id] = {"item": pools[p.retainer_id][p.index],
                                  "speech": p.speech[:40]}
    return out or None


# ------------------------------------------------------------------ 3. 締め
def write_ending(wish, judgments, outcome, adopted, fable) -> dict | None:
    lines = []
    for j in judgments:
        v = "打ち首" if j["verdict"] == "BEHEAD" else "採用"
        r = f"（理由: {j['reason_label']}）" if j.get("reason_code") else "（無言）"
        lines.append(f"- {j['retainer']['name']}: {j['item']['name'][:40]} "
                     f"{j['item']['price']:,}円 → {v}{r}")
    got = (f"{adopted['item']['name'][:40]}"
           f"（{adopted['item']['price']:,}円 / {adopted['retainer']['name']}より）"
           ) if adopted else "なし。家臣全員を斬った"

    system = """あなたは王国の年代記を書く歴史家。ただしユーモアがある。

書き方:
- 数字は本物、語り口は歴史書。価格や商品名はそのまま使い、荘厳な文体で語る
- 実在の人物名・国名は出さない。「どこかの王国」でよい
- 王子が理由を述べていたら、その言葉をそのまま引用する
- 指定された寓話の型を下敷きにする"""
    user = (f"王子のわがまま: 「{wish}」\n判決:\n" + "\n".join(lines) +
            f"\n手にした物: {got}\n下敷きにする寓話: {fable}")
    res = _gen(system, user, Ending)
    if not res:
        return None
    return {"title": res.title[:20], "epilogue": res.epilogue}
