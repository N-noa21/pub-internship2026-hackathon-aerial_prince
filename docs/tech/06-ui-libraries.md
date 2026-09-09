# 06. UI / アニメーションライブラリの調査

> [tech/README.md](README.md) ／ 調査日: 2026-09-09 ／ **調査のみ。導入はしていない**

## 現状

- スタイル: `globals.css` に手書き CSS（約 900 行）。Tailwind は未使用
- アニメーション: **`motion` v13**（Framer Motion の後継）。spring・keyframes・`AnimatePresence` で全演出を記述
- 制約: Snowflake App Runtime は**ビルド時の外部アクセスが絞られる**（npm に EAI が要る場合あり）、
  実行時は CSP で外部ドメインのスクリプト不可。→ **npm でバンドルされるものは全て可、CDN から実行時に読むものは不可**
  （<https://docs.snowflake.com/en/developer-guide/snowflake-app-runtime/limitations>）

## 結論（優先順）

| 優先 | 候補 | 用途 | 判断 |
| --- | --- | --- | --- |
| ◎ | **canvas-confetti** | 採用演出の紙吹雪 | 3KB。いまの自作紙吹雪より圧倒的に良い。即入れてよい |
| ◎ | **GSAP**（+ `@gsap/react`） | 打ち首の**連続演出**（タイムライン）、「打ち首じゃ！」の文字分解 | 2025-04 に**全プラグイン無償化**。motion と併用可 |
| ○ | **Tailwind CSS v4** | レイアウト調整の速度、下記コンポーネント集の前提 | 単体では「便利」止まり。移行コストあり |
| ○ | **Magic UI / Aceternity UI** | Sparkles・Shimmer・Spotlight・Meteors 等の「ゴージャス」演出をコピペ | Tailwind + motion 前提。**Tailwind を入れるならこれが目的** |
| △ | Lottie（`@lottiefiles/dotlottie-react`） | 爆発・キラキラなど既製のベクター演出 | 質は高いが、アセットごとにライセンス確認。ランタイム 60〜100KB |
| △ | tsParticles | 広間の埃・火の粉 | いまの CSS 埃で足りている |
| × | Rive | キャラが心境で動く状態機械 | Rive エディタで作る必要があり、ハッカソンでは重い |
| × | PixiJS / react-pixi | WebGL スプライト | 過剰 |
| — | Next.js View Transitions（実験的） | 画面遷移 | `AnimatePresence` で足りている |

## 各論

### motion（継続）

- いまの演出は全部これで書けている。**捨てる理由はない**
- 未使用の機能: `useAnimate`（命令的に順番を組む）、`layout` アニメーション、`useScroll`
- GSAP を入れても、状態に連動する UI 側（メニュー・カード・吹き出し）は motion のまま

### GSAP

- <https://gsap.com/resources/React/> / <https://www.npmjs.com/package/gsap>
- **2025 年 4 月に Webflow が全プラグインを無償化**（SplitText / MorphSVG / DrawSVG / ScrollTrigger 含む）。商用可
- `@gsap/react` の `useGSAP()` が `useEffect` の代わりになり、クリーンアップを自動化。App Router では `"use client"` が要る
- **効く場所**: 打ち首の演出。いまは motion の keyframes を各要素に個別に書いているが、
  GSAP の**タイムライン**なら「0.0s フラッシュ → 0.1s 斬撃線 → 0.6s 床が開く → 0.7s 落下 → 1.3s 砂埃」を
  1 本の時間軸にラベル付きで並べられ、調整が桁違いに楽
- **SplitText** で「打ち首じゃ！」を 1 文字ずつ跳ねさせる、**MorphSVG** で紋章が変形する、など
- サイズ: コア約 30KB gz。motion と二重になるが許容範囲

### canvas-confetti

- <https://www.npmjs.com/package/canvas-confetti>
- 3KB。`confetti({ particleCount: 200, spread: 90, origin: { y: .6 } })` で終わり
- 採用演出の紙吹雪（いま 28 個の `motion.span`）と、エンディングの称号表示に

### Tailwind CSS v4

- <https://tailwindcss.com/docs/guides/nextjs>
- v4 は **CSS ファースト**。`tailwind.config.js` は無くなり、`@import "tailwindcss"` と `@theme` で書く
- Next.js 16 とは問題なし。`create-next-app --tailwind` の構成をそのまま足せる
- **移行の実態**: 既存の 900 行を書き直すことになる。ユーティリティ化で嬉しいのは
  レスポンシブ調整（`md:` など）と余白の統一。**演出そのものは速くならない**
- アニメーションのユーティリティは `tw-animate-css`（v4 対応の `tailwindcss-animate` 後継）
  <https://github.com/Wombosvideo/tw-animate-css>
- **判断**: Tailwind 単体のために移行するのは割に合わない。**Magic UI / Aceternity を使いたいなら入れる**

### Magic UI / Aceternity UI

- <https://magicui.design/> / <https://ui.aceternity.com/>
- どちらも **React + Tailwind + motion** のコピペ式コンポーネント集（shadcn 流儀）。npm 依存ではなくソースを取り込む
- このゲームに効きそうなもの:
  - **Sparkles / Particles** — タイトルロゴの周りに金の粒子
  - **Shine Border / Border Beam** — 献上カードの縁を光が走る
  - **Spotlight** — 家臣に当たる照明
  - **Meteors** — 打ち首の背景に流れる光
  - **Text Reveal / Blur In** — 称号の出現
  - **Confetti** — canvas-confetti のラッパー
- 2026 年時点では Magic UI の方が伸びており、150 以上のコンポーネントが無償
  （<https://www.pkgpulse.com/guides/aceternity-ui-vs-magic-ui-vs-shadcn-animated-react-2026>、二次情報）
- **判断**: 「ゴージャスさをあと一段」を短時間で出すには一番の近道。ただし Tailwind 移行が前提

### Lottie / Rive

- Lottie: LottieFiles の既製アニメ（爆発・キラキラ・王冠）を `.lottie` で同梱して再生。
  **CDN からではなく同梱にすれば CSP は問題ない**。アセットごとにライセンスを見る
- Rive: 状態機械でキャラが心境（pitch / desperate / resigned）に応じて動く、という理想の使い方ができるが、
  **Rive エディタで作画する人が要る**。いらすとや素材を動かす用途には向かない

## もし入れるなら（順番）

1. `canvas-confetti` — 30 分。採用演出とエンディングに
2. `gsap` + `@gsap/react` — 打ち首 4 種をタイムラインに書き直す。半日
3. Tailwind v4 → Magic UI の Sparkles / Shine Border / Spotlight — 移行込みで 1 日

## 注意

- どれも npm でバンドルされるので Snowflake の CSP には抵触しない。ただし**ビルド時の npm 取得に EAI が要る可能性**は変わらない
- Google Fonts など**実行時に外部から読むもの**は引き続き避ける（Magic UI のサンプルにはフォント指定が混ざるので注意）
- バンドルサイズ: motion 約 35KB + GSAP 約 30KB + confetti 3KB。ゲームとしては許容
