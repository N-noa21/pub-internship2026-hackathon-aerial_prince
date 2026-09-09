"use client";
import Image from "next/image";
import { motion } from "motion/react";
import { PRINCE } from "@/lib/art";
import { Menu, Win } from "./Rpg";

export default function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <>
      {/* 背景を落として文字を立たせる */}
      <div className="title-shade" aria-hidden />

      <motion.div className="title-hero"
        initial={{ opacity: 0, y: 18, scale: .98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .7, ease: [.2, .8, .3, 1] }}>
        <span className="corner tl">◆</span><span className="corner tr">◆</span>
        <span className="corner bl">◆</span><span className="corner br">◆</span>

        <div className="title-inner">
          <motion.div className="title-prince"
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1, y: [0, -8, 0] }}
            transition={{
              x: { duration: .8, delay: .2 }, opacity: { duration: .8, delay: .2 },
              y: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 1 },
            }}>
            <Image src={PRINCE} alt="" className="title-prince-img" sizes="320px" priority />
          </motion.div>

          <div className="title-text">
            <motion.div className="title-kicker"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}>
              ── わがまま王子の謁見 ──
            </motion.div>
            <motion.h1 className="title-logo"
              initial={{ opacity: 0, letterSpacing: ".5em", filter: "blur(8px)" }}
              animate={{ opacity: 1, letterSpacing: ".06em", filter: "blur(0px)" }}
              transition={{ duration: 1, delay: .3, ease: [.2, .8, .3, 1] }}>
              下民ショッピング
            </motion.h1>
            <motion.div className="title-rule"
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: .7 }} />
            <motion.p className="title-lead"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
              わがままを申せ。気に入らぬ者は斬るがよい。
            </motion.p>
            <motion.div className="title-menu"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.45 }}>
              <Win className="cmdwin">
                <Menu items={[{ key: "start", label: "はじめる", hint: "▶ Enter" }]} onPick={onStart} />
              </Win>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
