"use client";
import { motion } from "motion/react";

export default function TitleScreen() {
  return (
    <div className="crest">
        <motion.div className="crown"
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>
          👑
        </motion.div>
        <motion.div className="logo"
          initial={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [.2, .9, .3, 1] }}>
          下民ショッピング
        </motion.div>
        <motion.div className="tagline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .9, duration: .8 }}>わがまま王子の謁見</motion.div>
        <motion.div className="ribbon" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
          transition={{ delay: 1.1, duration: .8 }} />
        <motion.div className="lead" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: .9 }}>
          わがままを申せ。気に入らぬ者は斬るがよい。
      </motion.div>
    </div>
  );
}
