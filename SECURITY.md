# Security Policy

`agentprimer` is a local repository scanner. It should not make network requests or transmit repository contents.

## Supported Versions

The current `main` branch and latest tagged release receive security fixes.

## Reporting A Vulnerability

Open a private GitHub security advisory for `rogerchappel/agentprimer` if available. If that is not available, contact the maintainer with:

- affected version or commit
- reproduction steps
- expected impact
- whether generated output can expose sensitive file names or content

Please do not publish exploit details until there is a fix or mitigation.

## Data Handling

- Scans are local by default.
- `--out` writes only to the path you provide.
- Generated packets may include file names and script text from package metadata.
- Review output before posting it in an issue, chat, or public artifact.

## Non-Goals

`agentprimer` is not a secret scanner, dependency auditor, or sandbox. Use dedicated tools for those jobs.
