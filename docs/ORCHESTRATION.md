# Orchestration

`agentprimer` is designed for local agent handoff flows. It does not call an LLM, upload files, or mutate the scanned repository unless the user passes `--out`.

## Agent Flow

1. Run `agentprimer scan <repo> --out docs/AGENT_PRIMER.md` from the repository owner context.
2. Review the Markdown before sharing it with another agent or maintainer.
3. Run `agentprimer scan <repo> --format json` when a machine-readable packet is useful.
4. Run `agentprimer suggest-task <repo> --max-risk low` to identify a conservative first contribution.

## Boundaries

- Keep scans local.
- Treat secret-like filenames as a warning, not proof.
- Prefer evidence-linked output over broad claims.
- Do not use the tool as a security scanner.

## Verification

The local gate is:

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```
