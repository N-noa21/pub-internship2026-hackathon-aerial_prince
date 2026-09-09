"use client";
import { useEffect, useMemo, useRef, useState } from "react";

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

/**
 * 画面に複数のメニューが出ても、キー操作は「最後に開いたメニュー」だけが拾う。
 * （謁見画面で理由サブメニューを開いたとき、下のメニューが一緒に動かないように）
 */
const stack: string[] = [];
let seq = 0;

/**
 * ▶ カーソルで選ぶメニュー。↑↓←→ と Enter に対応。
 * columns を渡すと格子として上下左右を解釈する。
 */
export function Menu({ items, onPick, columns = 1, hint = true }: {
  items: MenuItem[]; onPick: (key: string) => void; columns?: number; hint?: boolean;
}) {
  const uid = useMemo(() => `menu-${++seq}`, []);
  const [i, setI] = useState(0);
  const ref = useRef(items);
  ref.current = items;

  useEffect(() => {
    stack.push(uid);
    return () => {
      const at = stack.indexOf(uid);
      if (at >= 0) stack.splice(at, 1);
    };
  }, [uid]);

  useEffect(() => { setI(firstEnabled(items)); }, [items.map((x) => x.key).join()]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== uid) return;        // 最前面のメニューだけ
      if (e.isComposing || e.keyCode === 229) return;     // IME 変換中は無視

      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      const list = ref.current;
      const cols = Math.max(1, Math.min(columns, list.length));

      const move = (dx: number, dy: number) => {
        e.preventDefault();
        setI((cur) => step(list, cur, dx, dy, cols));
      };

      switch (e.key) {
        case "ArrowUp":
          // 入力中でも上下でメニューへ移れる
          if (typing) el!.blur();
          return move(0, -1);
        case "ArrowDown":
          if (typing) el!.blur();
          return move(0, 1);
        case "ArrowLeft":
          if (typing) return;                              // 文字カーソルの移動を優先
          return move(-1, 0);
        case "ArrowRight":
          if (typing) return;
          return move(1, 0);
        case "Enter":
        case " ": {
          if (typing) return;                              // 入力欄側の Enter を優先
          e.preventDefault();
          const it = list[i];
          if (it && !it.disabled) onPick(it.key);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, onPick, columns, uid]);

  return (
    <>
      <ul className="menu" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
        {items.map((it, idx) => (
          <li key={it.key}>
            <button className="mi" data-on={idx === i} disabled={it.disabled}
              onMouseEnter={() => !it.disabled && setI(idx)}
              onClick={() => !it.disabled && onPick(it.key)}>
              <span className="cur">▶</span>
              <span className="lb">{it.label}</span>
              {it.hint && <span className="hintlabel">{it.hint}</span>}
            </button>
          </li>
        ))}
      </ul>
      {hint && <p className="keyhint">↑↓{columns > 1 ? "←→" : ""} えらぶ　Enter けってい</p>}
    </>
  );
}

function firstEnabled(items: MenuItem[]): number {
  const at = items.findIndex((x) => !x.disabled);
  return at < 0 ? 0 : at;
}

/** 格子として動かし、無効な項目は飛ばす */
function step(items: MenuItem[], cur: number, dx: number, dy: number, cols: number): number {
  const rows = Math.ceil(items.length / cols);
  let next = cur;
  for (let guard = 0; guard < items.length + rows; guard++) {
    let r = Math.floor(next / cols);
    let c = next % cols;
    if (dx) c = (c + dx + cols) % cols;
    if (dy) r = (r + dy + rows) % rows;
    let n = r * cols + c;
    if (n >= items.length) n = dy > 0 ? c % items.length : items.length - 1;
    next = n;
    if (!items[next]?.disabled) return next;
  }
  return cur;
}
