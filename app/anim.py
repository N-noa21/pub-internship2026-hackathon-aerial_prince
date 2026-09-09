"""打ち首（退場）アニメーション。

docs/tech/04-animation-spec.md のコントラクトに従う。
- 1 演出 = CSS 1 ブロック、CSS のみ、外部リソースなし
- セレクタは .stage[data-anim="<id>"] 配下、@keyframes 名は <id>- 接頭辞
- 1.2 秒以内に .victim が不可視になる
"""
import random

ANIMS = {
    # 落とし穴
    "a01-fall": """
.stage[data-anim="a01-fall"] .victim { animation: a01-drop .95s cubic-bezier(.6,0,.9,.3) forwards; }
@keyframes a01-drop {
  0%{transform:translateY(0) rotate(0)} 18%{transform:translateY(-14px) rotate(-4deg)}
  100%{transform:translateY(420px) rotate(16deg); opacity:0}
}
.stage[data-anim="a01-fall"] .fx {
  position:absolute; left:50%; bottom:44px; width:200px; height:52px; margin-left:-100px;
  background:radial-gradient(ellipse at 50% 50%, #000 0 62%, transparent 63%);
  transform:scaleX(0); animation: a01-hole .95s ease-out forwards;
}
@keyframes a01-hole { 0%{transform:scaleX(0)} 22%{transform:scaleX(1)} 100%{transform:scaleX(1)} }
""",
    # 衛兵に連行
    "a02-drag": """
.stage[data-anim="a02-drag"] .victim { animation: a02-drag-out 1.1s ease-in forwards; }
@keyframes a02-drag-out {
  0%{transform:translateX(0) rotate(0)} 15%{transform:translateX(24px) rotate(6deg)}
  100%{transform:translateX(-620px) rotate(-22deg); opacity:0}
}
.stage[data-anim="a02-drag"] .fx::before,
.stage[data-anim="a02-drag"] .fx::after {
  content:"🗡"; position:absolute; bottom:70px; font-size:30px;
  animation: a02-guard 1.1s ease-in forwards;
}
.stage[data-anim="a02-drag"] .fx::before { left:58%; }
.stage[data-anim="a02-drag"] .fx::after  { left:64%; animation-delay:.05s; }
@keyframes a02-guard { 0%{transform:translateX(140px);opacity:0} 20%{opacity:1} 100%{transform:translateX(-520px);opacity:0} }
""",
    # 大砲で発射
    "a03-cannon": """
.stage[data-anim="a03-cannon"] .victim { animation: a03-launch 1.15s cubic-bezier(.2,.7,.4,1) forwards; }
@keyframes a03-launch {
  0%{transform:translate(0,0) scale(1) rotate(0)} 12%{transform:translate(-10px,10px) scale(.9)}
  100%{transform:translate(460px,-420px) scale(.15) rotate(520deg); opacity:0}
}
.stage[data-anim="a03-cannon"] .fx::after {
  content:"💥"; position:absolute; left:44%; bottom:96px; font-size:56px; opacity:0;
  animation: a03-boom .5s ease-out forwards;
}
@keyframes a03-boom { 0%{opacity:0;transform:scale(.3)} 30%{opacity:1;transform:scale(1.3)} 100%{opacity:0;transform:scale(1.8)} }
""",
    # 却下スタンプ
    "a04-stamp": """
.stage[data-anim="a04-stamp"] .victim { animation: a04-squash 1.0s steps(1,end) forwards; }
@keyframes a04-squash {
  0%,44%{transform:scaleY(1)} 46%{transform:scaleY(.18) translateY(64px)}
  70%{transform:scaleY(.18) translateY(64px); opacity:1} 100%{opacity:0}
}
.stage[data-anim="a04-stamp"] .fx::after {
  content:"却下"; position:absolute; left:50%; top:6px; margin-left:-72px;
  width:144px; line-height:74px; text-align:center; font-size:38px; font-weight:900;
  color:#b3121b; border:7px solid #b3121b; border-radius:10px; letter-spacing:6px;
  transform:translateY(-260px) rotate(-14deg); animation: a04-drop .55s cubic-bezier(.5,0,.9,.2) forwards;
}
@keyframes a04-drop {
  0%{transform:translateY(-260px) rotate(-14deg); opacity:0}
  60%{opacity:1} 78%{transform:translateY(96px) rotate(-14deg) scale(1.05)}
  100%{transform:translateY(88px) rotate(-14deg); opacity:1}
}
""",
}

ORDER = ["a01-fall", "a02-drag", "a04-stamp", "a03-cannon"]  # 地味 → 派手


def pick(reason_code: str | None, combo: int, used: set[str]) -> str:
    from retainers import REASONS
    if combo >= 5:
        return "a03-cannon"                       # 5 人目は一番派手なもので固定
    mapped = REASONS.get(reason_code, {}).get("anim")
    if mapped:
        return mapped
    unused = [a for a in ORDER if a not in used]
    return random.choice(unused or ORDER)


TEMPLATE = """
<style>
  html,body{{margin:0;background:transparent}}
  .stage{{position:relative;height:340px;overflow:hidden;
    background:linear-gradient(#3a1414,#241010 62%,#7d1d1d 62%,#5e1616);
    border:3px solid #c9a227;border-radius:10px;font-family:sans-serif}}
  .victim{{position:absolute;left:50%;bottom:56px;margin-left:-92px;width:184px;text-align:center}}
  .victim .face{{font-size:62px;line-height:1}}
  .victim .item{{width:78px;height:78px;object-fit:contain;background:#f4e8d0;
    border:2px solid #c9a227;border-radius:8px;margin-top:6px}}
  .victim .speech{{margin:6px 0 0;color:#f4e8d0;font-size:14px;font-weight:700;
    text-shadow:0 1px 2px #000;white-space:nowrap}}
  .fx{{position:absolute;inset:0;pointer-events:none}}
  {css}
</style>
<div class="stage" data-anim="{anim}" data-n="{nonce}">
  <div class="victim">
    <div class="face">{emoji}</div>
    <img class="item" src="{image}">
    <p class="speech">{cry}</p>
  </div>
  <div class="fx"></div>
</div>
"""

CRIES = ["お待ちをーっ", "ぬわーっ", "無念……", "とんでもございませーん", "ご無体な！"]


def html(anim_id: str, emoji: str, image: str, nonce: int, cry: str | None = None) -> str:
    import random as _r
    return TEMPLATE.format(
        css=ANIMS[anim_id], anim=anim_id, nonce=nonce,
        emoji=emoji, image=image, cry=cry or _r.choice(CRIES),
    )
