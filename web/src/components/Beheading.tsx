"use client";
import { motion, type TargetAndTransition } from "motion/react";
import type { AnimId } from "@/lib/retainers";
import type { Offering } from "@/lib/types";

const DELAY = 0.62;   // 斬撃テロップが出てから本編が始まるまで

/** 演出ごとの、退場する家臣の動き */
const VICTIM: Record<AnimId, TargetAndTransition> = {
  fall: {
    y: [0, -18, 380], rotate: [0, -6, 24], opacity: [1, 1, 0],
    transition: { duration: 1.0, delay: DELAY, times: [0, .18, 1], ease: [.55, 0, .9, .35] },
  },
  drag: {
    x: [0, 12, -8, 10, -560], rotate: [0, 8, -8, 6, -28], opacity: [1, 1, 1, 1, 0],
    transition: { duration: 1.3, delay: DELAY, times: [0, .1, .18, .26, 1], ease: "easeIn" },
  },
  cannon: {
    x: [0, -20, 440], y: [0, 14, -400], scale: [1, .9, .12], rotate: [0, -10, 720], opacity: [1, 1, 0],
    transition: { duration: 1.35, delay: DELAY + .1, times: [0, .1, 1], ease: [.15, .65, .4, 1] },
  },
  stamp: {
    scaleY: [1, 1, .16], scaleX: [1, 1, 1.36], y: [0, 0, 56], opacity: [1, 1, 1, 0],
    transition: { duration: 1.5, delay: DELAY, times: [0, .32, .35, 1] },
  },
};

const FX: Record<AnimId, (o: Offering) => React.ReactNode> = {
  fall: () => (
    <>
      <motion.div className="hole" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ duration: .45, delay: DELAY - .1 }} />
      {[-1, 1].map((s) => (
        <motion.div key={s} className="trapdoor"
          style={{ left: s < 0 ? "calc(50% - 106px)" : "50%", transformOrigin: s < 0 ? "right center" : "left center" }}
          initial={{ rotateX: 0 }} animate={{ rotateX: 88 }}
          transition={{ duration: .5, delay: DELAY - .12 }} />
      ))}
      <motion.div className="hole" style={{ background: "radial-gradient(ellipse,rgba(205,175,135,.6),transparent 70%)" }}
        initial={{ opacity: 0, scale: .4 }} animate={{ opacity: [0, .9, 0], scale: [.4, 1.4, 2.1] }}
        transition={{ duration: .7, delay: DELAY + .75 }} />
    </>
  ),
  drag: () => (
    <>
      {[0, .06].map((d, i) => (
        <motion.div key={i} className="guard" style={{ left: `${50 + i * 4}%` }}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: [300, 0, -12, -540], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, delay: DELAY - .1 + d, times: [0, .16, .3, 1], ease: "easeIn" }}>
          💂
        </motion.div>
      ))}
      <motion.div className="dragmark" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ duration: .9, delay: DELAY + .16 }} />
    </>
  ),
  cannon: () => (
    <>
      <motion.div className="cannon" initial={{ x: -220, rotate: -18 }}
        animate={{ x: [-220, 16, 0], rotate: -18 }}
        transition={{ duration: .45, delay: DELAY - .22 }}>🔫</motion.div>
      <motion.div className="boom" initial={{ opacity: 0, scale: .3 }}
        animate={{ opacity: [0, 1, 0], scale: [.3, 1.4, 2.3] }}
        transition={{ duration: .55, delay: DELAY + .1 }}>💥</motion.div>
      <motion.div className="twinkle" initial={{ opacity: 0, scale: .2 }}
        animate={{ opacity: [0, 1, 0], scale: [.2, 1.35, .6], rotate: [0, 180] }}
        transition={{ duration: .6, delay: DELAY + 1.1 }}>✨</motion.div>
    </>
  ),
  stamp: () => (
    <>
      <motion.div className="stamp" initial={{ y: -340, rotate: -18, scale: 1.5, opacity: 0 }}
        animate={{ y: [-340, 124, 106, 110], rotate: -13, scale: [1.5, 1.02, 1, 1], opacity: [0, 1, 1, 1] }}
        transition={{ duration: .62, delay: DELAY - .12, times: [0, .72, .84, 1], ease: [.5, 0, .85, .2] }}>
        却下
      </motion.div>
      {[[-96, -36], [82, -48], [-60, 42], [108, 28], [-124, 8], [46, 60]].map(([x, y], i) => (
        <motion.div key={i} className="ink" initial={{ opacity: 0, x: 0, y: 0, scale: .4 }}
          animate={{ opacity: [0, 1, 0], x, y, scale: [.4, 1.1, 1.2] }}
          transition={{ duration: .7, delay: DELAY + .38 + i * .012 }} />
      ))}
    </>
  ),
};

const SHAKE_AT: Partial<Record<AnimId, number>> = { cannon: 720, stamp: 1040 };

export default function Beheading({ anim, offering, reasonLabel, reasonText }: {
  anim: AnimId; offering: Offering; reasonLabel: string | null; reasonText?: string;
}) {
  const caption = reasonText?.trim()
    ? `「${reasonText.trim().slice(0, 30)}」`
    : reasonLabel && !reasonLabel.includes("無言") ? `— ${reasonLabel} —` : null;
  const shakeDelay = SHAKE_AT[anim];
  return (
    <>
      <motion.div
        style={{ position: "absolute", inset: 0 }}
        animate={shakeDelay ? { x: [0, -10, 9, -7, 5, -3, 0], y: [0, 5, -6, 4, -2, 1, 0] } : {}}
        transition={{ duration: .5, delay: (shakeDelay ?? 0) / 1000, ease: "easeOut" }}
      >
        <motion.div className="victim" animate={VICTIM[anim]}>
          <div className="body">{offering.retainer.emoji}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="held" src={offering.item.image} alt="" />
        </motion.div>
        <div className="fxlayer">{FX[anim](offering)}</div>
      </motion.div>

      {/* 斬撃のイントロ */}
      <motion.div className="flash" initial={{ opacity: 0 }}
        animate={{ opacity: [0, .85, 0, .45, 0], backgroundColor: ["#fff", "#fff", "#ff5a3c", "#ff5a3c", "#ff5a3c"] }}
        transition={{ duration: .5, times: [0, .06, .18, .26, 1] }} />
      {[0, .1].map((d, i) => (
        <motion.div key={i} className="slash" style={{ top: `${46 - i * 5}%`, rotate: `${-24 + i * 8}deg` }}
          initial={{ scaleX: 0, opacity: 1 }} animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
          transition={{ duration: .42, delay: d, times: [0, .55, 1], ease: [.2, .9, .3, 1] }} />
      ))}
      <motion.div className="verdict"
        initial={{ scale: 2.6, opacity: 0, filter: "blur(8px)" }}
        animate={{
          scale: [2.6, 1, 1.06, 1, 1, 1.08], opacity: [0, 1, 1, 1, 1, 0],
          filter: ["blur(8px)", "blur(0px)", "blur(0px)", "blur(0px)", "blur(0px)", "blur(0px)"],
        }}
        transition={{ duration: 1.3, times: [0, .14, .2, .3, .8, 1], ease: [.2, .9, .3, 1] }}>
        打ち首じゃ！
      </motion.div>
      {caption && (
        <motion.div className="why" initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 1, 1, 0], y: 0 }}
          transition={{ duration: 1.6, times: [0, .16, .84, 1], delay: .12 }}>
          {caption}
        </motion.div>
      )}
    </>
  );
}
