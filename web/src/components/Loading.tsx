"use client";
import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { KRAKEN, PRINCE } from "@/lib/art";

/** 品を探している間の口上（海） */
const SEA_LINES = [
  "家臣が海の向こうへ品を探しに出ております……",
  "商人の船が市場へ向かっております……",
  "クラーケンが荷を検めております……",
  "農民が港で荷降ろしを待っております……",
  "錬金術師が海水を蒸留しております……",
  "貴族が船酔いしております……",
  "騎士が帆を張り直しております……",
  "宰相が積荷の目録を作っております……",
  "そろそろ港に着きます……",
];
/** 顛末を待つ間の口上（陸） */
const LAND_LINES = [
  "年代記を編んでおります……",
  "宰相が筆を走らせております……",
  "書記が墨を磨っております……",
];

export default function Loading({ label, mode = "kraken" }: { label?: string; mode?: "kraken" | "gallop" }) {
  const lines = mode === "kraken" ? SEA_LINES : LAND_LINES;
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % lines.length), 2600);
    return () => clearInterval(t);
  }, [lines.length]);

  if (mode === "gallop") {
    return (
      <div className="gallop">
        <div className="speedlines">
          {Array.from({ length: 14 }).map((_, k) => (
            <span key={k} style={{
              top: `${8 + (k * 37) % 84}%`, width: `${40 + (k % 5) * 34}px`,
              animationDuration: `${.5 + (k % 4) * .16}s`, animationDelay: `-${(k * .11) % 1}s`,
              opacity: .25 + (k % 3) * .22,
            }} />
          ))}
        </div>
        <motion.div className="rider"
          animate={{ y: [0, -16, 0, -8, 0], rotate: [-2, 1.5, -2] }}
          transition={{ duration: .62, repeat: Infinity, ease: "easeInOut" }}>
          <Image src={PRINCE} alt="" className="rider-img" sizes="260px" priority />
        </motion.div>
        <div className="road" />
        <motion.p className="gallop-text" key={label ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {label ?? lines[i]}<span className="cursor">▼</span>
        </motion.p>
      </div>
    );
  }

  return (
    <div className="sea">
      {/* 空と遠くの波 */}
      <div className="sea-sky" />
      <div className="sea-wave far" />

      {/* クラーケンと船。波に揺られる */}
      <motion.div className="kraken"
        animate={{ y: [0, -10, 0, 6, 0], rotate: [-2.5, 1.5, -2.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}>
        <Image src={KRAKEN} alt="" className="kraken-img" sizes="320px" priority />
      </motion.div>

      {/* 手前の波（2 層を逆向きに流す） */}
      <div className="sea-wave mid" />
      <div className="sea-wave near" />

      {/* 泡 */}
      {Array.from({ length: 10 }).map((_, k) => (
        <motion.span key={k} className="bubble"
          style={{ left: `${18 + (k * 17) % 64}%`, width: 4 + (k % 3) * 3, height: 4 + (k % 3) * 3 }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -120 - (k % 4) * 30, opacity: [0, .8, 0] }}
          transition={{ duration: 2.4 + (k % 5) * .5, repeat: Infinity, delay: k * .33, ease: "easeOut" }} />
      ))}

      {/* しぶき */}
      {[0, 1, 2].map((k) => (
        <motion.span key={k} className="spray" style={{ left: `${30 + k * 20}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1.8], opacity: [0, .7, 0], y: [0, -24, -34] }}
          transition={{ duration: 1.3, repeat: Infinity, delay: k * 1.05, ease: "easeOut" }} />
      ))}

      <motion.p className="gallop-text" key={label ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {label ?? lines[i]}<span className="cursor">▼</span>
      </motion.p>
    </div>
  );
}
