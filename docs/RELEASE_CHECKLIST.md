# Release Checklist

Use this checklist before publishing or announcing AgentPrimer.

1. Install dependencies with `npm ci`.
2. Run `npm run release:check`.
3. Run `bash scripts/validate.sh`.
4. Confirm `npm run package:smoke` lists `dist/src/index.js` and `dist/src/index.d.ts`.
5. Scan `fixtures/node-cli` and review the generated primer before using it as release evidence.
