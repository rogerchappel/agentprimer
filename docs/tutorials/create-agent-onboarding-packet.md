# Create an Agent Onboarding Packet

AgentPrimer reads repository files and emits a compact packet for coding agents: stack signals, commands, conventions, risks, entry points, and a conservative first task. It does not call an LLM or upload repository content.

## Generate a Markdown primer

```sh
npm install
npm run build
node dist/src/index.js scan fixtures/node-cli --deterministic --out /tmp/node-cli-primer.md
```

The Node CLI fixture includes package metadata, scripts, tests, source files, and `AGENTS.md`, so the primer has concrete evidence to summarize.

## Generate a first safe task

```sh
node dist/src/index.js suggest-task fixtures/sparse-repo --max-risk low --deterministic --out /tmp/sparse-task.md
```

Sparse repositories produce conservative suggestions because AgentPrimer only reports what it can infer from files.

## Emit JSON for another tool

```sh
node dist/src/cli-entry.js scan fixtures/python-package --format json --deterministic > /tmp/python-package-primer.json
```

JSON output is useful when another local tool wants to consume the packet.

## Demo shortcut

```sh
bash demo/run-primer-packet.sh
```

The script writes all three outputs under `/tmp/agentprimer-demo` and checks for expected report content.
