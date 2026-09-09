"use client";
import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { PRINCE } from "@/lib/art";

/** 待っている間の口上。順に流れる。 */
const LINES = [
  "城下に触れを出しております……",
  "家臣が市へ走っております……",
  "商人が荷を解いております……",
  "農民が畑から戻っております……",
  "錬金術師が怪しい粉を量っております……",
  "騎士が具足を磨いております……",
  "貴族が値札を隠しております……",
  "宰相が算盤を弾いております……",
  "口上の稽古をしております……",
  "そろそろ参ります……",
];

export default function Loading({ label }: { label?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % LINES.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="gallop">
      {/* 流れる風景 */}
      <div className="speedlines">
        {Array.from({ length: 14 }).map((_, k) => (
          <span key={k} style={{
            top: `${8 + (k * 37) % 84}%`,
            width: `${40 + (k % 5) * 34}px`,
            animationDuration: `${.5 + (k % 4) * .16}s`,
            animationDelay: `-${(k * .11) % 1}s`,
            opacity: .25 + (k % 3) * .22,
          }} />
        ))}
      </div>

      {/* 王子と白馬 */}
      <motion.div className="rider"
        animate={{ y: [0, -16, 0, -8, 0], rotate: [-2, 1.5, -2] }}
        transition={{ duration: .62, repeat: Infinity, ease: "easeInOut" }}>
        <Image src={PRINCE} alt="" className="rider-img" sizes="260px" priority />
      </motion.div>

      {/* 砂ぼこり */}
      <div className="hooves">
        {Array.from({ length: 7 }).map((_, k) => (
          <motion.span key={k}
            initial={{ opacity: 0, x: 0, y: 0, scale: .5 }}
            animate={{ opacity: [0, .75, 0], x: -190 - k * 26, y: -12 - (k % 3) * 10, scale: [.5, 1.5, 2.1] }}
            transition={{ duration: 1.05, repeat: Infinity, delay: k * .15, ease: "easeOut" }} />
        ))}
      </div>

      <div className="road" />

      <motion.p className="gallop-text" key={label ?? i}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {label ?? LINES[i]}
        <span className="cursor">▼</span>
      </motion.p>
    </div>
  );
}
