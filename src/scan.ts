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
import type { Evidence, HandoffReadiness, RepoPrimer } from './types.js';

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
  const conventions = [...packageEvidence(pkg), ...findConventions(files)];
  const entryPoints = findEntryPoints(files);
  const configs = findConfigs(files);
  const risks = findRisks(files);
  const gaps = findGaps(files, commandEvidence);
  const layout = dirnameSet(files).map((dir) => ({ path: `${dir}/` }));

  return {
    schemaVersion: 1,
    generatedAt: options.deterministicTime ? fixedTimestamp : new Date().toISOString(),
    root,
    name: pkg?.name ?? path.basename(root),
    summary: summarize(readme, languages, frameworks),
    handoff: scoreHandoff({
      commands,
      conventions,
      entryPoints,
      configs,
      risks,
      gaps,
      files
    }),
    languages,
    frameworks,
    packageManager,
    commands,
    conventions,
    entryPoints,
    configs,
    risks,
    gaps,
    layout,
    ignoredDirectories: defaultIgnoredDirs
  };
}

function scoreHandoff(input: {
  commands: { evidence: Evidence[] }[];
  conventions: Evidence[];
  entryPoints: Evidence[];
  configs: Evidence[];
  risks: Evidence[];
  gaps: Evidence[];
  files: string[];
}): HandoffReadiness {
  const hasGap = (pathName: string) => input.gaps.some((gap) => gap.path === pathName);
  const fileEvidence = (pathName: string): Evidence[] => input.files.includes(pathName) ? [{ path: pathName }] : [];
  const commandEvidence = input.commands.flatMap((command) => command.evidence).slice(0, 3);

  const checks = [
    {
      id: 'readme-present',
      label: 'README is present',
      passed: !hasGap('README.md'),
      evidence: fileEvidence('README.md')
    },
    {
      id: 'agent-instructions-present',
      label: 'Agent instructions are present',
      passed: !hasGap('AGENTS.md'),
      evidence: fileEvidence('AGENTS.md')
    },
    {
      id: 'verification-command-detected',
      label: 'Verification command is detected',
      passed: commandEvidence.length > 0,
      evidence: commandEvidence
    },
    {
      id: 'entry-point-detected',
      label: 'Likely entry point is detected',
      passed: input.entryPoints.length > 0,
      evidence: input.entryPoints.slice(0, 3)
    },
    {
      id: 'test-surface-present',
      label: 'Test surface is present',
      passed: !hasGap('tests/'),
      evidence: input.files.filter((file) => /(^|\/)(test|tests|__tests__)(\/|$)/.test(file)).slice(0, 3).map((pathName) => ({ path: pathName }))
    },
    {
      id: 'risk-surface-visible',
      label: 'Risk surface is visible',
      passed: input.configs.length > 0 || input.risks.length > 0,
      evidence: [...input.configs, ...input.risks].slice(0, 3)
    }
  ];

  return {
    score: Math.round((checks.filter((check) => check.passed).length / checks.length) * 100),
    checks
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
