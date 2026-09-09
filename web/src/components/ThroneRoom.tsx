import Image from "next/image";
import bg from "@/assets/background.png";

/**
 * 謁見の間。用意された一枚絵を全画面に敷き、上から光と減光を重ねて空気を作る。
 * （以前は SVG で描いていたが、背景画像に置き換えた）
 */
export default function ThroneRoom({ dim = false }: { dim?: boolean }) {
  return (
    <div className="hall">
      <Image src={bg} alt="" fill priority sizes="100vw"
        placeholder="blur" className="hall-img" />
      <div className="hall-beam" />   {/* 窓から差す光のゆらぎ */}
      <div className="hall-warm" />   {/* 蝋燭の暖色 */}
      <div className="hall-vig" />    {/* 周辺減光で奥行きを出す */}
      {dim && <div className="hall-dim" />}
    </div>
  );
}
