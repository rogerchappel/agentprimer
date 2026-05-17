# AGENTS.md

This repository builds `agentprimer`, a local-first TypeScript CLI that creates concise onboarding packets for coding agents.

## Local Commands

- `npm test` - build and run the Node test suite
- `npm run check` - TypeScript typecheck without emitting
- `npm run build` - compile to `dist/`
- `npm run smoke` - run CLI smoke checks against fixtures
- `bash scripts/validate.sh` - full repository validation wrapper

## Project Rules

- Keep scanning local; do not add network calls to core scan behavior.
- Add fixture coverage for every new detector or output behavior.
- Keep Markdown concise and evidence-linked.
- Prefer deterministic sorting for output stability.
- Treat generated packets as reviewable handoff artifacts, not authoritative audits.

## Useful Paths

- `src/scan.ts` assembles the primer model.
- `src/detect.ts` contains file-based detectors.
- `src/render.ts` owns Markdown and JSON rendering.
- `src/task.ts` chooses conservative first tasks.
- `fixtures/` contains scanner examples.
- `docs/PRD.md` is the product source of truth.
