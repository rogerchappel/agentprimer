# agentprimer

`agentprimer` turns a repository into a compact onboarding packet for a coding agent: commands, conventions, risks, likely entry points, and a first safe task. It is a briefing, not a lore dump.

The tool is local-first and deterministic in spirit: it reads files, reports evidence, and does not call an LLM or upload repository contents.

## Install

```sh
npm install
npm run build
npm link
```

Or run from a checkout:

```sh
node dist/src/index.js scan .
```

## Use

Write a Markdown primer:

```sh
agentprimer scan . --out docs/AGENT_PRIMER.md
```

Emit JSON for another tool:

```sh
agentprimer scan fixtures/node-cli --format json
```

Ask for a conservative first task:

```sh
agentprimer suggest-task . --max-risk low
```

Gate a repository handoff in CI:

```sh
agentprimer validate . --min-score 80
```

Options may appear before or after the repository and accept either
`--name value` or `--name=value`. Unknown options, missing option values, and
option tokens supplied as values are usage errors: the CLI writes a concise
message to stderr and exits with status 1.

Repositories do not need a `package.json`; non-Node repositories scan normally
without one. If `package.json` is present but cannot be read or parsed,
`scan`, `validate`, and `suggest-task` write a path-specific error to stderr,
exit with status 1, and do not emit a normal packet.

Run the fixture-backed demo packet:

```sh
bash demo/run-primer-packet.sh
```

See [Create an Agent Onboarding Packet](docs/tutorials/create-agent-onboarding-packet.md) for the complete walkthrough.

Example output starts like this:

```md
# Agent Primer: fixture-node-cli

Fixture Node CLI appears to be a Node CLI, TypeScript, JavaScript project.

## Handoff Readiness

- Score: 83/100
- Pass: README is present (README.md)
- Pass: Verification command is detected (package.json: script "test")

## Stack Signals

- Languages: JavaScript, Markdown, TypeScript
- Frameworks: Node CLI
- Package manager: npm
```

## What It Detects

- package metadata and common package managers
- scripts for test, check, lint, build, smoke, dev, and start
- likely languages and frameworks
- AGENTS-like instructions and repo convention files
- common config files and GitHub workflows
- likely entry points
- risky surfaces such as release workflows and deployment files
- missing onboarding gaps such as README, AGENTS.md, or tests
- a handoff readiness score with concrete pass/fail checks for README, agent instructions, verification, entry points, tests, and visible risk surface
- a validation command that exits nonzero when a repository is not ready to hand to another agent

## Design Notes

`agentprimer` stays deliberately boring. It does not infer intent from source code semantics, it does not inspect dependency graphs deeply, and it does not pretend a heuristic is a fact. Every useful claim should point back to a file.

## Limitations

- `agentprimer` summarizes repository signals; it does not understand product intent, hidden runtime behavior, or private operational context.
- Detector output depends on files visible in the checkout. Generated packets can be stale if branches, dependencies, or CI configuration change after the scan.
- Detection analyzes at most 800 prioritized file paths. Top-level metadata, likely entry points, tests, source files, and workflows take priority; JSON and Markdown output report when the scan is truncated.
- Framework labels require package dependencies or recognized source entry files. Directory names and incidental filename substrings alone are not treated as framework evidence.
- Suggested tasks and readiness scores are review aids, not approval to modify code without reading the relevant files.
- Review generated Markdown or JSON before sharing it, especially for internal paths, branch names, or command output copied from the repository.

## Verify

```sh
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
npm run release:check
bash scripts/validate.sh
```

`npm run package:smoke` builds first, then performs an npm pack dry-run so the
published entrypoint and type declarations are checked from fresh output.

## Docs

- [PRD](docs/PRD.md)
- [Tasks](docs/TASKS.md)
- [Orchestration](docs/ORCHESTRATION.md)
- [Machine-readable orchestration](docs/orchestration.json)
- [JSON output contract](docs/JSON_SCHEMA.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Small detector changes should include a fixture and a focused test.

## Security

See [SECURITY.md](SECURITY.md). Review generated packets before sharing them outside your machine.

## License

MIT
