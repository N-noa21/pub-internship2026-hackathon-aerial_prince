"use client";
import { motion } from "motion/react";
import type { Offering } from "@/lib/types";
import { Card, Figure } from "./Stage";

const COLORS = ["#d9b544", "#f7e6ae", "#8f1b1b", "#fff6dc", "#c9762a"];

export default function AdoptBurst({ offering }: { offering: Offering }) {
  return (
    <>
      <motion.div className="rays" animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
      <motion.div className="holyglow" initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, .6] }} transition={{ duration: 1.6, times: [0, .3, 1] }} />

      {Array.from({ length: 28 }).map((_, i) => (
        <motion.span key={i} className="confetti"
          style={{ left: `${(i * 29) % 96 + 2}%`, background: COLORS[i % COLORS.length] }}
          initial={{ y: -30, opacity: 0, rotate: 0 }}
          animate={{ y: 520, opacity: [0, 1, 1, 0], rotate: 720 }}
          transition={{ duration: 2.4, delay: (i % 9) * .09, ease: "linear" }} />
      ))}

      <motion.div className="grand"
        initial={{ scale: .4, y: 20, opacity: 0 }}
        animate={{ scale: [.4, 1.08, 1], y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [.2, .9, .3, 1] }}>
        大儀である
      </motion.div>

      <Figure offering={offering} entering={false} />
      <Card offering={offering} delay={.15} glow />
    </>
  );
}
