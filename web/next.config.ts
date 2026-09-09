import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 楽天のサムネイルをそのまま表示する（将来は内部ステージ配信に切り替える）
  images: { remotePatterns: [{ protocol: "https", hostname: "**.rakuten.co.jp" }] },
};

export default nextConfig;
