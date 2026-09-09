"use client";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdoptBurst from "@/components/AdoptBurst";
import Beheading from "@/components/Beheading";
import EndingScroll from "@/components/EndingScroll";
import ItemModal from "@/components/ItemModal";
import { Menu, Typewriter, Win, type MenuItem } from "@/components/Rpg";
import { Card, Figure, Queue, Scene } from "@/components/Stage";
import TitleScreen from "@/components/TitleScreen";
import { REASONS, SAMPLE_WISHES, pickAnim, type AnimId, type ReasonCode } from "@/lib/retainers";
import type { EndingResult, Judgment, Mood, Offering, Turn } from "@/lib/types";

type Screen = "TITLE" | "WISH" | "AUDIENCE" | "BEHEAD" | "ADOPT" | "ENDING";
type MenuMode = "root" | "reason" | "talk";

const PHASES = ["触れを出しております……", "家臣が市を巡っております……", "口上を練っております……"];

export default function Page() {
  const [screen, setScreen] = useState<Screen>("TITLE");
  const [wish, setWish] = useState("");
  const [queue, setQueue] = useState<Offering[]>([]);
  const [cursor, setCursor] = useState(0);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [usedAnims, setUsedAnims] = useState<AnimId[]>([]);
  const [dialogue, setDialogue] = useState<Turn[]>([]);
  const [mood, setMood] = useState<Mood | undefined>();
  const [line, setLine] = useState("");
  const [menu, setMenu] = useState<MenuMode>("root");
  const [talkText, setTalkText] = useState("");
  const [talking, setTalking] = useState(false);
  const [inspecting, setInspecting] = useState<Offering | null>(null);
  const [pending, setPending] = useState<{ anim: AnimId; offering: Offering; label: string; note: string } | null>(null);
  const [adopted, setAdopted] = useState<Offering | null>(null);
  const [ending, setEnding] = useState<EndingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const talkRef = useRef<HTMLInputElement>(null);

  /** IME 変換中の Enter（変換確定）で送信しないための判定 */
  const isEnter = (e: React.KeyboardEvent) =>
    e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229;

  const off = queue[cursor];

  useEffect(() => {
    if (!busy) return;
    setPhase(0);
    const t = [setTimeout(() => setPhase(1), 4200), setTimeout(() => setPhase(2), 9000)];
    return () => t.forEach(clearTimeout);
  }, [busy]);

  // 家臣が入れ替わったら会話をリセットして口上を出す
  useEffect(() => {
    if (screen === "AUDIENCE" && off) {
      setDialogue([]); setMood(undefined); setLine(off.speech);
      setMenu("root"); setTalkText("");
    }
  }, [screen, cursor, off]);

  useEffect(() => { if (menu === "talk") talkRef.current?.focus(); }, [menu]);

  const summon = useCallback(async () => {
    if (!wish.trim()) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/offerings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wish: wish.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "家臣が集まりませんでした");
      if (!data.offerings?.length) throw new Error("誰も参上しませんでした。別の言い回しでお試しください。");
      setQueue(data.offerings); setCursor(0); setJudgments([]); setUsedAnims([]);
      setAdopted(null); setEnding(null);
      setScreen("AUDIENCE");
    } catch (e) {
      setError(e instanceof Error ? e.message : "失敗しました");
    } finally { setBusy(false); }
  }, [wish]);

  const finish = useCallback(async (js: Judgment[], outcome: "ADOPTED" | "ALL_BEHEADED", got: Offering | null) => {
    setScreen("ENDING"); setEnding(null);
    try {
      const res = await fetch("/api/ending", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wish, judgments: js, outcome, adopted: got }),
      });
      setEnding(await res.json());
    } catch {
      setEnding({ title: "記録は失われた", fable: "—", epilogue: "年代記は焼失した。", scores: {} });
    }
  }, [wish]);

  /** 家臣に話しかける */
  const speak = async () => {
    const msg = talkText.trim();
    if (!msg || !off || talking) return;
    const history = dialogue;
    setDialogue([...history, { from: "prince", text: msg }]);
    setTalkText(""); setMenu("root"); setTalking(true); setLine("…………");
    try {
      const res = await fetch("/api/talk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wish, offering: off, history, message: msg }),
      });
      const data = await res.json();
      setDialogue((d) => [...d, { from: "retainer", text: data.reply, mood: data.mood }]);
      setMood(data.mood); setLine(data.reply);
    } catch {
      setLine("……（家臣は言葉を失っている）");
    } finally { setTalking(false); }
  };

  const lastPrinceWord = useMemo(
    () => [...dialogue].reverse().find((t) => t.from === "prince")?.text ?? "",
    [dialogue]);

  const behead = (code: ReasonCode) => {
    const label = REASONS.find((r) => r.code === code)!.label;
    const note = lastPrinceWord;
    const anim = pickAnim(code, cursor + 1, usedAnims);
    const js = [...judgments, {
      retainer: off.retainer, item: off.item, verdict: "BEHEAD" as const,
      reasonCode: code, reasonLabel: label, reasonText: note || undefined,
      dialogue, anim,
    }];
    setJudgments(js); setUsedAnims([...usedAnims, anim]);
    setPending({ anim, offering: off, label, note });
    setScreen("BEHEAD");
    setTimeout(() => {
      setPending(null);
      const next = cursor + 1;
      if (next >= queue.length) finish(js, "ALL_BEHEADED", null);
      else { setCursor(next); setScreen("AUDIENCE"); }
    }, 2700);
  };

  const adopt = () => {
    const js = [...judgments, {
      retainer: off.retainer, item: off.item, verdict: "ADOPT" as const,
      reasonCode: "silent" as ReasonCode, reasonLabel: "採用", reasonText: lastPrinceWord || undefined,
      dialogue, anim: null,
    }];
    setJudgments(js); setAdopted(off); setScreen("ADOPT");
    setTimeout(() => finish(js, "ADOPTED", off), 2600);
  };

  const reset = (to: Screen) => {
    setWish(""); setQueue([]); setCursor(0); setJudgments([]); setUsedAnims([]);
    setAdopted(null); setEnding(null); setDialogue([]); setScreen(to);
  };

  const rootItems: MenuItem[] = [
    { key: "talk", label: "はなす", hint: "問いただす", disabled: talking },
    { key: "look", label: "けんぶん", hint: "品を検める" },
    { key: "behead", label: "うちくび", hint: "斬り捨てる" },
    { key: "adopt", label: "さいよう", hint: "受け取る" },
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
  const onReason = (k: string) => (k === "back" ? setMenu("root") : behead(k as ReasonCode));

  const dim = screen === "BEHEAD" || screen === "ENDING";

  return (
    <main className="shell">
      {/* -------------------------------------------------- 背景（全画面） */}
      <Scene dim={dim}>
        <AnimatePresence mode="wait">
          {screen === "AUDIENCE" && off && (
            <motion.div key={`stage-${cursor}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Queue total={queue.length} cursor={cursor} />
              <Figure offering={off} mood={mood} />
              <Card offering={off} onOpen={() => setInspecting(off)} />
            </motion.div>
          )}
          {screen === "BEHEAD" && pending && (
            <motion.div key="fx-behead">
              <Beheading anim={pending.anim} offering={pending.offering}
                reasonLabel={pending.label} reasonText={pending.note} />
            </motion.div>
          )}
          {screen === "ADOPT" && adopted && (
            <motion.div key="fx-adopt"><AdoptBurst offering={adopted} /></motion.div>
          )}
          {screen === "ENDING" && ending && (
            <motion.div key="fx-ending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EndingScroll res={ending} />
            </motion.div>
          )}
        </AnimatePresence>
      </Scene>

      {/* -------------------------------------------------- UI */}
      <div className="ui">
        <AnimatePresence mode="wait">
          {/* ---------------------------------------- タイトル */}
          {screen === "TITLE" && (
            <motion.div className="center" key="ui-title"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="panel">
                <TitleScreen />
                <div style={{ height: 26 }} />
                <Win className="cmdwin" >
                  <Menu items={[{ key: "start", label: "はじめる", hint: "▶ Enter" }]} onPick={() => setScreen("WISH")} />
                </Win>
              </div>
            </motion.div>
          )}

          {/* ---------------------------------------- わがまま入力 */}
          {screen === "WISH" && (
            <motion.div className="center" key="ui-wish"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="panel" style={{ width: "min(560px,100%)" }}>
                <Win speaker="王 子">
                  <p style={{ margin: "0 0 12px" }}>
                    {busy ? <Typewriter text={PHASES[phase]} /> : "さて、何を申しつけようか。"}
                  </p>
                  <input className="rpg-input" value={wish} disabled={busy} autoFocus
                    placeholder="でっかい城が欲しいのじゃ"
                    onChange={(e) => setWish(e.target.value)}
                    onKeyDown={(e) => { if (isEnter(e)) summon(); }} />
                  {error && <p style={{ color: "#ff9a8a", fontSize: ".85rem", margin: "10px 0 0" }}>{error}</p>}
                </Win>
                <div style={{ height: 10 }} />
                <Win className="cmdwin">
                  <Menu columns={3} items={[
                    { key: "go", label: "よびだす", disabled: busy || !wish.trim() },
                    { key: "gacha", label: "おだいガチャ", disabled: busy },
                    { key: "back", label: "もどる", disabled: busy },
                  ]} onPick={(k) => {
                    if (k === "go") summon();
                    if (k === "gacha") setWish(SAMPLE_WISHES[Math.floor(Math.random() * SAMPLE_WISHES.length)]);
                    if (k === "back") reset("TITLE");
                  }} />
                </Win>
              </div>
            </motion.div>
          )}

          {/* ---------------------------------------- 謁見 */}
          {screen === "AUDIENCE" && off && (
            <motion.div key="ui-aud" style={{ display: "contents" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="topbar">
                <div className="t">謁 見 の 間</div>
                <div className="s">「{wish}」　／　のこり {queue.length - cursor} 人</div>
              </div>

              <div className="rpg-bottom">
                <div className="talkwin">
                  <Win speaker={off.retainer.name} tone={off.retainer.color}>
                    <Typewriter text={line} />
                  </Win>
                </div>

                <div className="rpg-cmd">
                  <Win>
                    {menu === "talk" ? (
                      <>
                        <input ref={talkRef} className="rpg-input" value={talkText} maxLength={60}
                          placeholder="王子の言葉を述べよ（例: 城と申したのに、なぜ菓子なのじゃ）"
                          onChange={(e) => setTalkText(e.target.value)}
                          onKeyDown={(e) => {
                            if (isEnter(e)) speak();
                            if (e.key === "Escape") { e.preventDefault(); setMenu("root"); }
                          }} />
                        <div style={{ height: 8 }} />
                        <Menu columns={2} items={[
                          { key: "send", label: "もうす", disabled: !talkText.trim() || talking },
                          { key: "cancel", label: "やめる" },
                        ]} onPick={(k) => (k === "send" ? speak() : setMenu("root"))} />
                      </>
                    ) : (
                      <div className="status">
                        <span>献上　<b>{off.item.displayName}</b></span>
                        <span>値　<b>{off.item.price.toLocaleString()}円</b></span>
                      </div>
                    )}
                  </Win>
                  {menu !== "talk" && (
                    <Win className="cmdwin">
                      {menu === "root"
                        ? <Menu items={rootItems} onPick={onRoot} />
                        : <Menu items={reasonItems} onPick={onReason} />}
                    </Win>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------------------------------- エンディング */}
          {screen === "ENDING" && (
            <motion.div key="ui-end" style={{ display: "contents" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="topbar">
                <div className="t">顛 末</div>
                <div className="s">「{wish}」</div>
              </div>
              {!ending && <div className="center"><p className="hint waiting">⌛ 年代記を編んでおります……</p></div>}
              {ending && (
                <motion.div className="rpg-bottom" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 2.1, duration: .6 }}>
                  <div className="talkwin">
                    <Win speaker="戦 利 品">
                      <div className="endrow">
                        {adopted ? (
                          <button className="lootbtn" onClick={() => setInspecting(adopted)}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={adopted.item.image} alt="" />
                            <span>
                              <b>{adopted.item.displayName}</b>
                              <i>{adopted.item.price.toLocaleString()} 円</i>
                            </span>
                          </button>
                        ) : <span className="none">なし。すべて斬り捨てた。</span>}
                        <div className="scores">
                          {Object.entries(ending.scores).map(([k, v], i) => (
                            <div className="sc" key={k}>
                              <div className="k">{k}</div>
                              <div className="bar">
                                <motion.i initial={{ width: 0 }} animate={{ width: `${v}%` }}
                                  transition={{ duration: .9, delay: 2.4 + i * .1 }} />
                              </div>
                              <div className="v">{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Win>
                  </div>
                  <div className="rpg-cmd" style={{ gridTemplateColumns: "1fr" }}>
                    <Win className="cmdwin">
                      <Menu columns={2} items={[
                        { key: "again", label: "もういちど" },
                        { key: "title", label: "タイトルへ" },
                      ]} onPick={(k) => reset(k === "again" ? "WISH" : "TITLE")} />
                    </Win>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ItemModal offering={inspecting} onClose={() => setInspecting(null)} />
    </main>
  );
}
