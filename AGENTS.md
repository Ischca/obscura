# Obscura — Repository Guidelines

## Project Structure & Module Organization
- docs/: product plans/specs (see docs/PRODUCT.md).
- packages/: core, parser, layout-elk, render-svg, cli, web-demo.
- Source lives in packages/*/src; tests sit beside code as *.spec.ts; sample DSL/SVG in packages/*/fixtures/.

## Build, Test, and Development Commands
- Install deps: pnpm i (use npm/yarn if preferred).
- Build all packages: pnpm -r build.
- Type-check all: pnpm -r typecheck.
- Watch one package: pnpm -F parser dev (replace parser as needed).
- Run CLI locally: pnpm -F cli exec obscura build examples/basic.slide -o out/diagram.svg.
- Run tests with coverage: pnpm -r test -- --coverage.

## Coding Style & Naming Conventions
- TypeScript first; 2-space indent; Prettier for formatting; ESLint for rules.
- Packages and files: kebab-case (e.g., layout-elk, svg.ts).
- Types/interfaces: PascalCase; functions/vars: camelCase; constants: UPPER_SNAKE_CASE.
- Public APIs must be typed and documented with TSDoc.

## Testing Guidelines
- Framework: Vitest (or Jest if configured).
- Name tests as file.spec.ts next to source; snapshots allowed for SVG/layout.
- Cover parser, layout, and render logic (target ~80% lines in core/parser/layout-elk).
- Example: pnpm -F parser test -t "parses flow lanes".

## Commit & Pull Request Guidelines
- Conventional Commits: feat(parser): ..., fix(layout-elk): ..., docs: ..., chore: ....
- Keep PRs focused; include rationale, linked issue, and before/after SVG (or AST) when behavior changes.
- CI must pass build/lint/test; include tests for new features and bug fixes.

## Security & Configuration Tips
- Treat SlideDSL as untrusted input; no eval, sanitize external refs.
- Keep layout deterministic (fixed seeds/options) to make snapshots stable.
- Web demo: avoid loading unpinned third-party scripts; prefer local/locked versions.

## Architecture Notes
- Flow: DSL → parser(AST) → layout-elk(graph) → render-svg(string) → export.
- Prefer small, composable modules; keep package boundaries clean and public APIs minimal.

## Roadmap & TODO
- Fishbone/Sankey/Annotations: finish Fishbone layout refactor (`fbNodes/fbEdges`), type fixes; propagate `weight` in Sankey edges and render stroke-width; add callouts/notes (sticky labels with arrow) in renderer; add Storybook stories; SVG/PNG verify.
- ELK tuning: reduce crossings (ports/spacing/thoroughness), stable seeds for snapshots; improve swimlane time-scale and dependency edges.
- Text & Theme: better auto-wrap/padding; node autosize; CSS variables for colors/linecaps; light/dark theme.
- Diagram extensions: Venn 3-set overlap labels; Gantt lite (bars with start/end); Hub-and-Spoke; Ecosystem map presets.
- Gallery/Storybook: controls for width/grid/DSL; compare 2up/3up; optional screenshot addon; CI build `build-storybook` and publish (GH Pages/Vercel).
- CLI & DX: `--png` via librsvg; config file for layout/theme; input validation + helpful errors.
- Tests/CI: Vitest SVG snapshots for parser/layout/renderer; example coverage; pipeline to run build/lint/test.
- Docs: expand examples and usage; update README with gallery/storybook; keep AGENTS.md aligned as features land.
