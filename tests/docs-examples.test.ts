import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = new URL('../../', import.meta.url);
const cli = fileURLToPath(new URL('dist/src/cli-entry.js', root));
const readme = readFileSync(new URL('README.md', root), 'utf8');
const jsonSchema = readFileSync(new URL('docs/JSON_SCHEMA.md', root), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as { version: string };

function runCli(...args: string[]): string {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: fileURLToPath(root),
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function fencedBlockAfter(markdown: string, heading: string, lang: string): string {
  const headingIndex = markdown.indexOf(heading);
  assert.ok(headingIndex >= 0, `missing heading: ${heading}`);
  const fenceStart = markdown.indexOf('```' + lang, headingIndex);
  assert.ok(fenceStart >= 0, `missing \`\`\`${lang} block after: ${heading}`);
  const bodyStart = fenceStart + lang.length + 4; // skip closing fence chars and the newline
  const bodyEnd = markdown.indexOf('\n```', bodyStart);
  assert.ok(bodyEnd >= 0, `unterminated fenced block after: ${heading}`);
  return markdown.slice(bodyStart, bodyEnd);
}

describe('documented examples stay live', () => {
  it('README example block is a prefix of the real fixture scan output', () => {
    const documented = fencedBlockAfter(readme, 'Example output starts like this:', 'md').split('\n');
    const actual = runCli('scan', 'fixtures/node-cli').split('\n');

    assert.ok(documented.length > 5, 'README example block looks degenerate');
    assert.ok(
      documented.every((line, index) => actual[index] === line),
      `README example drifted from real scan output:\n--- documented ---\n${documented.join('\n')}\n--- actual ---\n${actual.slice(0, documented.length).join('\n')}`
    );
  });

  it('JSON_SCHEMA documents the actual JSON output fields', () => {
    const output = JSON.parse(runCli('scan', 'fixtures/node-cli', '--format', 'json', '--deterministic')) as Record<string, unknown>;
    for (const field of ['schemaVersion', 'generatedAt', 'root', 'name', 'summary', 'commands', 'entryPoints']) {
      assert.ok(jsonSchema.includes(`\`${field}\``), `JSON_SCHEMA.md does not document ${field}`);
      assert.ok(field in output, `scanner output is missing documented field ${field}`);
    }
    assert.doesNotMatch(jsonSchema, /Handoff Shape|handoff object/);
  });

  it('--version reports the package.json version', () => {
    assert.equal(runCli('--version').trim(), pkg.version);
  });
});
