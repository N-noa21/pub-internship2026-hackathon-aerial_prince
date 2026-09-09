"use client";
import { AnimatePresence, motion } from "motion/react";
import type { Offering } from "@/lib/types";

export default function ItemModal({ offering, onClose }: {
  offering: Offering | null; onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {offering && (
        <motion.div className="backdrop" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="parchment sheet" onClick={(e) => e.stopPropagation()}
            initial={{ scale: .86, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: .9, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}>
            <button className="x" onClick={onClose} aria-label="閉じる">✕</button>
            <div className="sheet-head">
              <span className="who" style={{ color: offering.retainer.color }}>
                {offering.retainer.emoji} {offering.retainer.name} の献上品
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="sheet-img" src={offering.item.image} alt="" />
            <h3 className="sheet-name">{offering.item.displayName}</h3>
            <div className="sheet-price">{offering.item.price.toLocaleString()}<small> 円</small></div>
            <div className="divider" />
            <dl className="spec">
              <dt>正式な品名</dt><dd>{offering.item.name}</dd>
              {offering.item.shop && (<><dt>商い</dt><dd>{offering.item.shop}</dd></>)}
              {offering.query && (<><dt>探した言葉</dt><dd>{offering.query}</dd></>)}
            </dl>
            <p className="sheet-speech">「{offering.speech}」</p>
            {offering.item.url && (
              <a className="btn" href={offering.item.url} target="_blank" rel="noreferrer">
                現物を検分する ↗
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
