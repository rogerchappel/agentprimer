import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { scanRepo } from './scan.js';
import { renderJson, renderMarkdown, renderSuggestedTask } from './render.js';
import { suggestTask } from './task.js';
import type { OutputFormat, RiskLevel } from './types.js';

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  const [command, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(help());
    return 0;
  }

  if (command === '--version' || command === '-v') {
    process.stdout.write('0.1.0\n');
    return 0;
  }

  if (command === 'scan') {
    return runScan(rest);
  }

  if (command === 'validate') {
    return runValidate(rest);
  }

  if (command === 'suggest-task') {
    return runSuggestTask(rest);
  }

  process.stderr.write(`Unknown command: ${command}\n\n${help()}`);
  return 1;
}

async function runScan(args: string[]): Promise<number> {
  const parsed = parseArgs(args);
  const primer = await scanRepo(parsed.root, { deterministicTime: parsed.deterministic });
  const output = parsed.format === 'json' ? renderJson(primer) : renderMarkdown(primer);

  if (parsed.out) {
    await mkdir(path.dirname(path.resolve(parsed.out)), { recursive: true });
    await writeFile(parsed.out, output, 'utf8');
  } else {
    process.stdout.write(output);
  }

  return 0;
}

async function runValidate(args: string[]): Promise<number> {
  const parsed = parseArgs(args, ['--min-score']);
  const minScore = parseMinScore(parsed.options.get('--min-score') ?? '70');
  const primer = await scanRepo(parsed.root, { deterministicTime: parsed.deterministic });
  const failedChecks = primer.handoff.checks.filter((check) => !check.passed);
  const passed = primer.handoff.score >= minScore && failedChecks.length === 0;
  const result = {
    name: primer.name,
    score: primer.handoff.score,
    minScore,
    passed,
    failedChecks
  };
  const output = parsed.format === 'json'
    ? renderJson(result)
    : renderValidation(result);

  if (parsed.out) {
    await mkdir(path.dirname(path.resolve(parsed.out)), { recursive: true });
    await writeFile(parsed.out, output, 'utf8');
  } else {
    process.stdout.write(output);
  }

  return passed ? 0 : 2;
}

async function runSuggestTask(args: string[]): Promise<number> {
  const parsed = parseArgs(args, ['--max-risk']);
  const maxRisk = parseRisk(parsed.options.get('--max-risk') ?? 'low');
  const primer = await scanRepo(parsed.root, { deterministicTime: parsed.deterministic });
  const task = suggestTask(primer, maxRisk);
  const output = parsed.format === 'json' ? renderJson(task) : renderSuggestedTask(task);

  if (parsed.out) {
    await mkdir(path.dirname(path.resolve(parsed.out)), { recursive: true });
    await writeFile(parsed.out, output, 'utf8');
  } else {
    process.stdout.write(output);
  }

  return 0;
}

function parseArgs(
  args: string[],
  commandOptions: string[] = []
): { root: string; format: OutputFormat; out?: string; deterministic: boolean; options: Map<string, string> } {
  const valueOptions = new Set(['--format', '--out', ...commandOptions]);
  const flags = new Set(['--deterministic']);
  const options = new Map<string, string>();
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('-')) {
      positionals.push(arg);
      continue;
    }

    const equalsIndex = arg.indexOf('=');
    const name = equalsIndex === -1 ? arg : arg.slice(0, equalsIndex);
    if (flags.has(name)) {
      if (equalsIndex !== -1) throw new Error(`Option ${name} does not take a value`);
      continue;
    }
    if (!valueOptions.has(name)) throw new Error(`Unknown option: ${name}`);

    const value = equalsIndex === -1 ? args[index + 1] : arg.slice(equalsIndex + 1);
    if (!value || value.startsWith('-')) throw new Error(`Missing value for option: ${name}`);
    options.set(name, value);
    if (equalsIndex === -1) index += 1;
  }

  if (positionals.length > 1) throw new Error(`Unexpected argument: ${positionals[1]}`);

  return {
    root: positionals[0] ?? '.',
    format: parseFormat(options.get('--format') ?? 'markdown'),
    out: options.get('--out'),
    deterministic: args.includes('--deterministic'),
    options
  };
}

function parseFormat(value: string): OutputFormat {
  if (value === 'markdown' || value === 'json') {
    return value;
  }
  throw new Error(`Unsupported format: ${value}`);
}

function parseRisk(value: string): RiskLevel {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  throw new Error(`Unsupported risk level: ${value}`);
}

function parseMinScore(value: string): number {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error(`Unsupported min score: ${value}`);
  }
  return score;
}

function renderValidation(result: {
  name: string;
  score: number;
  minScore: number;
  passed: boolean;
  failedChecks: Array<{ label: string }>;
}): string {
  const lines = [
    `# Agent Primer Validation: ${result.name}`,
    '',
    `- Score: ${result.score}/100`,
    `- Required score: ${result.minScore}/100`,
    `- Result: ${result.passed ? 'pass' : 'fail'}`,
    ''
  ];
  if (result.failedChecks.length) {
    lines.push('## Failed Checks', '');
    for (const check of result.failedChecks) lines.push(`- ${check.label}`);
    lines.push('');
  }
  return lines.join('\n');
}

function help(): string {
  return `agentprimer - local-first repo onboarding packets

Usage:
  agentprimer scan [repo] [--format markdown|json] [--out file] [--deterministic]
  agentprimer validate [repo] [--min-score 0-100] [--format markdown|json] [--out file] [--deterministic]
  agentprimer suggest-task [repo] [--max-risk low|medium|high] [--format markdown|json] [--out file] [--deterministic]

Examples:
  agentprimer scan . --out docs/AGENT_PRIMER.md
  agentprimer validate . --min-score 80
  agentprimer scan fixtures/node-cli --format json
  agentprimer suggest-task . --max-risk low
  agentprimer scan . --format json --deterministic
`;
}
