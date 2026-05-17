# Roadmap

This roadmap describes intended direction, not a binding delivery promise.

## Now

- Ship the local-first scanner MVP.
- Keep Markdown and JSON output stable enough for downstream tooling.
- Cover Node CLI, Python package, docs-only, and sparse repositories with fixtures.

## Next

- Infer Python commands from `pyproject.toml` tool sections with better confidence labels.
- Add workspace/package monorepo hints.
- Add optional ignore patterns for large generated folders.
- Publish a documented JSON schema once V1 fields settle.

## Later

- Add plugin-style detectors for ecosystems that need richer parsing.
- Provide shell completion.
- Explore editor/task-runner integrations without changing the local-first privacy model.

## Not Planned

- LLM API calls in the default scan path.
- Uploading repository contents.
- Replacing human review or dedicated security scanners.
