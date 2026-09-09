"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { PRINCE } from "@/lib/art";
import { sfx } from "@/lib/sfx";
import type { EndingResult, Judgment, Offering } from "@/lib/types";
import { Portrait } from "./Stage";
import { Menu, Typewriter, Win } from "./Rpg";

/**
 * 顛末。段階的に見せる:
 *  0.3s 称号がドンと出る → 1.8s 巻物が開く → 3.4s 戦利品・評価・家臣の生死 → 3.8s メニュー
 * LLM の文章が遅れて届いたら、その場で差し替わる。
 */
export default function EndingStage({ res, adopted, judgments, wish, refining, onAgain, onTitle }: {
  res: EndingResult; adopted: Offering | null; judgments: Judgment[]; wish: string;
  refining: boolean; onAgain: () => void; onTitle: () => void;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => { setStep(1); sfx.reveal(); }, 300),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => setStep(3), 3400),
      setTimeout(() => setStep(4), 3800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const beheaded = judgments.filter((j) => j.verdict === "BEHEAD").length;

  return (
    <>
      {/* 称号 */}
      <AnimatePresence>
        {step >= 1 && (
          <motion.div className="end-title" key={res.title}
            initial={{ scale: 3, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: [3, .96, 1.04, 1], opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: .7, times: [0, .6, .8, 1], ease: [.2, .9, .3, 1] }}>
            <div className="end-kicker">王子に与えられし称号</div>
            <div className="end-name">{res.title}</div>
            <div className="end-fable">— {res.fable} —</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 巻物 */}
      {step >= 2 && (
        <motion.div className="end-scroll" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .6 }}>
          <div className="rod top" />
          <motion.div className="paper" initial={{ height: 0 }} animate={{ height: "auto" }}
            transition={{ duration: 1, ease: [.2, .8, .3, 1] }}>
            <div className="inner">
              <div className="kanmuri">王 国 年 代 記</div>
              <div className="divider" />
              <div className="epi"><Typewriter key={res.epilogue} text={res.epilogue} speed={22} /></div>
              {refining && <div className="refining">…筆を走らせております…</div>}
            </div>
            <div className="wax">認</div>
          </motion.div>
          <div className="rod bot" />
        </motion.div>
      )}

      {/* 戦利品・評価・家臣 */}
      {step >= 3 && (
        <motion.div className="end-panel" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ duration: .55, ease: [.2, .8, .3, 1] }}>
          <Win speaker="戦 利 品">
            {adopted ? (
              <div className="end-loot">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={adopted.item.image} alt="" />
                <div>
                  <b>{adopted.item.displayName}</b>
                  <i>{adopted.item.price.toLocaleString()} 円</i>
                  <small>{adopted.retainer.name}より</small>
                </div>
              </div>
            ) : <p className="end-none">なし。{beheaded} 人を斬り、何も手にせず。</p>}
          </Win>
          <Win speaker="評 定">
            <div className="scores">
              {Object.entries(res.scores).map(([k, v], i) => (
                <div className="sc" key={k}>
                  <div className="k">{k}</div>
                  <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: `${v}%` }}
                    transition={{ duration: .8, delay: .2 + i * .1 }} /></div>
                  <div className="v">{v}</div>
                </div>
              ))}
            </div>
          </Win>
          <Win speaker="家 臣 た ち">
            <div className="end-cast">
              {judgments.map((j, i) => (
                <motion.div key={j.retainer.id + i} className={`end-cast-fig ${j.verdict.toLowerCase()}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 + i * .12 }}>
                  <div className="end-cast-body"><Portrait retainer={j.retainer} variant={i} /></div>
                  <span className="end-cast-mark">{j.verdict === "ADOPT" ? "👑" : "🗡"}</span>
                  <span className="end-cast-name">{j.retainer.name}</span>
                </motion.div>
              ))}
            </div>
          </Win>
        </motion.div>
      )}

      {step >= 4 && (
        <motion.div className="end-menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="end-prince"><Image src={PRINCE} alt="" sizes="160px" /></div>
          <Win className="cmdwin">
            <Menu columns={2} items={[
              { key: "again", label: "もういちど" },
              { key: "title", label: "タイトルへ" },
            ]} onPick={(k) => (k === "again" ? onAgain() : onTitle())} />
          </Win>
          <p className="end-wish">「{wish}」の顛末</p>
        </motion.div>
      )}
    </>
  );
}
