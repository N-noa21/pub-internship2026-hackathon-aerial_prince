"use client";
import { motion } from "motion/react";
import type { EndingResult } from "@/lib/types";

export default function EndingScroll({ res }: { res: EndingResult }) {
  return (
    <>
      <div className="scrollwrap">
        <motion.div className="paper"
          initial={{ height: 0 }} animate={{ height: "78%" }}
          transition={{ duration: 1.15, delay: .25, ease: [.2, .8, .3, 1] }}>
          <motion.div className="inner"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: .7 }}>
            <div className="kanmuri">王 国 年 代 記</div>
            <div className="scroll-title">{res.title}</div>
            <div className="scroll-fable">— {res.fable} —</div>
            <div className="divider" />
            <div className="epi">{res.epilogue}</div>
          </motion.div>
          <motion.div className="wax"
            initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: -10 }}
            transition={{ type: "spring", stiffness: 200, damping: 11, delay: 1.6 }}>
            認
          </motion.div>
        </motion.div>
      </div>
      <div className="rod" style={{ top: "8%" }} />
      <motion.div className="rod" initial={{ top: "12%" }} animate={{ top: "86%" }}
        transition={{ duration: 1.15, delay: .25, ease: [.2, .8, .3, 1] }} />
    </>
  );
}
