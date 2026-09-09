"use client";
import { motion } from "motion/react";
import type { Retainer } from "@/lib/retainers";
import { Portrait } from "./Stage";

/**
 * 奥の扉の前に並んで順番を待つ家臣たち。
 * まだ品が届いていない者は暗く沈め、揃うと明るくなる。斬られると列が前に詰まる。
 */
export default function QueueLine({ waiting, offset = 1, tremble = false }: {
  waiting: { retainer: Retainer; pending: boolean }[]; offset?: number; tremble?: boolean;
}) {
  return (
    <div className="queue-line" aria-hidden>
      {waiting.map(({ retainer, pending }, i) => (
        <motion.div key={retainer.id} className={`queue-fig${pending ? " pending" : ""}`} layout
          initial={{ opacity: 0, y: -10 }}
          animate={tremble
            ? { opacity: 1, y: 0, x: [0, -3, 3, -2, 2, 0] }
            : { opacity: 1, y: [0, -2, 0], x: 0 }}
          transition={tremble
            ? { duration: .45, x: { duration: .45 } }
            : { y: { duration: 2.2 + i * .3, repeat: Infinity, ease: "easeInOut" }, layout: { type: "spring", stiffness: 120, damping: 18 } }}
          style={{ zIndex: 3 - Math.min(i, 3) }}>
          <div className="queue-fig-body"><Portrait retainer={retainer} variant={offset + i} /></div>
          <span className="queue-name">{pending ? "……" : retainer.name}</span>
        </motion.div>
      ))}
    </div>
  );
}
