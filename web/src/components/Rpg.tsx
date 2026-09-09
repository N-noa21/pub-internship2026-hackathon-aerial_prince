"use client";
import { useEffect, useRef, useState } from "react";

/** RPG の枠つきウィンドウ */
export function Win({ children, className = "", speaker, tone }: {
  children: React.ReactNode; className?: string; speaker?: string; tone?: string;
}) {
  return (
    <div className={`win ${className}`}>
      {speaker && <span className="win-speaker" style={tone ? { borderColor: tone, color: tone } : undefined}>{speaker}</span>}
      <div className="win-body">{children}</div>
    </div>
  );
}

/** 一文字ずつ出す。クリック/キーで即時全表示。 */
export function Typewriter({ text, speed = 34, onDone }: {
  text: string; speed?: number; onDone?: () => void;
}) {
  const [n, setN] = useState(0);
  const done = n >= text.length;
  useEffect(() => { setN(0); }, [text]);
  useEffect(() => {
    if (done) { onDone?.(); return; }
    const t = setTimeout(() => setN((v) => v + 1), speed);
    return () => clearTimeout(t);
  }, [n, text, speed, done, onDone]);
  useEffect(() => {
    const skip = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, button")) return;   // 操作系のクリックは無視
      setN(text.length);
    };
    window.addEventListener("pointerdown", skip);
    return () => window.removeEventListener("pointerdown", skip);
  }, [text]);
  return (
    <>
      {text.slice(0, n)}
      {done && <span className="cursor">▼</span>}
    </>
  );
}

export type MenuItem = { key: string; label: string; hint?: string; disabled?: boolean };

/** ▶ カーソルで選ぶ縦メニュー。↑↓ と Enter に対応。 */
export function Menu({ items, onPick, columns = 1 }: {
  items: MenuItem[]; onPick: (key: string) => void; columns?: number;
}) {
  const [i, setI] = useState(0);
  const ref = useRef(items);
  ref.current = items;

  useEffect(() => { setI(0); }, [items.map((x) => x.key).join()]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 入力欄に文字を打っている間・IME 変換中はメニュー操作に使わない
      if (e.isComposing || e.keyCode === 229) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      const list = ref.current;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); setI((v) => (v + 1) % list.length); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); setI((v) => (v - 1 + list.length) % list.length); }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const it = list[i];
        if (it && !it.disabled) onPick(it.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, onPick]);

  return (
    <ul className="menu" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
      {items.map((it, idx) => (
        <li key={it.key}>
          <button className="mi" data-on={idx === i} disabled={it.disabled}
            onMouseEnter={() => setI(idx)}
            onClick={() => !it.disabled && onPick(it.key)}>
            <span className="cur">▶</span>
            <span className="lb">{it.label}</span>
            {it.hint && <span className="hintlabel">{it.hint}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
