"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EndingStage from "@/components/EndingStage";
import ItemModal from "@/components/ItemModal";
import { Scene } from "@/components/Stage";
import { BY_ID, type RetainerId } from "@/lib/retainers";
import { fromParam } from "@/lib/share";
import type { Judgment, Offering } from "@/lib/types";

/** 共有された顛末（読み取り専用）。結果は URL に畳み込まれているのでサーバーは要らない */
function Shared() {
  const params = useSearchParams();
  const router = useRouter();
  const [inspecting, setInspecting] = useState<Offering | null>(null);
  const d = fromParam(params.get("d"));
  if (!d) {
    return (
      <div className="center"><div className="win"><div className="win-body">
        <p style={{ margin: 0 }}>この年代記は読めませんでした。</p>
        <button className="btn" style={{ marginTop: 14 }} onClick={() => router.push("/")}>はじめから</button>
      </div></div></div>
    );
  }
  const mk = (id: string) => BY_ID[id as RetainerId] ?? BY_ID.merchant;
  const item = (name: string, price = 0, image = "", url = "") =>
    ({ itemCode: "", name, displayName: name, price, image, url, shop: "" });
  const adopted: Offering | null = d.adopted
    ? { retainer: mk(d.cast.find((c) => c.verdict === "ADOPT")?.id ?? "merchant"), item: item(d.adopted.name, d.adopted.price, d.adopted.image), speech: "", query: "" }
    : null;
  const judgments: Judgment[] = d.cast.map((c) => ({
    retainer: mk(c.id), item: item(c.item, c.price ?? 0, c.image ?? "", c.url ?? ""), verdict: c.verdict,
    reasonCode: "silent", reasonLabel: "", anim: null,
  }));
  return (
    <div className="end-stage">
      <EndingStage readOnly res={{ title: d.title, fable: d.fable, epilogue: d.epilogue, scores: d.scores, era: d.era, timeline: d.timeline }}
        adopted={adopted} judgments={judgments} wish={d.wish} refining={false}
        onAgain={() => router.push("/")} onTitle={() => router.push("/")} onInspect={setInspecting} />
      <ItemModal offering={inspecting} onClose={() => setInspecting(null)} />
    </div>
  );
}

export default function Page() {
  return (
    <main className="shell">
      <Scene dim />
      <div className="ui"><Suspense><Shared /></Suspense></div>
    </main>
  );
}
