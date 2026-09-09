"use client";
import { motion } from "motion/react";
import { BY_ID } from "@/lib/retainers";
import { Portrait } from "./Stage";

/**
 * 年代記を書いている最中の演出。LLM の文章が届くまで巻物の中で見せる。
 * 羽ペンが行を走り、墨の線が引かれていく。書いているのは宰相。
 */
const LINES = 4;
const PER = 1.15;              // 一行あたりの秒数
const CYCLE = LINES * PER;

export default function Scribing() {
  // 羽ペンの軌跡: 行の左→右、次の行の左へ戻る、を繰り返す
  const xs: string[] = []; const ys: number[] = []; const ts: number[] = [];
  for (let i = 0; i < LINES; i++) {
    xs.push("0%", "100%"); ys.push(i, i);
    ts.push((i * PER) / CYCLE, ((i + .9) * PER) / CYCLE);
  }
  xs.push("0%"); ys.push(0); ts.push(1);

  return (
    <div className="scribe">
      <div className="scribe-lines">
        {Array.from({ length: LINES }).map((_, i) => (
          <div className="scribe-row" key={i}>
            <motion.div className="scribe-ink"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: [0, 0, 1, 1, 0] }}
              transition={{
                duration: CYCLE, repeat: Infinity, ease: "linear",
                times: [0, (i * PER) / CYCLE, ((i + .9) * PER) / CYCLE, .985, 1],
              }} />
            {/* 墨だまり */}
            <motion.span className="scribe-drop"
              animate={{ opacity: [0, 0, .7, .7, 0], scale: [.4, .4, 1, 1, .4] }}
              transition={{ duration: CYCLE, repeat: Infinity, times: [0, ((i + .55) * PER) / CYCLE, ((i + .62) * PER) / CYCLE, .985, 1] }}
              style={{ left: `${30 + (i * 23) % 50}%` }} />
          </div>
        ))}
        <motion.div className="scribe-quill"
          animate={{ left: xs, top: ys.map((y) => `${y * 2.05}em`), rotate: [-18, -22, -18] }}
          transition={{ left: { duration: CYCLE, repeat: Infinity, ease: "linear", times: ts },
                        top: { duration: CYCLE, repeat: Infinity, ease: "linear", times: ts },
                        rotate: { duration: .35, repeat: Infinity, ease: "easeInOut" } }}>
          🪶
        </motion.div>
      </div>

      <div className="scribe-side">
        <motion.div className="scribe-figure"
          animate={{ y: [0, -3, 0], rotate: [0, 1.5, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}>
          <Portrait retainer={BY_ID.chancellor} />
        </motion.div>
        <div className="scribe-caption">宰相が筆を執っております<span className="cursor">…</span></div>
        <div className="scribe-inkpot">🫙</div>
      </div>
    </div>
  );
}
