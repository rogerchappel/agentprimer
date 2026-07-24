# JSON Output

`agentprimer scan --format json` emits a stable object intended for local tooling.

## Top-Level Fields

- `schemaVersion`: currently `1`
- `generatedAt`: ISO timestamp, or the Unix epoch when `--deterministic` is used
- `root`: absolute scanned path
- `name`: package name or directory name
- `summary`: short human-readable summary
- `handoff`: readiness score plus evidence-linked checks for agent handoff
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
- `ignoredDirectories`: generated/vendor directories skipped during walking
- `scan`: scan coverage metadata with `truncated`, `fileLimit`, `filesDiscovered`, and `filesIncluded`

The detector considers at most 800 prioritized file paths. When a repository has
more files, `scan.truncated` is `true`; top-level files, likely entry points, test
surfaces, source files, and workflow files are considered before other paths.
`filesDiscovered` counts non-ignored files found, while `filesIncluded` is the
number used by detectors.

## Evidence Shape

```json
{
  "path": "package.json",
  "detail": "scripts.test: node --test"
}
```

`detail` is optional. Paths are repository-relative except `root`.

## Handoff Shape

```json
{
  "score": 83,
  "checks": [
    {
      "id": "verification-command-detected",
      "label": "Verification command is detected",
      "passed": true,
      "evidence": [{ "path": "package.json", "detail": "script \"test\"" }]
    }
  ]
}
```
