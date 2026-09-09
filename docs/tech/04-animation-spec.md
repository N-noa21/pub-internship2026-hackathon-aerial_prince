# 04. 打ち首アニメーション 実装仕様

> [tech/README.md](README.md) ／ 演出の企画は [../03-presentation.md](../03-presentation.md#打ち首アニメーション)

**AI に量産させるための仕様書。** ここに書いた内容をそのまま指示文として渡せる形にしてある。

## 方針

- **開発時**に AI にまとめて書かせ、**実行時は選んで再生するだけ**。実行時生成はしない（フォールバック用途を除く）。
- 1 演出 = **CSS ファイル 1 枚**。HTML の構造は全演出で共通。
- **CSS のみ。JS を使わない。外部リソースを読み込まない**（CSP で弾かれるため）。

## 共通 HTML（アプリ側が組み立てる。演出側は触らない）

```html
<div class="stage" data-anim="a01-fall">
  <div class="victim">
    <img class="retainer" src="...">   <!-- 家臣の立ち絵 -->
    <img class="item"     src="...">   <!-- 献上品の画像 -->
    <p   class="speech">お待ちを！</p>  <!-- 断末魔 -->
  </div>
  <div class="fx"></div>               <!-- 演出用の自由レイヤー -->
</div>
```

## 演出 CSS が守るルール

1. 対象は **`.victim`、その子要素、`.fx` のみ**。`.stage` の背景・サイズは変更しない
2. **CSS だけ**で完結させる。JS を使わない
3. **外部リソースを読み込まない**（`@import`、Web フォント、画像 URL いずれも不可）。絵文字と CSS 図形で作る
4. すべてのセレクタを **`.stage[data-anim="<id>"]` の配下**に書く。他の演出に影響を与えない
5. `@keyframes` 名とクラス名に **`<id>-` の接頭辞**を付ける（衝突防止）
6. 再生時間は **1.2 秒以内**。終了時に `.victim` が完全に不可視（`opacity: 0` など）になっている
7. `@media (prefers-reduced-motion: reduce)` で、**控えめ版（フェードアウト程度）**も書く

## ファイル名と ID

```
app/assets/animations/
  a01-fall.css      落とし穴
  a02-drag.css      衛兵に連行
  a03-cannon.css    大砲で発射
  a04-stamp.css     却下スタンプ
```

- ファイル名の `a01-fall` がそのまま **`data-anim` の値**であり、`judgments.anim_id` に記録する値になる。

## 実装例（a01-fall）

```css
.stage[data-anim="a01-fall"] .victim {
  animation: a01-fall-drop 0.9s cubic-bezier(.6,0,.9,.3) forwards;
}
@keyframes a01-fall-drop {
  0%   { transform: translateY(0)     rotate(0deg);   opacity: 1; }
  20%  { transform: translateY(-12px) rotate(-3deg);  opacity: 1; }
  100% { transform: translateY(420px) rotate(12deg);  opacity: 0; }
}
.stage[data-anim="a01-fall"] .fx {
  animation: a01-fall-hole 0.9s ease-out forwards;
  background: radial-gradient(ellipse at 50% 90%, #000 0 40%, transparent 41%);
}
@keyframes a01-fall-hole {
  0%   { transform: scaleX(0);   }
  25%  { transform: scaleX(1);   }
  100% { transform: scaleX(1);   }
}
@media (prefers-reduced-motion: reduce) {
  .stage[data-anim="a01-fall"] .victim { animation: a01-fall-fade 0.4s linear forwards; }
  @keyframes a01-fall-fade { to { opacity: 0; } }
}
```

## アプリ側の再生

```python
def render_beheading(anim_id: str, offering: Offering, nonce: int) -> None:
    css = read_stage_file(f"animations/{anim_id}.css")
    html = ANIM_TEMPLATE.format(anim_id=anim_id, css=css, offering=offering)
    st.components.v1.html(html, height=420)
```

- **`nonce` を HTML に埋めて毎回内容を変える。** 同一内容だと iframe が再生成されず、アニメーションが走らない。
- CSS はステージから読む。ファイル数が少ないうちは起動時に全部読んでメモリに置いてよい。

## 出し分け

`anim_id` の決定はコード側で行う（[../03-presentation.md](../03-presentation.md#出し分け)）。

```python
def pick_anim(reason_code: str | None, retainer_id: str, combo: int, used: set[str]) -> str:
    if combo >= 5:                       return "a03-cannon"      # 5 人目は固定で一番派手に
    if reason_code == "rude":            return "a03-cannon"
    if reason_code == "cheap":           return "a04-stamp"
    if reason_code == "not_my_taste":    return "a01-fall"
    return pick_unused(["a01-fall","a02-drag","a04-stamp"], used)  # 同一プレイ内で重複させない
```

## AI に量産させるときのプロンプト骨子

> 添付の共通 HTML と「演出 CSS が守るルール」7 項目に従って、`<演出名>` の退場アニメーションを
> 1 ファイルで書いてください。`data-anim` の値は `<id>`、接頭辞も `<id>-` を使ってください。
> JS と外部リソースは使えません。絵文字と CSS 図形だけで表現してください。

## プレビューギャラリー

**量産の前に作る。** 全演出を並べ、ボタンひとつで再生できるだけの静的 HTML でよい。

- これが無いと、生成した演出の採否を判断できず、量産が回らない
- ダミーの家臣画像と献上品画像を置いて、実際の見え方で確認する
- ローカルのブラウザで開ければ十分。Snowflake に上げる必要はない
