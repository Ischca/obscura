# SlideDiagram Kit — プロダクト計画 & 技術仕様（MVP）

> **目的**: スライド/プレゼンでよく使う「崩れない図」を、**テキストDSL**から**自動レイアウト**で**SVG**に出力する“図のコンポーネントライブラリ”。**人手座標なし**でも美しく・一貫して・再利用できる。

---

## 0. 製品ビジョン

* **宣言して終わり**: Mermaidのように意図だけを書けば、図は自動で破綻なくレイアウト。
* **プレゼン特化**: Flow / Boundary / Guardrail / Matrix / Timeline / Do&Don't など“スライド頻出型”を標準搭載。
* **成果物に強い**: SVG（ベクタ）を第一出力、PNG/PDF/HTMLにも書き出し。テーマ（ブランドカラー/フォント）適用OK。
* **運用で困らない**: 変更に強いリビルド、CIで差分テスト、ロック可能なレイアウト（seed/constraint）。

---

## 1. MVP のスコープ

**型（プリセット）**

1. `flow` — 手順/責務分離のフロー（直交配線・交差回避）
2. `boundary` — 社内/社外・許可/禁止の境界図
3. `guardrail` — 三層防御（権限/人/CI）やRACIの層構造

**入出力**

* 入力: SlideDSL（後述）
* 出力: SVG（デフォルト）、HTML断片、PNG（オプション）

**非目標（MVP外）**

* 3D/アニメーション、極端に大規模なグラフ、動的編集UI

---

## 2. SlideDSL v0.1（草案）

**基本構文**

* 1ファイル=1図。1行1命令。`#`以降はコメント。
* 文字列は`"…"`、識別子は日本語OK（空白は`"…"`で囲む）。

### 2.1 Flow

```
flow title: "サジェスト運用"
 lane 人 { 開発者: "IDEで採用/不採用" }
 lane AI { サジェスト: "Copilot" }
 lane プロセス { コミット PR レビューCI: "レビュー→CI→main" }
 path: 開発者 -> サジェスト -> コミット -> PR -> レビューCI
 forbid: サジェスト -X-> PR
 theme: minimal
```

### 2.2 Boundary

```
boundary title: データ境界
 internal { コード  アセット: "イラスト/顧客"  AI  プロキシ }
 external { 許可API }
 allow: AI -> コード, AI -> プロキシ, プロキシ -> 許可API
 forbid: AI -X-> アセット
```

### 2.3 Guardrail

```
guardrail title: 三つのブレーキ
 layer: 権限("サジェストのみ/コミット不可")
 layer: 人("採用/不採用＋レビュー")
 layer: CI("品質ゲート必須")
```

**拡張（後方互換）**

* `group`, `same-row`, `note`, `icon:` 等はv0.2以降で。

---

## 3. アーキテクチャ

```
packages/
  core/          # AST型定義・テーマ・ユーティリティ
  parser/        # SlideDSL → AST（chevrotain）
  layout-elk/    # AST → elk graph（制約付与・直交配線）
  render-svg/    # elk json → SVG（テーマ適用）
  cli/           # .slide → .svg / .png 変換
  web-demo/      # 単一HTMLでのデモ（ブラウザELK or バンドルSVG）
```

**選定**

* **ELK.js**: 直交・交差回避・分層・制約（同列/同段）に強い
* **SVG**: ベクタ／CSS変数テーマ／アクセシビリティ
* **chevrotain**: TSで拡張しやすいLL(k)パーサ

---

## 4. データフロー

`DSL(text)` → `parser(AST)` → `layout-elk(positions, routes)` → `render-svg(svg)` → `export`

---

## 5. 主要インターフェース（TS草案）

```ts
// packages/core/src/types.ts
export type DiagramType = 'flow' | 'boundary' | 'guardrail'

export interface Diagram {
  type: DiagramType
  title?: string
  theme?: string
}

export interface Flow extends Diagram {
  lanes: { name: string; nodes: NodeDef[] }[]
  paths: EdgeDef[]
  forbids?: EdgeDef[]
}

export interface Boundary extends Diagram {
  internal: NodeDef[]
  external?: NodeDef[]
  allows: EdgeDef[]
  forbids?: EdgeDef[]
}

export interface Guardrail extends Diagram {
  layers: { title: string; note?: string }[]
}

export interface NodeDef { id: string; label?: string }
export interface EdgeDef { from: string; to: string; kind?: 'allow'|'forbid' }
```

```ts
// packages/layout-elk/src/layout.ts
import ELK from 'elkjs/lib/elk.bundled.js'
import { Flow, Boundary, Guardrail } from '@slide-diagram/core'

const elk = new ELK({ defaultLayoutOptions: {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '48',
  'elk.spacing.nodeNode': '28',
  'elk.layered.edgeRouting': 'ORTHOGONAL',
  'elk.direction': 'RIGHT'
}})

export async function layoutFlow(flow: Flow) {
  // AST → ELKグラフへの変換（laneごとにswimlane風の constraints を付与）
  // 同列配置: nodesに `org.eclipse.elk.layered.nodePlacement.bk.fixedAlignment` 等を活用
}
```

```ts
// packages/render-svg/src/svg.ts
export function renderSVG(layoutGraph: any, theme: Theme): string {
  // ノードはrounded rect、直交エッジ、禁止は赤・×ラベル
  // viewBoxを自動計算し、文字はrem等の相対でスケール
  return `<svg ...>...</svg>`
}
```

---

## 6. CLI（最小）

```bash
# インストール
npx slide-diagram-cli build input.slide -o diagram.svg
# オプション
npx slide-diagram-cli build input.slide -o out --png --theme brand
```

```ts
// packages/cli/src/index.ts
import { parse } from '@slide-diagram/parser'
import { layoutFlow, layoutBoundary, layoutGuardrail } from '@slide-diagram/layout-elk'
import { renderSVG } from '@slide-diagram/render-svg'
```

---

## 7. Webデモ（単一HTMLで完結）

* `elk.bundled.js` をCDNロード → テキストエリアのDSLを**その場でSVG化**
* 生成SVGを**右クリックでコピー**→ スライドへ

---

## 8. テーマ設計

* CSS変数で色/角丸/線幅/フォントを定義
* 例: `--ink`, `--ok`, `--ng`, `--border`, `--radius`
* ブランド適用: JSONでプリセット → クラスに適用

---

## 9. テスト戦略

* **スナップショット**: DSL→SVGの差分（CIでレグレッション検知）
* **レイアウト健全性**: 交差数/最短距離/重なり検出（幾何判定）
* **E2E**: 代表DSLを複数ブラウザでレンダリング → 画像比較

---

## 10. 互換性/パフォーマンス

* Node 18+/ブラウザ最新をターゲット
* 大きめ図はワーカースレッド/OffscreenCanvasでELKを並列実行
* キャッシュ: AST/ELK結果/アイコン計測

---

## 11. ライセンス/配布

* OSSは **MIT** を想定（アイコンやフォントは除外）
* npm公開: `@slide-diagram/*`
* バイナリなし、CDN/ESM両対応

---

## 12. ロードマップ（6週間）

**Week 1–2（MVP1）**

* parser: Flow/Boundary/Guardrailの最小文法
* layout-elk: 直交配線・同列配置・禁止エッジ（赤×）
* render-svg: ベーステーマ/ボックス/矢印/ラベル
* web-demo: 単一HTMLで動作

**Week 3–4（MVP2）**

* テーマ拡張（ブランド3色＋アクセント）
* Matrix/Timelineの追加
* CLI出力（SVG/PNG）
* 回帰テスト/スナップショット整備

**Week 5–6（MVP3）**

* 制約指定（`same-row`, `group`）
* 図の注釈、アイコンセット、凡例生成
* 事例テンプレ（テンプレDSL）

---

## 13. リスクと対応

* **複雑図のレイアウト破綻** → ELKの制約/ヒントを増やす。型ごとに**上限ノード数**をガイド。
* **DSL肥大化** → 必須最小記法を維持、装飾はテーマ/テンプレに寄せる。
* **PNG化の画質** → SVG→PNGはppr指定/`resvg`などの高品質レンダラ。

---

## 14. 次アクション（あなたが今すぐ触れるもの）

* **A)** Webデモ雛形（単一HTML）を次メッセージで用意可能。
* **B)** モノレポ最小テンプレ（pnpm + TS + vite + jest）を生成。
* **C)** 既存LPへの**埋め込みタグ `<slide-diagram dsl="...">`** プロト。

> 希望の優先度（A/B/C）を教えてください。最小実装をこちらでまとめてお渡しします。
