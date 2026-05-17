# JSON Output

`agentprimer scan --format json` emits a stable object intended for local tooling.

## Top-Level Fields

- `schemaVersion`: currently `1`
- `generatedAt`: ISO timestamp, or the Unix epoch when `--deterministic` is used
- `root`: absolute scanned path
- `name`: package name or directory name
- `summary`: short human-readable summary
- `languages`: detected language labels
- `frameworks`: detected framework/tooling labels
- `packageManager`: detected JavaScript package manager when present
- `commands`: runnable command candidates with confidence and evidence
- `conventions`: README, AGENTS, CONTRIBUTING, SECURITY, and related docs
- `entryPoints`: likely code entry points
- `configs`: common config files
- `risks`: areas worth extra review
- `gaps`: missing onboarding affordances
- `layout`: first-level directory snapshot

## Evidence Shape

```json
{
  "path": "package.json",
  "detail": "scripts.test: node --test"
}
```

`detail` is optional. Paths are repository-relative except `root`.
