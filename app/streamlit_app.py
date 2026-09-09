"""下民ショッピング — Streamlit プロトタイプ

TITLE → WISH → AUDIENCE →（打ち首／採用の演出）→ ENDING
企画・設計は ../docs/ を参照。
"""
import random
import time
import uuid

import streamlit as st

import ending as ending_mod
import llm
import rakuten
import ui
from retainers import RETAINERS, REASONS, build_queries, build_speech
from style import CSS

st.set_page_config(page_title="下民ショッピング", page_icon="👑", layout="centered")
st.markdown(CSS, unsafe_allow_html=True)

SAMPLE_WISHES = [
    "でっかい城が欲しいのじゃ", "白馬に乗りたいのじゃ", "黄金が欲しいのじゃ",
    "不老不死の薬をよこせ", "世界を征服したいのじゃ", "最強の剣を持て",
    "空を飛びたいのじゃ", "宴じゃ、ごちそうを持て", "海が欲しいのじゃ",
    "星が欲しいのじゃ", "忠実な側近が欲しい", "無敵の軍隊が欲しいのじゃ",
]
BY_ID = {r["id"]: r for r in RETAINERS}

S = st.session_state
S.setdefault("screen", "TITLE")
S.setdefault("queue", [])
S.setdefault("cursor", 0)
S.setdefault("judgments", [])
S.setdefault("used_anims", set())
S.setdefault("pending", None)
S.setdefault("nonce", 0)
S.setdefault("wish", "")


def go(screen):
    S.screen = screen
    st.rerun()


def head(t, s=""):
    st.markdown(f'<div class="hd"><div class="t">{t}</div>'
                f'<div class="s">{s}</div></div><div class="rule"></div>',
                unsafe_allow_html=True)


def bump():
    S.nonce += 1
    return S.nonce


# ------------------------------------------------------------ 献上品を集める
def gather(wish: str, say=lambda _: None):
    """LLM で検索語を作り、楽天で引き、LLM に選ばせる。失敗時はルールベース。"""
    say("触れを出しております……")
    plan = llm.build_queries(wish) if llm.available() else None
    used_llm_q = plan is not None
    if not plan:
        plan = {q["retainer"]["id"]: {"query": q["candidates"][0],
                                      "candidates": q["candidates"], "twist": q["twist_type"]}
                for q in build_queries(wish)}

    say("家臣が市を巡っております……")
    pools, used = {}, set()
    for rid, p in plan.items():
        cands = p.get("candidates") or [p["query"], p["query"].split()[0]]
        try:
            items, _ = rakuten.search_any(cands, hits=20)
        except Exception as e:
            st.error(f"楽天 API の呼び出しに失敗しました: {e}")
            return [], used_llm_q, False
        pool = [i for i in items[:6] if i["item_code"] not in used]
        if pool:
            pools[rid] = pool

    say("口上を練っております……")
    picks = llm.pick_offerings(wish, pools) if (llm.available() and pools) else None
    used_llm_p = picks is not None

    offerings = []
    for r in RETAINERS:                      # 宰相が最後になる順で並べる
        rid = r["id"]
        if rid not in pools:
            continue
        if picks and rid in picks:
            item, speech = picks[rid]["item"], picks[rid]["speech"]
        else:
            item = random.choice(pools[rid])
            speech = build_speech(r, item)
        if item["item_code"] in used:
            alt = [i for i in pools[rid] if i["item_code"] not in used]
            if alt:
                item = alt[0]
        used.add(item["item_code"])
        offerings.append({"retainer": r, "item": item, "speech": speech})
    return offerings, used_llm_q, used_llm_p


# ---------------------------------------------------------------------- TITLE
if S.screen == "TITLE":
    st.components.v1.html(ui.title_screen(bump()), height=336)
    st.write("")
    _, mid, _ = st.columns([1, 2, 1])
    with mid:
        if st.button("START", type="primary"):
            go("WISH")
    st.markdown(
        f'<p class="hint">{"⚔ 家臣は AI が選んでおります" if llm.available() else "⚠ LLM 未接続（ルールベースで動作中）"}</p>',
        unsafe_allow_html=True)

# ----------------------------------------------------------------------- WISH
elif S.screen == "WISH":
    head("何が望みじゃ", "WHAT DOST THOU DESIRE")
    wish = st.text_input("わがまま", value=S.wish,
                         placeholder="でっかい城が欲しいのじゃ",
                         label_visibility="collapsed")
    c1, c2 = st.columns([1, 1])
    with c1:
        if st.button("🎲 お題ガチャ"):
            S.wish = random.choice(SAMPLE_WISHES)
            st.rerun()
    with c2:
        fire = st.button("家臣を呼べ", type="primary")

    if fire and wish.strip():
        slot = st.empty()

        def say(msg):
            slot.markdown(
                f'<p class="hint" style="font-size:.95rem;letter-spacing:.24em">'
                f'⌛ {msg}</p>', unsafe_allow_html=True)

        offerings, lq, lp = gather(wish.strip(), say)
        slot.empty()
        if len(offerings) < 2:
            st.warning("誰も参上しませんでした。別の言い回しでお試しください。")
        else:
            S.wish, S.queue, S.cursor = wish.strip(), offerings, 0
            S.judgments, S.used_anims = [], set()
            S.play_id, S.llm_used = str(uuid.uuid4()), (lq, lp)
            go("AUDIENCE")

# ------------------------------------------------------------------- AUDIENCE
elif S.screen == "AUDIENCE":
    if S.pending:                                   # 演出を再生してから進む
        p = S.pending
        if p["kind"] == "BEHEAD":
            st.components.v1.html(
                ui.behead(p["anim"], p["retainer"], p["item"],
                          p["reason_label"], bump()), height=436)
            time.sleep(2.5)
            S.pending = None
            S.cursor += 1
            if S.cursor >= len(S.queue):
                S.outcome, S.adopted = "ALL_BEHEADED", None
                go("ENDING")
            st.rerun()
        else:
            st.components.v1.html(
                ui.adopt(p["retainer"], p["item"], bump()), height=436)
            time.sleep(2.6)
            S.pending = None
            go("ENDING")

    off = S.queue[S.cursor]
    r, item = off["retainer"], off["item"]

    head("謁 見 の 間", S.wish)
    st.components.v1.html(
        ui.stage(r, item, off["speech"], len(S.queue), S.cursor, bump()), height=436)

    labels = [REASONS[k]["label"] for k in REASONS]
    keys = list(REASONS.keys())
    choice = st.radio("判決理由", labels, index=len(keys) - 1,
                      horizontal=True, label_visibility="collapsed")
    reason_code = keys[labels.index(choice)]

    b1, b2 = st.columns(2)
    with b1:
        if st.button("🗡  打 ち 首 だ ！"):
            import anim as anim_mod
            a = anim_mod.pick(reason_code, S.cursor + 1, S.used_anims)
            S.used_anims.add(a)
            S.judgments.append({"retainer": r, "item": item, "verdict": "BEHEAD",
                                "reason_code": reason_code,
                                "reason_label": REASONS[reason_code]["label"], "anim": a})
            S.pending = {"kind": "BEHEAD", "anim": a, "retainer": r, "item": item,
                         "reason_label": REASONS[reason_code]["label"]}
            st.rerun()
    with b2:
        if st.button("👑  採 用 じ ゃ", type="primary"):
            S.judgments.append({"retainer": r, "item": item, "verdict": "ADOPT",
                                "reason_code": reason_code,
                                "reason_label": REASONS[reason_code]["label"], "anim": None})
            S.outcome, S.adopted = "ADOPTED", off
            S.pending = {"kind": "ADOPT", "retainer": r, "item": item}
            st.rerun()

# ---------------------------------------------------------------------- ENDING
elif S.screen == "ENDING":
    if "ending_cache" not in S or S.ending_cache.get("play") != S.get("play_id"):
        res = ending_mod.judge(S.wish, S.judgments, S.outcome, S.adopted)
        with st.spinner("年代記を編んでおります……"):
            gen = llm.write_ending(S.wish, S.judgments, S.outcome, S.adopted,
                                   res["fable"]) if llm.available() else None
        if gen:
            res["title"], res["epilogue"] = gen["title"] or res["title"], gen["epilogue"]
        S.ending_cache = {"play": S.get("play_id"), "res": res}
    res = S.ending_cache["res"]

    st.components.v1.html(
        ui.ending_scroll(res["title"], res["fable"], res["epilogue"], bump()), height=436)
    st.markdown('<div class="rule thin"></div>', unsafe_allow_html=True)

    if S.adopted:
        it = S.adopted["item"]
        st.markdown(
            f'<div class="loot"><img src="{it["image"]}">'
            f'<div><div class="n">{it["name"][:64]}</div>'
            f'<div class="p">{it["price"]:,} 円</div></div></div>',
            unsafe_allow_html=True)
    else:
        st.markdown('<div class="loot"><div><div class="n">王子が手にした物</div>'
                    '<div class="p">なし</div></div></div>', unsafe_allow_html=True)

    st.write("")
    for k, v in res["scores"].items():
        st.markdown(f'<div class="sc"><div class="k">{k}</div>'
                    f'<div class="bar"><i style="width:{v}%"></i></div>'
                    f'<div class="v">{v}</div></div>', unsafe_allow_html=True)

    st.write("")
    c1, c2 = st.columns(2)
    with c1:
        if st.button("もう一度わがままを言う", type="primary"):
            S.wish = ""
            go("WISH")
    with c2:
        if st.button("タイトルへ"):
            S.wish = ""
            go("TITLE")
