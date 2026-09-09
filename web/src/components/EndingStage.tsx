"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { sfx } from "@/lib/sfx";
import { kanjiYear, paragraphs } from "@/lib/chronicle";
import { pack, type Shared } from "@/lib/share";
import ShareDialog from "./ShareDialog";
import type { EndingResult, Judgment, Offering } from "@/lib/types";
import Scribing from "./Scribing";
import { Portrait } from "./Stage";
import { Menu, Typewriter, Win } from "./Rpg";

/**
 * 顛末。読みやすさ優先で「左＝巻物（称号と後日談）／右＝結果（戦利品・評定・家臣）」の二段組み。
 *  0.3s 称号 → 1.4s 巻物 → 2.6s 右の結果 → 3.0s メニュー
 * readOnly のときは共有された結果の閲覧用（メニューは「自分もやる」だけ）。
 */
export default function EndingStage({ res, adopted, judgments, wish, refining, onAgain, onTitle, onInspect, readOnly = false }: {
  res: EndingResult; adopted: Offering | null; judgments: Judgment[]; wish: string;
  refining: boolean; onAgain: () => void; onTitle: () => void;
  onInspect?: (o: Offering) => void; readOnly?: boolean;
}) {
  const [step, setStep] = useState(readOnly ? 4 : 0);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (readOnly) return;
    const t = [
      setTimeout(() => { setStep(1); sfx.reveal(); }, 300),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2600),
      setTimeout(() => setStep(4), 3000),
    ];
    return () => t.forEach(clearTimeout);
  }, [readOnly]);

  const beheaded = judgments.filter((j) => j.verdict === "BEHEAD").length;
  const shared: Shared = pack(res, adopted, judgments, wish);


  const rootItems = readOnly
    ? [{ key: "again", label: "じぶんもやる" }]
    : [
      { key: "share", label: "きょうゆう", hint: "画像・URL・文章" },
      { key: "again", label: "もういちど" },
      { key: "title", label: "タイトルへ" },
    ];
  const onPick = (k: string) => {
    if (k === "share") setShareOpen(true);
    if (k === "again") onAgain();
    if (k === "title") onTitle();
  };

  return (
    <div className="end-wrap">
      {/* ------------------------------------------------ 称号 */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.div className="end-title" key={res.title}
            initial={{ scale: 2.4, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: [2.4, .97, 1.03, 1], opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: .7, times: [0, .6, .8, 1], ease: [.2, .9, .3, 1] }}>
            <div className="end-kicker">「{wish}」と申した王子は</div>
            <div className="end-name">{res.title}</div>
            <div className="end-fable">— {res.fable} —</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------ 王国年代記（主役） */}
      {step >= 2 && (
        <motion.div className="end-scroll" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
          <div className="rod top" />
          <motion.div className="paper" initial={{ height: 0 }} animate={{ height: "auto" }} transition={{ duration: .9, ease: [.2, .8, .3, 1] }}>
            <div className="inner">
              <div className="chronicle">
                <span className="orn">❖</span>
                <h2>王 国 年 代 記</h2>
                <span className="orn">❖</span>
              </div>
              <div className="chronicle-sub">第 一 巻 ・ わがまま王子の顛末</div>
              <div className="divider" />
              {refining
                ? <Scribing />
                : <>
                    <div className="epi">
                      {readOnly ? paragraphs(res.epilogue) : <Typewriter key={res.epilogue} text={paragraphs(res.epilogue)} speed={20} />}
                    </div>
                    {res.timeline?.length ? (
                      <motion.div className="chronology" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: readOnly ? 0 : Math.min(6, res.epilogue.length * .02) + .3, duration: .6 }}>
                        <div className="chronology-head">{res.era ?? ""} 年 表</div>
                        <table>
                          <tbody>
                            {res.timeline.map((t, i) => (
                              <tr key={i} className={i === res.timeline!.length - 1 ? "last" : ""}>
                                <th>{res.era ?? ""}{kanjiYear(t.year)}</th>
                                <td>{t.event}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </motion.div>
                    ) : null}
                  </>}
            </div>
            <div className="wax">認</div>
          </motion.div>
          <div className="rod bot" />
        </motion.div>
      )}

      {/* ------------------------------------------------ その下: 戦利品・評定 */}
      {step >= 3 && (
        <motion.div className="end-below" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .5, ease: [.2, .8, .3, 1] }}>
          <div className="end-grid">
            <Win speaker="戦 利 品">
              {adopted ? (
                <div className="end-loot" role={onInspect ? "button" : undefined} onClick={() => onInspect?.(adopted)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={adopted.item.image} alt="" />
                  <div>
                    <b>{adopted.item.displayName}</b>
                    <i>{adopted.item.price.toLocaleString()} 円</i>
                    <small>{adopted.retainer.name}より献上</small>
                    {adopted.speech && <em>「{adopted.speech}」</em>}
                    <p className="end-desc">{adopted.item.name}</p>
                  </div>
                </div>
              ) : <p className="end-none">なし。{beheaded} 人を斬り、何も手にせず。</p>}
            </Win>

            <Win speaker="評 定">
              <div className="end-scores">
                {Object.entries(res.scores).map(([k, v], i) => (
                  <div className="sc" key={k}>
                    <div className="k">{k}</div>
                    <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: .8, delay: .15 + i * .1 }} /></div>
                    <div className="v">{v}</div>
                  </div>
                ))}
              </div>
            </Win>
          </div>

          <Win speaker="献 上 品 一 覧">
            <ul className="end-cast">
              {judgments.map((j, i) => (
                <motion.li key={j.retainer.id + i} className={`end-cast-row ${j.verdict.toLowerCase()}`}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .25 + i * .1 }}
                  role={onInspect ? "button" : undefined}
                  onClick={() => onInspect?.({ retainer: j.retainer, item: j.item, speech: "", query: "" })}>
                  <div className="end-cast-body"><Portrait retainer={j.retainer} variant={i} /></div>
                  {j.item.image
                    ? /* eslint-disable-next-line @next/next/no-img-element */
                      <img className="end-cast-thumb" src={j.item.image} alt="" />
                    : <div className="end-cast-thumb" />}
                  <div className="end-cast-text">
                    <b>{j.item.displayName}</b>
                    <span>{j.retainer.name}　{j.item.price.toLocaleString()} 円</span>
                  </div>
                  <span className="end-cast-mark">{j.verdict === "ADOPT" ? "👑 採用" : "🗡 打ち首"}</span>
                </motion.li>
              ))}
            </ul>
            {onInspect && <p className="end-hint">▸ 品を押すと検分できます</p>}
          </Win>
        </motion.div>
      )}

      {/* ------------------------------------------------ メニュー */}
      {step >= 4 && (
        <motion.div className="end-menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Win className="cmdwin">
            <Menu columns={readOnly ? 1 : 3} items={rootItems} onPick={onPick} />
          </Win>
          <ShareDialog data={shared} open={shareOpen} onClose={() => setShareOpen(false)} />
        </motion.div>
      )}
    </div>
  );
}
