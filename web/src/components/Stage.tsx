"use client";
import { motion } from "motion/react";
import type { Mood, Offering } from "@/lib/types";
import ThroneRoom from "./ThroneRoom";

export function Dust({ n = 20 }: { n?: number }) {
  return (
    <div className="dust-layer" aria-hidden>
      {Array.from({ length: n }).map((_, i) => {
        // 3 粒に 2 粒は窓明かりの帯（中央）に寄せて、光を見えるようにする
        const inBeam = i % 3 !== 0;
        const left = inBeam ? 34 + ((i * 13) % 32) : (i * 37) % 92 + 3;
        return (
          <span key={i} className="dust" style={{
            left: `${left}%`,
            bottom: `${(i * 23) % 42 + 3}%`,
            opacity: inBeam ? 1 : .45,
            animationDuration: `${6 + (i % 5) * 1.4}s`,
            animationDelay: `-${(i * 1.7) % 8}s`,
          }} />
        );
      })}
    </div>
  );
}

export function Queue({ total, cursor }: { total: number; cursor: number }) {
  return (
    <div className="queue">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`q ${i < cursor ? "gone" : i === cursor ? "now" : "wait"}`} />
      ))}
    </div>
  );
}

/** 心境ごとの立ち居振る舞い */
const IDLE: Record<Mood | "calm", { anim: Record<string, number[]>; dur: number }> = {
  calm:      { anim: { y: [0, -7, 0], rotate: [-1.5, 1.5, -1.5] }, dur: 2.6 },
  pitch:     { anim: { y: [0, -10, 0], rotate: [-3, 3, -3] }, dur: 1.5 },      // 身を乗り出す
  desperate: { anim: { y: [0, -4, 0], rotate: [-1, 1, -1], x: [-3, 3, -3] }, dur: .4 }, // 震える
  resigned:  { anim: { y: [0, 2, 0], rotate: [4, 4.6, 4] }, dur: 4.5 },        // うなだれる
};

export function Figure({ offering, entering = true, mood }: {
  offering: Offering; entering?: boolean; mood?: Mood;
}) {
  const { retainer } = offering;
  const idle = IDLE[mood ?? "calm"];
  return (
    <motion.div
      className={`figure mood-${mood ?? "calm"}`}
      initial={entering ? { x: 260, opacity: 0, scale: .82 } : false}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 90, damping: 14 }}
    >
      <motion.div
        className="body"
        animate={idle.anim}
        transition={{ duration: idle.dur, repeat: Infinity, ease: "easeInOut" }}
      >
        {retainer.emoji}
        {mood === "desperate" && <span className="sweat">💦</span>}
        {mood === "resigned" && <span className="sweat">💀</span>}
      </motion.div>
      <div className="shadow" />
      <div className="plate" style={{ borderColor: retainer.color }}>{retainer.name}</div>
    </motion.div>
  );
}

export function Card({ offering, delay = .28, glow = false, onOpen }: {
  offering: Offering; delay?: number; glow?: boolean; onOpen?: () => void;
}) {
  const { item } = offering;
  return (
    <motion.div
      className={`offer parchment${glow ? " glow" : ""}`}
      onClick={onOpen}
      role={onOpen ? "button" : undefined}
      whileHover={onOpen ? { scale: 1.03, rotate: -0.6 } : undefined}
      whileTap={onOpen ? { scale: .98 } : undefined}
      initial={{ y: -46, rotate: -14, scale: .72, opacity: 0 }}
      animate={{ y: 0, rotate: -1.4, scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 13, delay }}
    >
      <span className="corner tl">◆</span><span className="corner tr">◆</span>
      <span className="corner bl">◆</span><span className="corner br">◆</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="thumb" src={item.image} alt="" />
      <div className="iname">{item.displayName}</div>
      <div className="price">{item.price.toLocaleString()}<small>円</small></div>
      {onOpen && <span className="peek">▸ 検分する</span>}
      <motion.div className="seal"
        initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: -12 }}
        transition={{ type: "spring", stiffness: 200, damping: 11, delay: delay + .35 }}>
        献上
      </motion.div>
    </motion.div>
  );
}

export function Speech({ text, delay = .62, mood }: {
  text: string; delay?: number; mood?: Mood;
}) {
  return (
    <motion.div className={`speech mood-${mood ?? "calm"}`} key={text}
      initial={{ scale: .6, y: 12, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 180, damping: 14, delay }}>
      「{text}」
    </motion.div>
  );
}

/**
 * 画面全体を覆う背景の層。枠を持たず、ビューポートいっぱいに広がる。
 * UI（見出し・操作パネル）は別の層としてこの上に重ねる。
 */
export function Scene({ children, dim = false }: { children?: React.ReactNode; dim?: boolean }) {
  return (
    <div className="scene" aria-hidden={false}>
      <ThroneRoom dim={dim} />
      <Dust />
      <div className="scene-fg">{children}</div>
    </div>
  );
}

/** 互換のため名前を残す */
export const Room = Scene;
