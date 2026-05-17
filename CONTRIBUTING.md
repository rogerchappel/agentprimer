# Contributing

Thanks for improving `agentprimer`. Keep changes small, evidence-driven, and easy to review.

## Local Setup

```sh
npm install
npm test
```

## Development Rules

- Add or update a fixture for scanner behavior changes.
- Add focused tests for detector, renderer, or CLI behavior.
- Keep output concise and evidence-linked.
- Do not add network calls to the scan path.
- Avoid broad semantic analysis unless the PRD changes.

## Verification

Run the full local gate before opening a PR:

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Commit Style

Use Conventional Commits, for example:

- `feat: detect pyproject package metadata`
- `fix: keep markdown output stable for sparse repos`
- `test: add fixture for workspace packages`
