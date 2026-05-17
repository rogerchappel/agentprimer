# PRD: agentprimer

Status: in-progress
Decision: build now
Factory run: 2026-05-17 PM

## Pitch

`agentprimer` turns a repository into a compact onboarding packet for a coding agent: commands, conventions, risks, likely entry points, and a first safe task. It is a repo briefing without the lore dump. 🧭

## Why It Matters

Agents waste time rediscovering scripts, project shape, test commands, and local rules. Humans also need a quick way to hand a repo to another maintainer without pasting a long explanation. A deterministic local primer helps both sides start with the same facts.

## Qualification

### Pub Test

"Run `agentprimer scan` in a repo and get a useful Markdown + JSON brief another agent can act on immediately."

### Source / Inspiration

Inspired by OpenAI Codex-style repository instruction files, GitHub Copilot coding-agent onboarding patterns, and Roger's repeated OSS factory handoff needs. This is a renamed/reframed local scanner; it does not copy an external project.

### V1 Scope

- TypeScript CLI package.
- Scan package metadata, README, AGENTS-like files, scripts, common config files, test/build commands, and repository layout.
- Detect likely language/framework, package manager, command confidence, risky areas, and missing onboarding gaps.
- Emit deterministic Markdown and JSON packets.
- Support `agentprimer suggest-task` for one small safe first task based on missing docs/tests/config.
- Fixture-backed tests for Node CLI, Python package, mixed docs-only, and sparse repo cases.

## Out of Scope

- Calling LLM APIs.
- Uploading repository contents.
- Deep semantic code analysis.
- Replacing human review.

## CLI Sketch

```bash
agentprimer scan . --out docs/AGENT_PRIMER.md
agentprimer scan fixtures/node-cli --format json
agentprimer suggest-task . --max-risk low
```

## Verification

Run `npm test`, `npm run check`, `npm run build`, `npm run smoke`, `bash scripts/validate.sh`, and one real CLI smoke against checked-in fixtures.

## Agent Prompt

Build `agentprimer` as a local-first deterministic repo onboarding CLI. Keep reports concise, evidence-linked, and directly useful for human/agent handoff.

