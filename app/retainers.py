"""家臣の定義と、わがまま → 検索語・口上の組み立て。

いまはルールベース。将来ここを LLM（AI SDK for Python）に差し替える。
差し替え点は build_queries() と build_speech() の 2 つだけ。
"""
import random
import re

RETAINERS = [
    {
        "id": "merchant", "name": "商人", "emoji": "🧺",
        "tone": "押しが強い通販番組",
        "twists": ["おもちゃ", "ミニチュア", "グッズ"],
        "speech": [
            "王子！これがなんと{price:,}円！",
            "本日限りのご提供、{price:,}円にございます！",
            "在庫はあとわずか。お求めやすく{price:,}円！",
        ],
    },
    {
        "id": "noble", "name": "貴族", "emoji": "🎩",
        "tone": "気取った見栄っ張り",
        "twists": ["高級", "ブランド", "インテリア"],
        "speech": [
            "ふふ、お目が高い。{price:,}円の品ですわ。",
            "格式というものを、ご覧に入れましょう。",
            "これぞ王家にふさわしき一品かと。",
        ],
    },
    {
        "id": "knight", "name": "騎士", "emoji": "🛡",
        "tone": "実直で忠誠心が高い",
        "twists": ["セット", "本格", "アウトドア"],
        "speech": [
            "実用に耐えまする。お納めください。",
            "この身に代えても、と選び抜きました。",
            "堅牢にございます。間違いございませぬ。",
        ],
    },
    {
        "id": "farmer", "name": "農民", "emoji": "🌾",
        "tone": "素朴で必死",
        "twists": ["食品", "詰め合わせ", "1kg"],
        "speech": [
            "うちの村の精一杯でごぜぇます……",
            "こ、こんなもんしか無ぇですが……",
            "みんなで持ち寄ったですだ！",
        ],
    },
    {
        "id": "chancellor", "name": "宰相", "emoji": "📜",
        "tone": "落ち着いた常識人（まとも枠）",
        "twists": ["入門 セット", "実用", "体験"],
        "speech": [
            "現実的な線で申し上げます。これが妥当かと。",
            "夢はございませんが、確実にございます。",
            "予算と実現性を考えますと、これに尽きます。",
        ],
    },
]

REASONS = {
    "rude":         {"label": "無礼者！",       "anim": "a03-cannon"},
    "cheap":        {"label": "安っぽい",       "anim": "a04-stamp"},
    "not_my_taste": {"label": "趣味ではない",   "anim": "a01-fall"},
    "too_pricey":   {"label": "高すぎる",       "anim": "a04-stamp"},
    "off_point":    {"label": "解釈違いじゃ",   "anim": "a02-drag"},
    None:           {"label": "（無言で斬る）", "anim": None},
}

# 「〜が欲しいのじゃ」などの言い回しを削って、検索に使える語を取り出す
_TAIL = re.compile(
    r"(が|を|は|も)?\s*(ほしい|欲しい|よこせ|与えよ|持て|持ってこい|くれ|ください|したい|"
    r"なりたい|乗りたい|行きたい|食べたい|見たい|用意せよ|準備せよ|所望する|所望じゃ)?\s*"
    r"(のじゃ|のだ|んじゃ|じゃ|だ|です|ぞ|ぞよ|よ|な|！|!|。|、)*\s*$"
)
# 「白馬に乗りたい」→「白馬」のように、助詞の手前で切る
_PARTICLE = re.compile(r"[をにへ]")
# 漢字・カタカナの最長連続＝だいたい名詞
_NOUNISH = re.compile(r"[\u4E00-\u9FFF\u30A0-\u30FFー]{2,}")
_HEAD = re.compile(r"^\s*(わしは|余は|私は|僕は|俺は|わたしは)\s*")


def extract_keyword(wish: str) -> str:
    s = wish.strip().replace("。", "、").split("、")[-1] or wish.strip()
    s = _HEAD.sub("", s.strip())
    s = _TAIL.sub("", s)
    s = s.strip("　 、。!！?？")
    m = _PARTICLE.search(s)
    if m and m.start() >= 1:
        s = s[: m.start()]
    return s or wish.strip()


_LEAD_KANA = re.compile(r"^[\u3040-\u309F]{2,}")


wish_cache: dict[str, str] = {}


def core_nouns(kw: str) -> list[str]:
    """「でっかい城」→「城」のように、検索が当たりやすい短い語も用意する。"""
    # 短い語のほうが実際に当たりやすい。当たる順に並べる（＝API 呼び出し回数を減らす）
    out = []
    stripped = _LEAD_KANA.sub("", kw)
    out.append(stripped if stripped else kw)   # 「でっかい城」→「城」を先に試す（当たりやすい）
    out.append(kw)
    if "の" in kw:                              # 「最強の剣」→「剣」
        tail = kw.rsplit("の", 1)[-1]
        if tail and _NOUNISH.fullmatch(tail + tail[-1:]):
            out.append(tail)
    # 最後の砦: 漢字・カタカナの最長連続を名詞とみなす
    nouns = _NOUNISH.findall(wish_cache.get("raw", kw))
    if nouns:
        out.append(max(nouns, key=len))
    seen, uniq = set(), []
    for c in out:
        if c and c not in seen:
            seen.add(c); uniq.append(c)
    return uniq


def build_queries(wish: str) -> list[dict]:
    """家臣 5 人ぶんの検索語を作る。将来ここを LLM に差し替える。

    candidates は「試す順」。前のものほど狙い通りだが、当たらないことがある。
    """
    wish_cache["raw"] = wish
    kw = extract_keyword(wish)
    cores = core_nouns(kw)
    out = []
    for r in RETAINERS:
        twist = random.choice(r["twists"])
        candidates = [f"{c} {twist}" for c in cores] + cores
        out.append({"retainer": r, "query": candidates[0],
                    "candidates": candidates, "twist_type": twist})
    return out


def build_speech(retainer: dict, item: dict) -> str:
    return random.choice(retainer["speech"]).format(price=item.get("price") or 0)
