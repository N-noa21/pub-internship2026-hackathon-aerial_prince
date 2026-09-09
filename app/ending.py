"""診断レポートと後日談。いまはテンプレート。将来 LLM に差し替える。"""

FABLES = {
    "naked_king": ("裸の王様", "諫言する者はもはや城にいない。王子の周りには、うなずく者だけが残った。"),
    "warashibe":  ("わらしべ長者", "その粗末な品は、隣村の祭りで評判を呼び、やがて国の名物となった。"),
    "midas":      ("ミダス王の黄金", "望みは叶った。ただし、望んだ量のちょうど百分の一の大きさで。"),
    "three_wish": ("三つの願い", "王子は望みを一度きり使い、そしてそれを使い切った。"),
    "prudent":    ("堅実なる治世", "国庫は減らず、民は困らず、そして誰の記憶にも残らなかった。"),
}


def judge(wish, judgments, outcome, adopted):
    behead = sum(1 for j in judgments if j["verdict"] == "BEHEAD")
    price = (adopted or {}).get("item", {}).get("price", 0)
    silent = all(not j.get("reason_code") for j in judgments)
    rid = (adopted or {}).get("retainer", {}).get("id")

    if outcome == "ALL_BEHEADED":
        key = "naked_king"
    elif rid == "chancellor":
        key = "prudent"
    elif rid == "farmer":
        key = "warashibe"
    elif price >= 10000:
        key = "midas"
    else:
        key = "three_wish"
    fable, epilogue = FABLES[key]

    if outcome == "ALL_BEHEADED":
        title = "無言の粛清者" if silent else "五人斬りの暴君"
    elif rid == "chancellor":
        title = "正論に屈した王"
    elif rid == "farmer":
        title = "民の心を買った王"
    elif price >= 10000:
        title = "値札を見ぬ王"
    else:
        title = "つつましき暴君"

    scores = {
        "暴君度": min(100, behead * 20),
        "浪費度": min(100, price // 200),
        "堅実さ": 90 if rid == "chancellor" else max(0, 40 - behead * 8),
        "民の信頼": 80 if rid == "farmer" else max(0, 70 - behead * 14),
        "口の悪さ": min(100, sum(20 for j in judgments if j.get("reason_code"))),
    }

    quotes = [j["reason_label"] for j in judgments
              if j["verdict"] == "BEHEAD" and j.get("reason_code")]
    if quotes:
        epilogue += f"\n\n王子は「{quotes[0]}」と言い放った。その一言は、長く語り継がれた。"
    elif outcome == "ALL_BEHEADED":
        epilogue += "\n\n王子は最後まで、ひとことも理由を述べなかった。"

    if adopted:
        item = adopted["item"]
        epilogue += (f"\n\n国庫からの支出は {item['price']:,} 円。"
                     f"献上したのは{adopted['retainer']['name']}であった。")
    return {"title": title, "fable": fable, "epilogue": epilogue,
            "scores": scores, "behead": behead}
