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

export async function listRepoFiles(root: string, maxFiles = 800): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    if (files.length >= maxFiles) {
      return;
    }

    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (files.length >= maxFiles) {
        return;
      }

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
  return files;
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
