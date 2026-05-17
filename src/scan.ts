import path from 'node:path';
import { defaultIgnoredDirs, dirnameSet, listRepoFiles, readTextIfExists } from './fs.js';
import {
  detectFrameworks,
  detectLanguages,
  findConfigs,
  findConventions,
  findEntryPoints,
  findGaps,
  findRisks
} from './detect.js';
import { commandFromScripts, dependencyNames, detectPackageManager, packageEvidence, readPackageJson } from './package.js';
import { ecosystemCommands } from './ecosystem.js';
import type { RepoPrimer } from './types.js';

const fixedTimestamp = '1970-01-01T00:00:00.000Z';

export type ScanOptions = {
  deterministicTime?: boolean;
};

export async function scanRepo(inputRoot: string, options: ScanOptions = {}): Promise<RepoPrimer> {
  const root = path.resolve(inputRoot);
  const files = await listRepoFiles(root);
  const pkg = await readPackageJson(root);
  const packageManager = await detectPackageManager(root);
  const commands = [...commandFromScripts(pkg, packageManager), ...ecosystemCommands(files)];
  const commandEvidence = commands.flatMap((command) => command.evidence);
  const readme = await readTextIfExists(path.join(root, 'README.md'));
  const languages = detectLanguages(files);
  const frameworks = detectFrameworks(files, dependencyNames(pkg));
  const layout = dirnameSet(files).map((dir) => ({ path: `${dir}/` }));

  return {
    schemaVersion: 1,
    generatedAt: options.deterministicTime ? fixedTimestamp : new Date().toISOString(),
    root,
    name: pkg?.name ?? path.basename(root),
    summary: summarize(readme, languages, frameworks),
    languages,
    frameworks,
    packageManager,
    commands,
    conventions: [...packageEvidence(pkg), ...findConventions(files)],
    entryPoints: findEntryPoints(files),
    configs: findConfigs(files),
    risks: findRisks(files),
    gaps: findGaps(files, commandEvidence),
    layout,
    ignoredDirectories: defaultIgnoredDirs
  };
}

function summarize(readme: string | undefined, languages: string[], frameworks: string[]): string {
  const heading = readme?.split('\n').find((line) => line.startsWith('# '))?.replace(/^#\s+/, '').trim();
  const stack = [...frameworks, ...languages].slice(0, 3).join(', ');
  if (heading && stack) {
    return `${heading} appears to be a ${stack} project.`;
  }
  if (heading) {
    return `${heading} repository detected.`;
  }
  if (stack) {
    return `Repository appears to use ${stack}.`;
  }
  return 'Sparse repository with limited machine-detectable structure.';
}
