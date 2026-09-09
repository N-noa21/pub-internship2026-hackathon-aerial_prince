CSS = """
<style>
:root{ --gold:#d9b544; --gold-d:#8a6a1c; --gold-l:#f6e3a1;
       --crimson:#8f1b1b; --parch:#f3e7ca; --ink:#2c1c12; }
.stApp{ background:
  radial-gradient(ellipse 90% 55% at 50% -8%, rgba(255,190,90,.13), transparent 62%),
  radial-gradient(ellipse 120% 80% at 50% 110%, rgba(120,20,20,.5), transparent 60%),
  linear-gradient(#1b0a0b 0%, #2a0f10 45%, #1b0a0b 100%); }
.block-container{ max-width:760px; padding-top:1.6rem; padding-bottom:3rem; }
header[data-testid="stHeader"]{ background:transparent; }
h1,h2,h3,p,label,li,div[data-testid="stMarkdownContainer"]{
  color:#f0e0bd !important;
  font-family:"Hiragino Mincho ProN","Yu Mincho",YuMincho,serif; }

/* 見出し */
.hd{ text-align:center; margin:2px 0 14px; }
.hd .t{ font-size:1.65rem; font-weight:900; letter-spacing:.16em; color:var(--gold) !important;
  text-shadow:0 2px 0 #4a0d0d, 0 0 24px rgba(217,181,68,.3); }
.hd .s{ font-size:.8rem; letter-spacing:.3em; color:#d9c49a !important; margin-top:4px; }
.rule{ height:2px; margin:12px 0 18px;
  background:linear-gradient(90deg,transparent,var(--gold),transparent); }
.rule.thin{ opacity:.5; margin:10px 0; }

/* 入力 */
div[data-testid="stTextInput"] input{
  background:linear-gradient(160deg,#f7ecd2,var(--parch)); color:var(--ink) !important;
  border:2px solid var(--gold-d); border-radius:6px; font-size:1.05rem; padding:.7em .9em;
  font-family:"Hiragino Mincho ProN",serif; }
div[data-testid="stTextInput"] input::placeholder{ color:#a08b5f; }

/* ボタン */
div.stButton>button{ width:100%; border-radius:8px; padding:.7em 0;
  border:2px solid var(--gold-d); letter-spacing:.18em; font-weight:800;
  background:linear-gradient(180deg,#4a1516,#2e0e0f); color:#f0e0bd;
  font-family:"Hiragino Mincho ProN",serif; transition:all .16s ease; }
div.stButton>button:hover{ background:linear-gradient(180deg,#8f1b1b,#5c0f0f);
  border-color:var(--gold); color:#fff8e6; transform:translateY(-1px);
  box-shadow:0 6px 18px rgba(143,27,27,.5); }
div.stButton>button[kind="primary"]{
  background:linear-gradient(180deg,var(--gold-l),var(--gold) 45%,var(--gold-d));
  color:#2a1a08; border-color:var(--gold-l); }
div.stButton>button[kind="primary"]:hover{ filter:brightness(1.12); color:#1c1105; }

/* 判決理由のラジオ */
div[role="radiogroup"]{ gap:.35rem .5rem; justify-content:center; }
div[role="radiogroup"] label{ background:#2e0e0f; border:1px solid var(--gold-d);
  border-radius:999px; padding:.25em .85em; margin:0 !important; }
div[role="radiogroup"] label:hover{ border-color:var(--gold); background:#431415; }

/* スコア */
.sc{ display:flex; gap:10px; align-items:center; margin:.35em 0; }
.sc .k{ width:5.4em; font-size:.84rem; letter-spacing:.08em; }
.sc .bar{ flex:1; height:14px; border-radius:7px; background:#2e0e0f;
  border:1px solid var(--gold-d); overflow:hidden; }
.sc .bar i{ display:block; height:100%; border-radius:6px;
  background:linear-gradient(90deg,var(--crimson),var(--gold));
  box-shadow:0 0 12px rgba(217,181,68,.45); animation:grow .9s cubic-bezier(.2,.8,.3,1) both; }
@keyframes grow{ from{ width:0 !important } }
.sc .v{ width:2.6em; text-align:right; font-size:.84rem; color:var(--gold) !important; }

/* 戦利品 */
.loot{ display:flex; gap:14px; align-items:center; padding:12px 14px; border-radius:8px;
  background:linear-gradient(160deg,#f7ecd2,var(--parch)); border:2px solid var(--gold-d);
  box-shadow:0 8px 24px rgba(0,0,0,.45); }
.loot *{ color:var(--ink) !important; }
.loot img{ width:78px; height:78px; object-fit:contain; background:#fffaf0;
  border:1px solid var(--gold-d); border-radius:4px; }
.loot .n{ font-size:.86rem; line-height:1.5; }
.loot .p{ font-size:1.3rem; font-weight:900; color:var(--crimson) !important;
  font-family:"Yu Gothic",sans-serif; }
.hint{ text-align:center; font-size:.76rem; color:#b9a583 !important; letter-spacing:.1em; }
</style>
"""
