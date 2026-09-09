"""画面の見た目（HTML/CSS）。components.html に流し込む部品。

企画は ../docs/03-presentation.md、アニメーションの型は
../docs/tech/04-animation-spec.md に対応する。
CSS のみ・外部リソース読み込みなし（Snowflake の CSP を見据えている）。
"""

PALETTE = """
:root{
  --gold:#d9b544; --gold-d:#8a6a1c; --gold-l:#f6e3a1;
  --crimson:#8f1b1b; --crimson-d:#5c0f0f; --parch:#f3e7ca; --parch-d:#dbc79a;
  --ink:#2c1c12; --night:#1b0a0b;
}
"""

BASE = """
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:transparent;
  font-family:"Hiragino Mincho ProN","Yu Mincho",YuMincho,serif;}
.room{position:relative;width:100%;height:100%;overflow:hidden;border-radius:12px;
  border:3px solid var(--gold-d);
  background:
    radial-gradient(120% 66% at 50% -12%, rgba(255,205,120,.22), transparent 58%),
    linear-gradient(#200c0d 0%, #381213 38%, #481616 57%,
                    #7d2020 57%, #6a1a1a 74%, #4c1212 100%);}
/* 柱 */
.pillar{position:absolute;top:-6%;height:64%;width:46px;
  background:linear-gradient(90deg,#1a0a0a,#6b4a1c 18%,var(--gold-d) 42%,
             var(--gold-l) 52%,var(--gold-d) 62%,#6b4a1c 82%,#1a0a0a);
  opacity:.5;border-radius:0 0 4px 4px}
.pillar.l{left:26px} .pillar.r{right:26px}
.pillar:after{content:"";position:absolute;left:-10px;right:-10px;bottom:-14px;height:14px;
  background:linear-gradient(180deg,var(--gold-d),#2a1608);border-radius:3px;opacity:.9}
/* アーチ */
.arch{position:absolute;left:50%;top:-32%;width:300px;height:300px;margin-left:-150px;
  border-radius:50%;border:6px solid rgba(217,181,68,.30);
  box-shadow:0 0 60px rgba(255,200,110,.14) inset}
/* 赤絨毯 */
.carpet{position:absolute;left:50%;bottom:0;width:74%;height:44%;transform:translateX(-50%);
  background:linear-gradient(#a52222,#6d1414);
  clip-path:polygon(30% 0,70% 0,100% 100%,0 100%);
  box-shadow:0 -8px 30px rgba(0,0,0,.4) inset}
.carpet:before{content:"";position:absolute;inset:0;
  background:repeating-linear-gradient(180deg,transparent 0 26px,rgba(0,0,0,.10) 26px 28px)}
.carpet:after{content:"";position:absolute;left:8%;right:8%;top:0;bottom:0;
  border-left:3px solid rgba(217,181,68,.5);border-right:3px solid rgba(217,181,68,.5);
  clip-path:polygon(30% 0,70% 0,100% 100%,0 100%)}
/* 松明 */
.torch{position:absolute;top:16%;width:120px;height:120px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,180,80,.55),transparent 66%);
  animation:flick 2.4s ease-in-out infinite}
.torch.l{left:-14px} .torch.r{right:-14px;animation-delay:.7s}
@keyframes flick{0%,100%{opacity:.75;transform:scale(1)}
  38%{opacity:1;transform:scale(1.08)} 62%{opacity:.62;transform:scale(.96)}}
/* 埃 */
.dust{position:absolute;width:3px;height:3px;border-radius:50%;
  background:rgba(255,225,170,.5);animation:rise linear infinite}
@keyframes rise{0%{transform:translateY(0);opacity:0}
  12%{opacity:.9} 100%{transform:translateY(-260px);opacity:0}}
/* 周辺減光 */
.vig{position:absolute;inset:0;pointer-events:none;
  box-shadow:inset 0 0 110px 34px rgba(0,0,0,.72)}
/* 列インジケータ */
.queue{position:absolute;top:12px;left:0;right:0;text-align:center;z-index:5}
.q{display:inline-block;width:11px;height:11px;margin:0 5px;border-radius:50%;
  border:2px solid var(--gold);background:transparent;vertical-align:middle}
.q.on{background:var(--gold);box-shadow:0 0 10px rgba(217,181,68,.8)}
.q.now{transform:scale(1.5);animation:pulse 1.1s ease-in-out infinite}
.q.gone{border-color:#6a3a3a;opacity:.5;position:relative}
.q.gone:after{content:"";position:absolute;left:-3px;top:3px;width:14px;height:2px;
  background:#8a4a4a;transform:rotate(-45deg)}
@keyframes pulse{0%,100%{transform:scale(1.5)}50%{transform:scale(1.85)}}
/* 家臣 */
.figure{position:absolute;left:50%;bottom:34%;margin-left:-70px;width:140px;text-align:center;z-index:4}
.figure .body{font-size:70px;line-height:1;filter:drop-shadow(0 6px 10px rgba(0,0,0,.55));
  animation:bob 2.6s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-6px) rotate(1deg)}}
.figure .shadow{width:86px;height:14px;margin:2px auto 0;border-radius:50%;
  background:radial-gradient(ellipse,rgba(0,0,0,.55),transparent 70%)}
.plate{display:inline-block;margin-top:4px;padding:2px 14px;font-size:13px;letter-spacing:.22em;
  color:#2a1a08;background:linear-gradient(180deg,var(--gold-l),var(--gold),var(--gold-d));
  border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,.5)}
/* 献上カード */
.card{position:absolute;right:18px;top:16%;width:250px;z-index:6;
  padding:12px 13px 14px;color:var(--ink);
  background:linear-gradient(160deg,var(--parch),var(--parch-d));
  border:2px solid var(--gold-d);border-radius:6px;
  box-shadow:0 14px 34px rgba(0,0,0,.55), 0 0 0 4px rgba(217,181,68,.25);
  transform:rotate(-1.4deg)}
.card:before{content:"";position:absolute;inset:5px;border:1px solid rgba(138,106,28,.55);
  border-radius:4px;pointer-events:none}
.corner{position:absolute;width:12px;height:12px;color:var(--gold-d);font-size:12px;line-height:1}
.corner.tl{left:7px;top:5px} .corner.tr{right:7px;top:5px}
.corner.bl{left:7px;bottom:5px} .corner.br{right:7px;bottom:5px}
.thumb{width:100%;height:104px;object-fit:contain;background:#fffaf0;
  border:1px solid var(--gold-d);border-radius:3px}
.iname{font-size:12.5px;line-height:1.5;margin:8px 2px 6px;height:3.6em;overflow:hidden}
.price{font-size:23px;font-weight:900;letter-spacing:.02em;color:var(--crimson);
  font-family:"Yu Gothic",sans-serif}
.price small{font-size:12px;margin-left:2px}
.seal{position:absolute;right:-14px;bottom:-14px;width:52px;height:52px;border-radius:50%;
  background:radial-gradient(circle at 34% 30%,#c33,#7d1010 70%);
  color:#f7e6c6;font-size:11px;letter-spacing:.1em;text-align:center;line-height:52px;
  box-shadow:0 4px 10px rgba(0,0,0,.5);transform:rotate(-12deg)}
/* 吹き出し */
.speech{position:absolute;left:20px;bottom:16%;max-width:230px;z-index:6;
  padding:10px 13px;color:var(--ink);font-size:13.5px;line-height:1.6;
  background:linear-gradient(160deg,#fdf6e3,var(--parch));
  border:2px solid var(--gold-d);border-radius:10px}
.speech:after{content:"";position:absolute;right:-11px;bottom:16px;border:9px solid transparent;
  border-left-color:var(--gold-d)}
/* 登場 */
.enter-fig{animation:walkin .75s cubic-bezier(.2,.7,.3,1) both}
@keyframes walkin{0%{transform:translateX(220px) scale(.82);opacity:0}
  60%{transform:translateX(-12px) scale(1.03);opacity:1} 100%{transform:translateX(0) scale(1)}}
.enter-card{animation:cardin .6s cubic-bezier(.2,.8,.3,1) .28s both}
@keyframes cardin{0%{transform:rotate(-14deg) translateY(-40px) scale(.7);opacity:0}
  100%{transform:rotate(-1.4deg) translateY(0) scale(1);opacity:1}}
.enter-speech{animation:sp .4s ease-out .62s both}
@keyframes sp{0%{transform:scale(.6) translateY(10px);opacity:0}100%{transform:scale(1);opacity:1}}
"""


def _dust(n: int = 9) -> str:
    import random
    out = []
    for i in range(n):
        out.append(
            f'<div class="dust" style="left:{random.randint(6,94)}%;'
            f'bottom:{random.randint(4,40)}%;'
            f'animation-duration:{random.uniform(5,11):.1f}s;'
            f'animation-delay:-{random.uniform(0,8):.1f}s"></div>')
    return "".join(out)


def _room_bg() -> str:
    return ('<div class="pillar l"></div><div class="pillar r"></div>'
            '<div class="arch"></div><div class="carpet"></div>'
            '<div class="torch l"></div><div class="torch r"></div>'
            + _dust() + '<div class="vig"></div>')


def _queue(total: int, cursor: int) -> str:
    dots = []
    for i in range(total):
        cls = "q gone" if i < cursor else ("q on now" if i == cursor else "q on")
        dots.append(f'<div class="{cls}"></div>')
    return f'<div class="queue">{"".join(dots)}</div>'


def _card(item: dict, entering: bool = True) -> str:
    cls = "card enter-card" if entering else "card"
    return f'''<div class="{cls}">
      <span class="corner tl">◆</span><span class="corner tr">◆</span>
      <span class="corner bl">◆</span><span class="corner br">◆</span>
      <img class="thumb" src="{item['image']}">
      <div class="iname">{item['name'][:56]}</div>
      <div class="price">{item['price']:,}<small>円</small></div>
      <div class="seal">献上</div>
    </div>'''


def stage(retainer: dict, item: dict, speech: str, total: int, cursor: int,
          nonce: int, height: int = 430) -> str:
    """謁見の間。家臣が歩いてきて、献上品カードと口上が出る。"""
    return f'''<style>{PALETTE}{BASE}
      .room{{height:{height - 6}px}}</style>
    <div class="room" data-n="{nonce}">
      {_room_bg()}
      {_queue(total, cursor)}
      <div class="figure enter-fig">
        <div class="body">{retainer['emoji']}</div>
        <div class="shadow"></div>
        <div class="plate">{retainer['name']}</div>
      </div>
      {_card(item)}
      <div class="speech enter-speech">「{speech}」</div>
    </div>'''


# ================================================================ 打ち首演出
SLASH = """
.flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:20;
  animation:fl .5s ease-out both}
@keyframes fl{0%{opacity:0}6%{opacity:.85}18%{opacity:0}
  22%{opacity:.5;background:#ff5a3c}34%{opacity:0}100%{opacity:0}}
.slash{position:absolute;left:-10%;top:50%;width:120%;height:5px;z-index:21;
  background:linear-gradient(90deg,transparent,#fff,#ffe9a8,#fff,transparent);
  transform:rotate(-24deg) scaleX(0);transform-origin:left center;
  animation:sl .42s cubic-bezier(.2,.9,.3,1) both}
.slash.b{top:44%;animation-delay:.1s;transform:rotate(-16deg) scaleX(0)}
@keyframes sl{0%{transform:rotate(-24deg) scaleX(0);opacity:1}
  55%{transform:rotate(-24deg) scaleX(1);opacity:1}
  100%{transform:rotate(-24deg) scaleX(1);opacity:0}}
.verdict{position:absolute;left:0;right:0;top:34%;z-index:22;text-align:center;
  font-size:44px;font-weight:900;letter-spacing:.16em;color:#fff4d8;
  text-shadow:0 0 22px #ff3b1f,0 4px 0 #7d0f0f,0 0 60px rgba(255,90,40,.8);
  animation:vd 1.15s cubic-bezier(.2,.9,.3,1) both}
@keyframes vd{0%{transform:scale(2.6);opacity:0;filter:blur(8px)}
  14%{transform:scale(1);opacity:1;filter:blur(0)}
  20%{transform:scale(1.06) translateX(-6px)} 26%{transform:scale(1) translateX(5px)}
  32%{transform:scale(1)} 78%{opacity:1} 100%{opacity:0;transform:scale(1.1)}}
.why{position:absolute;left:0;right:0;top:calc(34% + 54px);z-index:22;text-align:center;
  font-size:15px;letter-spacing:.2em;color:#ffd9a8;animation:vd 1.15s ease-out .12s both}
.shake{animation:shk .5s cubic-bezier(.36,.07,.19,.97) both}
@keyframes shk{10%{transform:translate(-6px,3px)}20%{transform:translate(7px,-4px)}
  30%{transform:translate(-8px,-2px)}40%{transform:translate(6px,4px)}
  50%{transform:translate(-4px,2px)}60%{transform:translate(4px,-2px)}
  70%{transform:translate(-3px,1px)}100%{transform:translate(0,0)}}
"""

ANIMS = {
    # 落とし穴 — 床が観音開きに割れて落ちる
    "a01-fall": """
.stage[data-anim="a01-fall"] .victim{animation:a01-drop 1.0s cubic-bezier(.55,0,.9,.35) .62s both}
@keyframes a01-drop{0%{transform:translateY(0) rotate(0)}
  16%{transform:translateY(-16px) rotate(-5deg)}
  100%{transform:translateY(360px) rotate(22deg);opacity:0}}
.stage[data-anim="a01-fall"] .fx:before,
.stage[data-anim="a01-fall"] .fx:after{content:"";position:absolute;bottom:26%;width:104px;height:20px;
  background:linear-gradient(180deg,#7d1f1f,#3a0d0d);border-top:2px solid #d9b544;
  transform-origin:top center;animation:a01-door .5s ease-in .5s both}
.stage[data-anim="a01-fall"] .fx:before{left:calc(50% - 104px);transform-origin:right center}
.stage[data-anim="a01-fall"] .fx:after{left:50%}
@keyframes a01-door{0%{transform:rotateX(0) }100%{transform:rotateX(88deg)}}
.stage[data-anim="a01-fall"] .hole{position:absolute;left:50%;bottom:24%;width:200px;height:44px;
  margin-left:-100px;border-radius:50%;background:radial-gradient(ellipse,#000 0 64%,transparent 66%);
  transform:scaleX(0);animation:a01-hole .45s ease-out .52s forwards}
@keyframes a01-hole{to{transform:scaleX(1)}}
.stage[data-anim="a01-fall"] .puff{position:absolute;left:50%;bottom:24%;width:150px;height:40px;
  margin-left:-75px;border-radius:50%;background:rgba(200,170,130,.55);opacity:0;
  animation:a01-puff .7s ease-out 1.35s both}
@keyframes a01-puff{0%{opacity:0;transform:scale(.4)}30%{opacity:.85}100%{opacity:0;transform:scale(2.1)}}
""",
    # 衛兵に連行
    "a02-drag": """
.stage[data-anim="a02-drag"] .victim{animation:a02-out 1.25s ease-in .62s both}
@keyframes a02-out{0%{transform:translateX(0) rotate(0)}
  10%{transform:translateX(10px) rotate(6deg)} 18%{transform:translateX(-6px) rotate(-6deg)}
  26%{transform:translateX(8px) rotate(5deg)}
  100%{transform:translateX(-560px) rotate(-26deg);opacity:0}}
.stage[data-anim="a02-drag"] .g1,.stage[data-anim="a02-drag"] .g2{position:absolute;bottom:34%;
  font-size:40px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.6));animation:a02-guard 1.35s ease-in .52s both}
.stage[data-anim="a02-drag"] .g1{left:52%}
.stage[data-anim="a02-drag"] .g2{left:44%;animation-delay:.58s}
@keyframes a02-guard{0%{transform:translateX(300px);opacity:0}
  16%{transform:translateX(0);opacity:1} 30%{transform:translateX(-10px)}
  100%{transform:translateX(-540px);opacity:0}}
.stage[data-anim="a02-drag"] .trail{position:absolute;left:8%;right:44%;bottom:31%;height:6px;
  background:repeating-linear-gradient(90deg,rgba(0,0,0,.35) 0 14px,transparent 14px 26px);
  transform-origin:right center;transform:scaleX(0);animation:a02-tr .9s ease-out .78s forwards}
@keyframes a02-tr{to{transform:scaleX(1)}}
""",
    # 大砲で発射
    "a03-cannon": """
.stage[data-anim="a03-cannon"] .victim{animation:a03-fly 1.3s cubic-bezier(.15,.65,.4,1) .72s both}
@keyframes a03-fly{0%{transform:translate(0,0) scale(1) rotate(0)}
  10%{transform:translate(-18px,12px) scale(.9) rotate(-8deg)}
  100%{transform:translate(430px,-380px) scale(.12) rotate(700deg);opacity:0}}
.stage[data-anim="a03-cannon"] .cannon{position:absolute;left:16%;bottom:26%;font-size:46px;
  transform:translateX(-200px) rotate(-18deg);animation:a03-in .45s ease-out .5s both}
@keyframes a03-in{0%{transform:translateX(-200px) rotate(-18deg)}
  70%{transform:translateX(14px) rotate(-18deg)}100%{transform:translateX(0) rotate(-18deg)}}
.stage[data-anim="a03-cannon"] .boom{position:absolute;left:44%;bottom:34%;font-size:70px;opacity:0;
  animation:a03-boom .55s ease-out .72s both}
@keyframes a03-boom{0%{opacity:0;transform:scale(.3)}25%{opacity:1;transform:scale(1.35)}
  100%{opacity:0;transform:scale(2.2)}}
.stage[data-anim="a03-cannon"] .star{position:absolute;right:12%;top:12%;font-size:26px;opacity:0;
  animation:a03-star .6s ease-out 1.72s both}
@keyframes a03-star{0%{opacity:0;transform:scale(.2) rotate(0)}
  40%{opacity:1;transform:scale(1.3) rotate(90deg)}100%{opacity:0;transform:scale(.6) rotate(180deg)}}
""",
    # 却下スタンプ
    "a04-stamp": """
.stage[data-anim="a04-stamp"] .victim{animation:a04-sq 1.5s steps(1,end) .62s both}
@keyframes a04-sq{0%,32%{transform:scaleY(1) scaleX(1)}
  34%{transform:scaleY(.16) scaleX(1.35) translateY(58px)}
  76%{transform:scaleY(.16) scaleX(1.35) translateY(58px);opacity:1}
  100%{transform:scaleY(.16) scaleX(1.35) translateY(58px);opacity:0}}
.stage[data-anim="a04-stamp"] .stamp{position:absolute;left:50%;top:0;margin-left:-84px;
  width:168px;line-height:80px;text-align:center;font-size:42px;font-weight:900;letter-spacing:8px;
  color:#b3121b;border:8px solid #b3121b;border-radius:12px;background:rgba(255,245,230,.06);
  text-shadow:0 0 12px rgba(179,18,27,.5);opacity:0;
  animation:a04-drop .6s cubic-bezier(.5,0,.85,.2) .5s both}
@keyframes a04-drop{0%{transform:translateY(-320px) rotate(-18deg) scale(1.5);opacity:0}
  50%{opacity:1} 72%{transform:translateY(120px) rotate(-13deg) scale(1.02)}
  82%{transform:translateY(104px) rotate(-13deg) scale(1)}
  100%{transform:translateY(108px) rotate(-13deg) scale(1);opacity:1}}
.stage[data-anim="a04-stamp"] .ink i{position:absolute;left:50%;top:52%;width:9px;height:9px;
  border-radius:50%;background:#b3121b;opacity:0;animation:a04-ink .7s ease-out .95s both}
@keyframes a04-ink{0%{opacity:0;transform:translate(0,0) scale(.4)}
  20%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.1)}}
""",
}

_INK = "".join(
    f'<i style="--x:{x}px;--y:{y}px;animation-delay:{d}s"></i>'
    for x, y, d in [(-92, -34, .95), (78, -46, .98), (-58, 40, 1.0),
                    (104, 26, .96), (-120, 8, 1.02), (44, 58, 1.0)])

_EXTRA = {
    "a01-fall": '<div class="hole"></div><div class="puff"></div>',
    "a02-drag": '<div class="g1">💂</div><div class="g2">💂</div><div class="trail"></div>',
    "a03-cannon": '<div class="cannon">🔫</div><div class="boom">💥</div><div class="star">✨</div>',
    "a04-stamp": f'<div class="stamp">却下</div><div class="ink">{_INK}</div>',
}

_SHAKE = {"a03-cannon": ".72s", "a04-stamp": "1.05s"}


def behead(anim_id: str, retainer: dict, item: dict, reason_label: str,
           nonce: int, height: int = 430) -> str:
    shake = (f'.room{{animation:shk .5s cubic-bezier(.36,.07,.19,.97) '
             f'{_SHAKE[anim_id]} both}}' if anim_id in _SHAKE else "")
    why = (f'<div class="why">— {reason_label} —</div>'
           if reason_label and "無言" not in reason_label else "")
    return f'''<style>{PALETTE}{BASE}{SLASH}
      .room{{height:{height - 6}px}}
      .stage{{position:absolute;inset:0}}
      .victim{{position:absolute;left:50%;bottom:32%;margin-left:-60px;width:120px;text-align:center;z-index:8}}
      .victim .body{{font-size:70px;line-height:1;filter:drop-shadow(0 6px 10px rgba(0,0,0,.6))}}
      .victim .held{{width:56px;height:56px;object-fit:contain;background:#fffaf0;
        border:2px solid var(--gold-d);border-radius:4px;margin-top:2px}}
      .fx{{position:absolute;inset:0;pointer-events:none;z-index:7}}
      {shake}
      {ANIMS[anim_id]}</style>
    <div class="room" data-n="{nonce}">
      {_room_bg()}
      <div class="stage" data-anim="{anim_id}">
        <div class="victim">
          <div class="body">{retainer['emoji']}</div>
          <img class="held" src="{item['image']}">
        </div>
        <div class="fx">{_EXTRA[anim_id]}</div>
      </div>
      <div class="flash"></div>
      <div class="slash"></div><div class="slash b"></div>
      <div class="verdict">打ち首じゃ！</div>
      {why}
    </div>'''


# ================================================================ 採用演出
ADOPT = """
.rays{position:absolute;left:50%;top:50%;width:900px;height:900px;margin:-450px 0 0 -450px;
  background:repeating-conic-gradient(rgba(255,225,150,.16) 0 7deg, transparent 7deg 15deg);
  animation:spin 16s linear infinite;z-index:2}
@keyframes spin{to{transform:rotate(360deg)}}
.glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,
  rgba(255,220,140,.4),transparent 58%);animation:gl 1.6s ease-out both;z-index:3}
@keyframes gl{0%{opacity:0}30%{opacity:1}100%{opacity:.55}}
.conf i{position:absolute;top:-24px;width:9px;height:14px;opacity:0;z-index:9;
  animation:cf 2.4s linear both}
@keyframes cf{0%{opacity:0;transform:translateY(0) rotate(0)}
  10%{opacity:1}100%{opacity:0;transform:translateY(440px) rotate(720deg)}}
.grand{position:absolute;left:0;right:0;top:26%;text-align:center;z-index:12;
  font-size:40px;font-weight:900;letter-spacing:.22em;color:#fff6dc;
  text-shadow:0 0 26px rgba(255,200,90,.95),0 4px 0 #8a6a1c;
  animation:gr 1.1s cubic-bezier(.2,.9,.3,1) both}
@keyframes gr{0%{transform:scale(.4) translateY(20px);opacity:0}
  60%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
"""


def adopt(retainer: dict, item: dict, nonce: int, height: int = 430) -> str:
    import random
    conf = "".join(
        f'<i style="left:{random.randint(3,96)}%;'
        f'background:{random.choice(["#d9b544","#f6e3a1","#8f1b1b","#fff6dc"])};'
        f'animation-delay:{random.uniform(0,.9):.2f}s"></i>' for _ in range(26))
    return f'''<style>{PALETTE}{BASE}{ADOPT}
      .room{{height:{height - 6}px}}
      .figure{{bottom:30%;animation:gr 1s cubic-bezier(.2,.9,.3,1) both;z-index:10}}
      .card{{right:18px;top:16%;z-index:11;box-shadow:0 0 0 4px rgba(217,181,68,.6),
        0 0 44px rgba(255,210,120,.75),0 14px 34px rgba(0,0,0,.5)}}</style>
    <div class="room" data-n="{nonce}">
      {_room_bg()}
      <div class="rays"></div><div class="glow"></div>
      <div class="conf">{conf}</div>
      <div class="grand">大儀である</div>
      <div class="figure">
        <div class="body">{retainer['emoji']}</div>
        <div class="shadow"></div>
        <div class="plate">{retainer['name']}</div>
      </div>
      {_card(item, entering=False)}
      <div class="vig"></div>
    </div>'''


# ================================================================ タイトル
TITLE_CSS = """
.crest{position:absolute;left:0;right:0;top:16%;text-align:center;z-index:10}
.crest .crown{font-size:52px;filter:drop-shadow(0 0 22px rgba(255,205,110,.8));
  animation:cfloat 3.4s ease-in-out infinite}
@keyframes cfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.logo{position:relative;display:inline-block;margin-top:6px;
  font-size:52px;font-weight:900;letter-spacing:.14em;
  background:linear-gradient(180deg,#fff4d0 8%,#d9b544 46%,#8a6a1c 62%,#f6e3a1 88%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 3px 0 #4a0d0d) drop-shadow(0 0 26px rgba(217,181,68,.45));
  animation:lin 1.1s cubic-bezier(.2,.9,.3,1) both}
@keyframes lin{0%{transform:scale(1.5);opacity:0;filter:blur(10px)}
  100%{transform:scale(1);opacity:1;filter:blur(0)}}
.logo:after{content:"";position:absolute;inset:0;
  background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.85) 48%,transparent 58%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:shine 4.2s ease-in-out 1.2s infinite}
@keyframes shine{0%{transform:translateX(-120%)}38%,100%{transform:translateX(120%)}}
.tagline{margin-top:10px;color:#e8d3a8;font-size:13px;letter-spacing:.42em;
  animation:fadein .8s ease-out .9s both}
.ribbon{margin:16px auto 0;width:290px;height:2px;
  background:linear-gradient(90deg,transparent,var(--gold),transparent);
  animation:fadein .8s ease-out 1.1s both}
.lead{margin-top:16px;color:#f0e0bd;font-size:14px;letter-spacing:.16em;
  animation:fadein .9s ease-out 1.35s both}
@keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
"""


def title_screen(nonce: int, height: int = 330) -> str:
    return f'''<style>{PALETTE}{BASE}{TITLE_CSS}
      .room{{height:{height - 6}px}}</style>
    <div class="room" data-n="{nonce}">
      {_room_bg()}
      <div class="crest">
        <div class="crown">👑</div>
        <div class="logo">下民ショッピング</div>
        <div class="tagline">わがまま王子の謁見</div>
        <div class="ribbon"></div>
        <div class="lead">わがままを申せ。気に入らぬ者は斬るがよい。</div>
      </div>
    </div>'''


# ================================================================ エンディング
SCROLL_CSS = """
.wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.rod{position:absolute;left:50%;width:330px;height:16px;margin-left:-165px;border-radius:8px;
  background:linear-gradient(180deg,var(--gold-l),var(--gold),var(--gold-d));
  box-shadow:0 3px 8px rgba(0,0,0,.6);z-index:12}
.rod:before,.rod:after{content:"";position:absolute;top:-3px;width:16px;height:22px;border-radius:4px;
  background:linear-gradient(180deg,var(--gold-l),var(--gold-d))}
.rod:before{left:-13px} .rod:after{right:-13px}
.rod.top{top:14px} .rod.bot{animation:rodmove 1.15s cubic-bezier(.2,.8,.3,1) .25s both}
@keyframes rodmove{0%{top:26px}100%{top:calc(100% - 34px)}}
.paper{position:relative;width:314px;overflow:hidden;color:var(--ink);
  background:linear-gradient(170deg,#f7ecd2,var(--parch) 40%,var(--parch-d));
  box-shadow:0 10px 34px rgba(0,0,0,.55);border-left:1px solid #cbb383;border-right:1px solid #cbb383;
  height:0;animation:unroll 1.15s cubic-bezier(.2,.8,.3,1) .25s both}
@keyframes unroll{0%{height:0}100%{height:calc(100% - 56px)}}
.inner{padding:20px 22px;opacity:0;animation:fadein .7s ease-out 1.1s both}
@keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.kanmuri{text-align:center;font-size:11px;letter-spacing:.4em;color:#8a6a1c}
.title{text-align:center;font-size:27px;font-weight:900;letter-spacing:.1em;margin:8px 0 4px;
  color:#7d1010;text-shadow:0 1px 0 rgba(255,255,255,.6)}
.fable{text-align:center;font-size:11.5px;letter-spacing:.22em;color:#8a6a1c;margin-bottom:12px}
.divider{height:1px;background:linear-gradient(90deg,transparent,#b99a54,transparent);margin:10px 0}
.epi{font-size:13px;line-height:1.95;white-space:pre-wrap}
.wax{position:absolute;left:50%;bottom:-16px;margin-left:-24px;width:48px;height:48px;border-radius:50%;
  background:radial-gradient(circle at 34% 30%,#c33,#7d1010 70%);color:#f7e6c6;font-size:11px;
  line-height:48px;text-align:center;letter-spacing:.1em;transform:rotate(-10deg) scale(0);
  box-shadow:0 4px 10px rgba(0,0,0,.5);animation:seal .45s cubic-bezier(.2,1.4,.4,1) 1.6s both;z-index:13}
@keyframes seal{to{transform:rotate(-10deg) scale(1)}}
"""


def ending_scroll(title: str, fable: str, epilogue: str, nonce: int,
                  height: int = 430) -> str:
    return f'''<style>{PALETTE}{BASE}{SCROLL_CSS}
      .room{{height:{height - 6}px}}</style>
    <div class="room" data-n="{nonce}">
      {_room_bg()}
      <div class="wrap">
        <div class="paper">
          <div class="inner">
            <div class="kanmuri">王 国 年 代 記</div>
            <div class="title">{title}</div>
            <div class="fable">— {fable} —</div>
            <div class="divider"></div>
            <div class="epi">{epilogue}</div>
          </div>
          <div class="wax">認</div>
        </div>
      </div>
      <div class="rod top"></div><div class="rod bot"></div>
      <div class="vig"></div>
    </div>'''
