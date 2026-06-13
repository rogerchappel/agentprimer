# AgentPrimer Video Brief

## Angle

Show how a coding agent can get a short, evidence-backed repo briefing before making a first edit.

## 60-second flow

1. Run `node dist/src/index.js scan fixtures/node-cli --deterministic --out /tmp/node-cli-primer.md`.
2. Show stack signals, commands, conventions, likely entry points, and risk notes in the generated Markdown.
3. Run `node dist/src/index.js suggest-task fixtures/sparse-repo --max-risk low`.
4. Explain the safety model: AgentPrimer reads local files, reports evidence, and does not call an LLM.

## Claims to avoid

- Do not claim AgentPrimer understands source code semantics deeply.
- Do not claim it replaces human onboarding documentation.
- Do not claim it uploads, indexes, or enriches repositories remotely.
