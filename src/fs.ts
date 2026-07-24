import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export const defaultIgnoredDirs = [
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.venv',
  '__pycache__'
];

const ignoredDirs = new Set(defaultIgnoredDirs);

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextIfExists(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return undefined;
  }
}

export type RepoFileList = {
  files: string[];
  truncated: boolean;
  discoveredFileCount: number;
  maxFiles: number;
};

export async function listRepoFiles(root: string, maxFiles = 800): Promise<RepoFileList> {
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');

      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          await walk(absolute);
        }
        continue;
      }

      if (entry.isFile()) {
        files.push(relative);
      }
    }
  }

  await walk(root);
  files.sort(compareScanPriority);
  return {
    files: files.slice(0, maxFiles),
    truncated: files.length > maxFiles,
    discoveredFileCount: files.length,
    maxFiles
  };
}

function compareScanPriority(left: string, right: string): number {
  return scanPriority(left) - scanPriority(right) || left.localeCompare(right);
}

function scanPriority(file: string): number {
  if (!file.includes('/')) return 0;
  if (/^(src|app|pages|bin|cmd)\/(index|main|cli)\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs)$/.test(file)) return 1;
  if (/(^|\/)(test|tests|__tests__)(\/|$)|\.(test|spec)\./i.test(file)) return 2;
  if (/^(src|app|pages|bin|cmd)\//.test(file)) return 3;
  if (/^\.github\/workflows\/.+\.ya?ml$/.test(file)) return 4;
  return 5;
}

export function dirnameSet(files: string[]): string[] {
  const dirs = new Set<string>();
  for (const file of files) {
    const dir = path.posix.dirname(file);
    if (dir !== '.') {
      dirs.add(dir.split('/')[0]);
    }
  }
  return [...dirs].sort();
}
