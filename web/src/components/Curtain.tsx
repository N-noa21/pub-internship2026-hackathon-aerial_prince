"use client";
import { AnimatePresence, motion } from "motion/react";

/** 場面転換の緞帳。`active` が true の間、左右から幕が閉じる。 */
export default function Curtain({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <div className="curtain" aria-hidden>
          <motion.div className="curtain-panel l"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ duration: .42, ease: [.6, 0, .3, 1] }} />
          <motion.div className="curtain-panel r"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: .42, ease: [.6, 0, .3, 1] }} />
        </div>
      )}
    </AnimatePresence>
  );
}
