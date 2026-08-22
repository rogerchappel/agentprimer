# Release Checklist

Use this checklist before publishing or announcing AgentPrimer.

1. Install dependencies with `npm ci`.
2. Run `npm run release:check`.
3. Run `bash scripts/validate.sh`.
4. Confirm `npm run package:smoke` verifies the import-safe library entrypoint, CLI wrapper, declarations, and tarball exclusions.
5. Scan `fixtures/node-cli` and review the generated primer before using it as release evidence.

The tag release uses npm trusted publishing with GitHub Actions OIDC. Keep the
workflow's npm CLI pinned to version 11.5.1 or later, install it before `npm ci`,
and verify the installed version before publishing with provenance.

Pushing a `v*.*.*` tag runs the release workflow. It captures the single filename
reported by `npm pack --json`, verifies that tarball exists, and publishes that exact
inspected file to npm with public access and provenance. Only after npm publishing
succeeds does the workflow create the GitHub release and attach the same tarball.
