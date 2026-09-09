"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdoptBurst from "@/components/AdoptBurst";
import Beheading from "@/components/Beheading";
import Curtain from "@/components/Curtain";
import EndingStage from "@/components/EndingStage";
import ErrorBoundary from "@/components/ErrorBoundary";
import ItemModal from "@/components/ItemModal";
import Loading from "@/components/Loading";
import QueueLine from "@/components/QueueLine";
import { Menu, Typewriter, Win, type MenuItem } from "@/components/Rpg";
import { Card, Figure, Queue, Scene, WALK_IN } from "@/components/Stage";
import TitleScreen from "@/components/TitleScreen";
import { PRINCE } from "@/lib/art";
import { judge } from "@/lib/ending";
import { REASONS, SAMPLE_WISHES, pickAnim, type AnimId, type ReasonCode, type Retainer, type RetainerId } from "@/lib/retainers";
import { sfx } from "@/lib/sfx";
import { useBgm } from "@/hooks/useBgm";
import type { EndingResult, Item, Judgment, Mood, Offering, Turn } from "@/lib/types";

type Screen = "TITLE" | "WISH" | "AUDIENCE" | "BEHEAD" | "ADOPT" | "RETHINK" | "WAITING" | "ENDING";
type MenuMode = "root" | "reason" | "talk";
type Pool = { items: Item[]; currentIndex: number };

/** 楽天 API のエラーを、王子に読める言葉にする */
function explain(err: string | null): string {
  if (!err) return "誰も参上しませんでした。別の言い回しでお試しください。";
  if (/CLIENT_IP_NOT_ALLOWED/.test(err)) return "楽天 API がこの端末の IP を拒否しています（CLIENT_IP_NOT_ALLOWED）。楽天ウェブサービスの IP 登録を確認してください。";
  if (/429/.test(err)) return "楽天 API の呼び出し回数が上限に達しました。少し待ってからお試しください。";
  if (/401|403/.test(err)) return `楽天 API に拒否されました（${err}）。アプリ ID とアクセスキーを確認してください。`;
  return `献上品を探せませんでした（${err}）。`;
}

/** 交渉で上乗せされた分を反映した品 */
const priced = (o: Offering, bump: number) =>
  bump > 0 ? { ...o.item, price: o.item.price + bump } : o.item;

/** 演出ごとの効果音とタイミング（ms） */
const ANIM_SFX: Record<AnimId, { at: number; play: () => void }> = {
  fall: { at: 1600, play: sfx.thud },
  drag: { at: 900, play: sfx.thud },
  cannon: { at: 720, play: sfx.boom },
  stamp: { at: 1050, play: sfx.stamp },
};

export default function Page() {
  return <ErrorBoundary><Game /></ErrorBoundary>;
}

function Game() {
  const [screen, setScreen] = useState<Screen>("TITLE");
  const [curtain, setCurtain] = useState(false);
  const [wish, setWish] = useState("");
  const [queue, setQueue] = useState<Offering[]>([]);       // 品が届いた家臣（列の順）
  const [cast, setCast] = useState<Retainer[]>([]);           // 今回の顔ぶれ（全員）
  const [streamDone, setStreamDone] = useState(true);       // 配信が終わったか
  const [waitingFor, setWaitingFor] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [usedAnims, setUsedAnims] = useState<AnimId[]>([]);
  const [dialogue, setDialogue] = useState<Turn[]>([]);
  const [mood, setMood] = useState<Mood | undefined>();
  const [bump, setBump] = useState(0);
  const [lastAddOn, setLastAddOn] = useState("");
  const [pools, setPools] = useState<Partial<Record<RetainerId, Pool>>>({});
  const [feedback, setFeedback] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [line, setLine] = useState("");
  const [ready, setReady] = useState(false);          // 登場の演出が終わって操作できる
  const [menu, setMenu] = useState<MenuMode>("root");
  const [talkText, setTalkText] = useState("");
  const [talking, setTalking] = useState(false);
  const [inspecting, setInspecting] = useState<Offering | null>(null);
  const [pending, setPending] = useState<{ anim: AnimId; offering: Offering; label: string; note: string; variant: number } | null>(null);
  const [adopted, setAdopted] = useState<Offering | null>(null);
  const [ending, setEnding] = useState<EndingResult | null>(null);
  const [refining, setRefining] = useState(false);    // LLM の文章を待っている
  const [tremble, setTremble] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const talkRef = useRef<HTMLInputElement>(null);
  const { toggleMute: toggleBgm } = useBgm(screen === "WAITING" ? "RETHINK" : screen);   // チームメイトのチップチューン BGM

  /** BGM と効果音をまとめて切り替える */
  const toggleSound = () => { toggleBgm(); setMuted(sfx.toggle()); };

  const off = queue[cursor];

  /** 緞帳を閉じてから画面を切り替える */
  const transit = useCallback((to: Screen, after?: () => void) => {
    setCurtain(true);
    setTimeout(() => { setScreen(to); after?.(); }, 440);
    setTimeout(() => setCurtain(false), 620);
  }, []);

  const isEnter = (e: React.KeyboardEvent) =>
    e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229;

  // 家臣が入れ替わったら、歩いてくる → 一礼 → 口上、の順で見せる
  useEffect(() => {
    if (screen !== "AUDIENCE" || !off) return;
    setDialogue([]); setMood(undefined); setLine(""); setReady(false);
    setMenu("root"); setTalkText(""); setBump(0); setLastAddOn("");
    const t1 = setTimeout(() => { setLine(off.speech); }, WALK_IN * 1000 + 150);
    const t2 = setTimeout(() => setReady(true), WALK_IN * 1000 + 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [screen, cursor, off]);

  useEffect(() => { if (menu === "talk") talkRef.current?.focus(); }, [menu]);

  /* ------------------------------------------------------------ 家臣を呼ぶ */
  const summon = useCallback(async () => {
    if (!wish.trim()) return;
    setBusy(true); setError(null);
    const hoof = setInterval(() => sfx.splash(), 2400);
    let started = false;
    let streamError: string | null = null;
    try {
      const res = await fetch("/api/offerings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wish: wish.trim() }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "家臣が集まりませんでした");
      }
      setQueue([]); setCast([]); setPools({}); setStreamDone(false); setWaitingFor(null);
      setCursor(0); setJudgments([]); setUsedAnims([]); setFeedback([]); setRejected([]);
      setChanged(new Set()); setAdopted(null); setEnding(null);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let count = 0;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const lineStr = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
          if (!lineStr) continue;
          const msg = JSON.parse(lineStr);
          if (msg.type === "cast") setCast(msg.cast);
          if (msg.type === "offering") {
            count++;
            setQueue((q) => [...q, msg.offering]);
            setPools((p) => ({ ...p, [msg.offering.retainer.id]: msg.pool }));
            if (!started) {                                   // 一人目が揃ったら、もう始める
              started = true; clearInterval(hoof); setBusy(false);
              transit("AUDIENCE");
            }
          }
          if (msg.type === "done") { setStreamDone(true); if (!count) streamError = msg.error ?? null; }
        }
      }
      setStreamDone(true);
      if (!count) throw new Error(explain(streamError));
    } catch (e) {
      if (!started) setError(e instanceof Error ? e.message : "失敗しました");
      setStreamDone(true);
    } finally { clearInterval(hoof); setBusy(false); }
  }, [wish, transit]);

  /** 次の家臣へ進む。まだ届いていなければ待つ */
  const advance = useCallback((next: number, js: Judgment[], spoke: boolean) => {
    if (next < queue.length) { if (spoke) runRethinkRef.current(next); else { setCursor(next); setScreen("AUDIENCE"); } return; }
    if (streamDone || next >= cast.length) { finishRef.current(js, "ALL_BEHEADED", null); return; }
    setWaitingFor(next); setScreen("WAITING");          // 品がまだ届いていない
  }, [queue.length, streamDone, cast.length]);
  const runRethinkRef = useRef<(n: number) => void>(() => {});
  const finishRef = useRef<(js: Judgment[], o: "ADOPTED" | "ALL_BEHEADED", got: Offering | null) => void>(() => {});
  const pendingJs = useRef<Judgment[]>([]);
  const pendingSpoke = useRef(false);

  // 待っている間に届いたら進む。配信が終わっても来なければ全員斬ったことにする
  useEffect(() => {
    if (screen !== "WAITING" || waitingFor === null) return;
    if (waitingFor < queue.length) {
      const n = waitingFor; setWaitingFor(null);
      if (pendingSpoke.current) runRethinkRef.current(n); else { setCursor(n); setScreen("AUDIENCE"); }
    } else if (streamDone) {
      setWaitingFor(null); finishRef.current(pendingJs.current, "ALL_BEHEADED", null);
    }
  }, [screen, waitingFor, queue.length, streamDone]);

  /* ------------------------------------------------------------ 顛末 */
  const finish = useCallback((js: Judgment[], outcome: "ADOPTED" | "ALL_BEHEADED", got: Offering | null) => {
    // まず手元の判定で即座に顛末を出す。LLM の文章は後から差し替える
    const local = judge(js, outcome, got);
    setEnding(local); setRefining(true);
    transit("ENDING");
    fetch("/api/ending", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wish, judgments: js, outcome, adopted: got }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((gen: EndingResult | null) => {
        if (gen?.epilogue) setEnding((cur) => ({
          ...(cur ?? local), title: gen.title || local.title, epilogue: gen.epilogue,
          era: gen.era || local.era, timeline: gen.timeline?.length ? gen.timeline : local.timeline,
        }));
      })
      .catch(() => { /* 手元の顛末のまま */ })
      .finally(() => setRefining(false));
  }, [wish, transit]);
  finishRef.current = finish;

  /* ------------------------------------------------------------ 問答 */
  const speak = async () => {
    const msg = talkText.trim();
    if (!msg || !off || talking) return;
    const history = dialogue;
    setDialogue([...history, { from: "prince", text: msg }]);
    setFeedback((f) => [...f, msg]);
    setTalkText(""); setMenu("root"); setTalking(true); setLine("…………");
    try {
      const res = await fetch("/api/talk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wish, offering: off, history, message: msg }),
      });
      const data = await res.json();
      setDialogue((d) => [...d, { from: "retainer", text: data.reply, mood: data.mood }]);
      setMood(data.mood); setLine(data.reply);
      if (data.priceDelta > 0) { setBump((b) => b + data.priceDelta); setLastAddOn(data.addOn || ""); sfx.confirm(); }
    } catch {
      setLine("……（家臣は言葉を失っている）");
    } finally { setTalking(false); }
  };

  const lastPrinceWord = useMemo(
    () => [...dialogue].reverse().find((t) => t.from === "prince")?.text ?? "", [dialogue]);

  /* ------------------------------------------------------------ 見直し */
  const runRethink = useCallback(async (nextIndex: number) => {
    const nextId = queue[nextIndex]?.retainer.id;
    const pool = nextId ? pools[nextId] : undefined;
    if (!nextId || !pool || nextId === "chancellor") { setCursor(nextIndex); setScreen("AUDIENCE"); return; }
    setScreen("RETHINK");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    try {
      const res = await fetch("/api/rethink", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wish, feedback, rejected, pools: { [nextId]: pool } }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      const changes: { retainerId: RetainerId; item: Item; speech: string; changed: boolean }[] = data.changes ?? [];
      if (changes.length) {
        setQueue((q) => q.map((o, idx) => {
          if (idx < nextIndex) return o;
          const ch = changes.find((c) => c.retainerId === o.retainer.id);
          return ch ? { ...o, item: ch.item, speech: ch.speech } : o;
        }));
        setChanged(new Set(changes.filter((c) => c.changed).map((c) => c.retainerId)));
      }
    } catch { /* 元の品のまま */ }
    clearTimeout(timer);
    setCursor(nextIndex); setScreen("AUDIENCE");
  }, [queue, pools, wish, feedback, rejected]);
  runRethinkRef.current = runRethink;

  /* ------------------------------------------------------------ 判決 */
  const behead = (code: ReasonCode) => {
    const label = REASONS.find((r) => r.code === code)!.label;
    const note = lastPrinceWord;
    const anim = pickAnim(code, cursor + 1, usedAnims);
    const item = priced(off, bump);
    const js = [...judgments, {
      retainer: off.retainer, item, verdict: "BEHEAD" as const,
      reasonCode: code, reasonLabel: label, reasonText: note || undefined, dialogue, anim,
    }];
    setJudgments(js); setUsedAnims([...usedAnims, anim]);
    setRejected((r) => [...r, `${item.displayName}（${off.retainer.name} / ${item.price.toLocaleString()}円）`]);
    setPending({ anim, offering: { ...off, item }, label, note, variant: cursor });
    setScreen("BEHEAD"); setTremble(true);
    sfx.slash();
    setTimeout(() => ANIM_SFX[anim].play(), ANIM_SFX[anim].at);
    setTimeout(() => setTremble(false), 900);
    const spoke = dialogue.some((t) => t.from === "prince");
    pendingJs.current = js; pendingSpoke.current = spoke;
    setTimeout(() => { setPending(null); advance(cursor + 1, js, spoke); }, 2700);
  };

  const adopt = () => {
    const item = priced(off, bump);
    const got = { ...off, item };
    const js = [...judgments, {
      retainer: off.retainer, item, verdict: "ADOPT" as const,
      reasonCode: "silent" as ReasonCode, reasonLabel: "採用", reasonText: lastPrinceWord || undefined,
      dialogue, anim: null,
    }];
    setJudgments(js); setAdopted(got); setScreen("ADOPT");
    sfx.fanfare();
    setTimeout(() => finish(js, "ADOPTED", got), 2600);
  };

  const reset = (to: Screen) => {
    transit(to, () => {
      setWish(""); setQueue([]); setCursor(0); setJudgments([]); setUsedAnims([]);
      setAdopted(null); setEnding(null); setDialogue([]); setPools({});
      setFeedback([]); setRejected([]); setChanged(new Set()); setRefining(false);
      setCast([]); setStreamDone(true); setWaitingFor(null);
    });
  };

  const rootItems: MenuItem[] = [
    { key: "talk", label: "はなす", hint: "問いただす", disabled: talking || !ready },
    { key: "look", label: "けんぶん", hint: "品を検める", disabled: !ready },
    { key: "behead", label: "うちくび", hint: "斬り捨てる", disabled: !ready },
    { key: "adopt", label: "さいよう", hint: "受け取る", disabled: !ready },
  ];
  const reasonItems: MenuItem[] = [
    ...REASONS.map((r) => ({ key: r.code, label: r.label })),
    { key: "back", label: "もどる" },
  ];
  const onRoot = (k: string) => {
    if (k === "talk") setMenu("talk");
    if (k === "look") setInspecting(off);
    if (k === "behead") setMenu("reason");
    if (k === "adopt") adopt();
  };
  const onReason = (k: string) => { if (k === "back") { sfx.cancel(); setMenu("root"); } else behead(k as ReasonCode); };

  const inHall = screen === "AUDIENCE" || screen === "BEHEAD" || screen === "ADOPT" || screen === "RETHINK" || screen === "WAITING";
  const arrived = new Set(queue.map((o) => o.retainer.id));
  const waiting = inHall ? cast.slice(cursor + 1).map((r) => ({ retainer: r, pending: !arrived.has(r.id) })) : [];
  const dim = screen === "BEHEAD" || screen === "ENDING";

  return (
    <main className="shell">
      {/* -------------------------------------------------- 背景（全画面） */}
      <Scene dim={dim}>
        {inHall && <QueueLine waiting={waiting} offset={cursor + 1} tremble={tremble} />}
        <AnimatePresence mode="wait">
          {screen === "AUDIENCE" && off && (
            <motion.div key={`stage-${cursor}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .15 } }}>
              <Queue total={cast.length || queue.length} cursor={cursor} />
              <Figure offering={off} mood={mood} variant={cursor} />
              <Card offering={off} onOpen={() => setInspecting(off)} bump={bump}
                swapped={changed.has(off.retainer.id)} delay={WALK_IN + .05} />
            </motion.div>
          )}
          {screen === "BEHEAD" && pending && (
            <motion.div key="fx-behead">
              <Beheading anim={pending.anim} offering={pending.offering}
                reasonLabel={pending.label} reasonText={pending.note} variant={pending.variant} />
            </motion.div>
          )}
          {screen === "ADOPT" && adopted && (
            <motion.div key="fx-adopt"><AdoptBurst offering={adopted} /></motion.div>
          )}
        </AnimatePresence>
      </Scene>

      {/* -------------------------------------------------- UI */}
      <div className="ui">
        <button className="mute" onClick={toggleSound} aria-label="音">
          {muted ? "🔇" : "🔊"}
        </button>

        <AnimatePresence mode="wait">
          {screen === "TITLE" && (
            <motion.div className="center" key="ui-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TitleScreen onStart={() => transit("WISH")} />
            </motion.div>
          )}

          {screen === "WISH" && (
            <motion.div className="center" key="ui-wish" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="panel" style={{ width: busy ? "auto" : "min(640px,100%)" }}>
                {busy && <Loading mode="kraken" />}
                {!busy && (
                  <div className="wish-row">
                    <div className="wish-prince"><Image src={PRINCE} alt="" sizes="220px" priority /></div>
                    <div className="wish-col">
                      <Win speaker="王 子">
                        <p style={{ margin: "0 0 12px" }}><Typewriter text="さて、何を申しつけようか。" speed={28} /></p>
                        <input className="rpg-input" value={wish} autoFocus
                          placeholder="でっかい城が欲しいのじゃ"
                          onChange={(e) => setWish(e.target.value)}
                          onKeyDown={(e) => { if (isEnter(e)) summon(); }} />
                        {error && <p style={{ color: "#ff9a8a", fontSize: ".85rem", margin: "10px 0 0" }}>{error}</p>}
                      </Win>
                      <div style={{ height: 10 }} />
                      <Win className="cmdwin">
                        <Menu columns={3} items={[
                          { key: "go", label: "よびだす", disabled: !wish.trim() },
                          { key: "gacha", label: "おだいガチャ" },
                          { key: "back", label: "もどる" },
                        ]} onPick={(k) => {
                          if (k === "go") summon();
                          if (k === "gacha") setWish(SAMPLE_WISHES[Math.floor(Math.random() * SAMPLE_WISHES.length)]);
                          if (k === "back") reset("TITLE");
                        }} />
                      </Win>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {screen === "AUDIENCE" && off && (
            <motion.div key="ui-aud" style={{ display: "contents" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="topbar">
                <div className="t">謁 見 の 間</div>
                <div className="s">「{wish}」　／　{cursor + 1} 人目　のこり {Math.max(0, (cast.length || queue.length) - cursor - 1)} 人</div>
              </div>
              <div className="rpg-bottom">
                <div className="talkwin">
                  <Win speaker={menu === "talk" ? "王 子" : off.retainer.name} tone={menu === "talk" ? "#f6e3a1" : off.retainer.color}>
                    {menu === "talk" ? (
                      <div className="talk-row">
                        <div className="hud-prince"><Image src={PRINCE} alt="" sizes="120px" /></div>
                        <div style={{ flex: 1 }}>
                          <input ref={talkRef} className="rpg-input" value={talkText} maxLength={60}
                            placeholder="王子の言葉を述べよ（例: 城と申したのに、なぜ菓子なのじゃ）"
                            onChange={(e) => setTalkText(e.target.value)}
                            onKeyDown={(e) => {
                              if (isEnter(e)) speak();
                              if (e.key === "Escape") { e.preventDefault(); sfx.cancel(); setMenu("root"); }
                            }} />
                          <div style={{ height: 8 }} />
                          <Menu columns={2} hint={false} items={[
                            { key: "send", label: "もうす", disabled: !talkText.trim() || talking },
                            { key: "cancel", label: "やめる" },
                          ]} onPick={(k) => (k === "send" ? speak() : (sfx.cancel(), setMenu("root")))} />
                        </div>
                      </div>
                    ) : (
                      line ? <Typewriter text={line} /> : <span className="cursor-wait">…………</span>
                    )}
                  </Win>
                </div>
                {menu !== "talk" && (
                  <div className="rpg-cmd">
                    <Win>
                      <div className="status">
                        <span>献上　<b>{off.item.displayName}</b></span>
                        <span>値　<b>{(off.item.price + bump).toLocaleString()}円</b>
                          {bump > 0 && <em className="up">＋{bump.toLocaleString()}</em>}</span>
                        {lastAddOn && <span className="addon">おまけ：{lastAddOn}</span>}
                        {dialogue.length > 0 && <span className="addon">問答 {dialogue.filter((t) => t.from === "prince").length} 回</span>}
                      </div>
                    </Win>
                    <Win className="cmdwin">
                      {menu === "root" ? <Menu items={rootItems} onPick={onRoot} /> : <Menu items={reasonItems} onPick={onReason} />}
                    </Win>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {screen === "WAITING" && (
            <motion.div className="center" key="ui-waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loading mode="kraken" label="次の者の船が港に入っております……" />
            </motion.div>
          )}

          {screen === "RETHINK" && (
            <motion.div className="center" key="ui-rethink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loading mode="kraken" label="次の者が慌てて積荷を見直しております……" />
            </motion.div>
          )}

          {screen === "ENDING" && ending && (
            <motion.div key="ui-end" className="end-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EndingStage res={ending} adopted={adopted} judgments={judgments} wish={wish}
                refining={refining} onAgain={() => reset("WISH")} onTitle={() => reset("TITLE")}
                onInspect={setInspecting} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Curtain active={curtain} />
      <ItemModal offering={inspecting} onClose={() => setInspecting(null)} />
    </main>
  );
}
