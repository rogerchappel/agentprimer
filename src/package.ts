import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CommandCandidate, Evidence } from './types.js';
import { pathExists } from './fs.js';

type PackageJson = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export async function readPackageJson(root: string): Promise<PackageJson | undefined> {
  const manifestPath = path.join(root, 'package.json');
  let text: string;
  try {
    text = await readFile(manifestPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw new Error(`cannot read package manifest ${manifestPath}: ${errorMessage(error)}`);
  }

  try {
    return JSON.parse(text) as PackageJson;
  } catch (error) {
    throw new Error(`invalid package manifest ${manifestPath}: ${errorMessage(error)}`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function detectPackageManager(root: string): Promise<string | undefined> {
  const checks: Array<[string, string]> = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['package-lock.json', 'npm'],
    ['yarn.lock', 'yarn'],
    ['bun.lock', 'bun']
  ];

  for (const [file, manager] of checks) {
    if (await pathExists(path.join(root, file))) {
      return manager;
    }
  }

  if (await pathExists(path.join(root, 'package.json'))) {
    return 'npm';
  }

  return undefined;
}

export function commandFromScripts(pkg: PackageJson | undefined, manager: string | undefined): CommandCandidate[] {
  if (!pkg?.scripts) {
    return [];
  }

  const runner = manager === 'yarn' ? 'yarn' : manager === 'pnpm' ? 'pnpm' : manager === 'bun' ? 'bun run' : 'npm run';
  const important = ['test', 'check', 'lint', 'build', 'typecheck', 'smoke', 'dev', 'start'];
  const commands: CommandCandidate[] = [];

  for (const name of important) {
    const script = pkg.scripts[name];
    if (!script) {
      continue;
    }

    commands.push({
      name,
      command: runner === 'yarn' && name !== 'start' ? `yarn ${name}` : `${runner} ${name}`,
      confidence: name === 'test' || name === 'build' ? 'high' : 'medium',
      evidence: [{ path: 'package.json', detail: `scripts.${name}: ${script}` }]
    });
  }

  return commands;
}

export function dependencyNames(pkg: PackageJson | undefined): string[] {
  return Object.keys({ ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) }).sort();
}

export function packageEvidence(pkg: PackageJson | undefined): Evidence[] {
  return pkg ? [{ path: 'package.json', detail: pkg.name ? `package: ${pkg.name}` : 'package metadata' }] : [];
}
