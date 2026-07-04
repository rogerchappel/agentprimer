# agentprimer Skill

## When To Use

Use this skill when an agent needs a compact, evidence-linked briefing before working in an unfamiliar repository. It is best for handoffs, first-pass repo triage, release-candidate intake, and deciding a small first task.

## Inputs

- A local repository path.
- Optional output path for the generated Markdown or JSON primer.
- Optional readiness threshold for `agentprimer validate`.

## Side-Effect Boundaries

`agentprimer scan`, `agentprimer validate`, and `agentprimer suggest-task` only read repository files by default. They write only when `--out` is supplied. The tool does not call an LLM, upload repository content, install packages, publish releases, or mutate Git state.

## Workflow

1. Run `agentprimer scan <repo> --out docs/AGENT_PRIMER.md` when a durable handoff packet is useful.
2. Run `agentprimer validate <repo> --min-score 80` before passing a repo to another agent or automated lane.
3. Run `agentprimer suggest-task <repo> --max-risk low` when the next agent needs a conservative starter task.
4. Review every evidence path before sharing the primer outside the local workspace.

## Approval Requirements

Ask before writing generated primer files into a user repository unless the user requested a repo handoff artifact. Ask before sharing generated reports externally because they may mention private file paths, commands, or repository structure.

## Examples

```sh
agentprimer scan . --format markdown
agentprimer scan . --format json --deterministic
agentprimer validate . --min-score 80 --format json
agentprimer suggest-task . --max-risk low
```

## Verification

Run:

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```
