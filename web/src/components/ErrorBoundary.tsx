"use client";
import { Component, type ReactNode } from "react";

type S = { error: Error | null };

/** 描画エラーで画面が真っ暗になるのを防ぎ、何が起きたかを見せる */
export default class ErrorBoundary extends Component<{ children: ReactNode }, S> {
  state: S = { error: null };
  static getDerivedStateFromError(error: Error): S { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="fatal">
        <div className="win"><div className="win-body">
          <p style={{ margin: 0 }}>年代記が破れました。</p>
          <p style={{ margin: "8px 0 0", fontSize: ".8rem", color: "#9fb0e6", wordBreak: "break-all" }}>
            {this.state.error.message}
          </p>
          <button className="btn" style={{ marginTop: 14 }} onClick={() => location.reload()}>やり直す</button>
        </div></div>
      </div>
    );
  }
}
