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
  const parsed = parseCommonArgs(args);
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
  const parsed = parseCommonArgs(args);
  const minScore = parseMinScore(readOption(args, '--min-score') ?? '70');
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
  const parsed = parseCommonArgs(args);
  const maxRisk = parseRisk(readOption(args, '--max-risk') ?? 'low');
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

function parseCommonArgs(args: string[]): { root: string; format: OutputFormat; out?: string; deterministic: boolean } {
  const positional = args.filter((arg, index) => !arg.startsWith('--') && !isOptionValue(args, index));
  const root = positional[0] ?? '.';
  const format = parseFormat(readOption(args, '--format') ?? 'markdown');
  return {
    root,
    format,
    out: readOption(args, '--out'),
    deterministic: args.includes('--deterministic')
  };
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
    return prefixed?.slice(name.length + 1);
  }
  return args[index + 1];
}

function isOptionValue(args: string[], index: number): boolean {
  const previous = args[index - 1];
  return previous === '--format' || previous === '--out' || previous === '--max-risk' || previous === '--min-score';
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
  agentprimer scan [repo] [--format markdown|json] [--out file]
  agentprimer validate [repo] [--min-score 0-100] [--format markdown|json]
  agentprimer suggest-task [repo] [--max-risk low|medium|high] [--format markdown|json]

Examples:
  agentprimer scan . --out docs/AGENT_PRIMER.md
  agentprimer validate . --min-score 80
  agentprimer scan fixtures/node-cli --format json
  agentprimer suggest-task . --max-risk low
  agentprimer scan . --format json --deterministic
`;
}
