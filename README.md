# Obscura

From obscure to clear. Obscura turns concise DSL into auto‑laid out SVG diagrams for business slides.

## Why Obscura
- Declarative `.slide` DSL; no manual coordinates
- ELK‑powered layered, orthogonal routing; stable layouts
- Rich patterns: Flow, Boundary, Guardrail, Swimlane, Timeline, Matrix, Board, Venn, Heatmap, Cycle, Funnel, OKR/Hierarchy/Decision, SIPOC, Journey/Blueprint, Fishbone, Sankey
- SVG first (scales cleanly); PNG via CLI; Storybook gallery for visual review

## Quick Start
```bash
pnpm i
pnpm -r build
node packages/cli/dist/index.js build examples/basic.slide -o out/diagram.svg
# Or after linking CLI: obscura build examples/basic.slide -o out/diagram.svg
```

Live gallery (renders examples on request):
```bash
node scripts/serve-gallery-live.js
# http://localhost:5173
```

Storybook (edit DSL in place via Controls):
```bash
pnpm -F @obscura/gallery-storybook storybook -p 6007
# http://localhost:6007
```

## DSL Examples
Flow with forbid:
```
flow title: Suggest Workflow
path: Developer -> Suggest -> Commit -> PR -> ReviewCI
forbid: Suggest -X-> PR
```
Boundary:
```
boundary title: Data Boundary
internal { Code  Asset: "Artwork/Customers"  AI  Proxy }
external { AllowedAPI }
allow: AI -> Code, AI -> Proxy, Proxy -> AllowedAPI
forbid: AI -X-> Asset
```
Fishbone & Sankey:
```
fishbone title: Sources of Risk
main: Incidents
bone: Permissions{ Overprivilege, Missing audit }
note: at=Permissions text="Keep minimum privileges"

sankey title: Adoption Flow
edge: Candidates -> Adopted, weight=0.6
edge: Candidates -> Rejected, weight=0.4
edge: Adopted -> PR, weight=0.9
edge: PR -> Approved, weight=0.8
```

## Packages
- `@obscura/core` · `@obscura/parser` · `@obscura/layout-elk` · `@obscura/render-svg`
- `obscura` (CLI): build diagrams from `.slide`

See `docs/PRODUCT.md` for vision and `AGENTS.md` for contributor guidelines & roadmap.
