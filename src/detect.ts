import type { Evidence } from './types.js';

const languageRules: Array<[string, RegExp]> = [
  ['TypeScript', /\.(ts|tsx)$/],
  ['JavaScript', /\.(js|jsx|mjs|cjs)$/],
  ['Python', /\.py$/],
  ['Go', /\.go$/],
  ['Rust', /\.rs$/],
  ['Markdown', /\.md$/],
  ['Shell', /\.(sh|bash|zsh)$/]
];

export function detectLanguages(files: string[]): string[] {
  const found = new Set<string>();
  for (const file of files) {
    for (const [language, pattern] of languageRules) {
      if (pattern.test(file)) {
        found.add(language);
      }
    }
  }
  return [...found].sort();
}

export function detectFrameworks(files: string[], dependencies: string[]): string[] {
  const deps = new Set(dependencies);
  const frameworks = new Set<string>();

  if (deps.has('react') || files.some((file) => file.endsWith('.tsx'))) {
    frameworks.add('React');
  }
  if (deps.has('next') || files.some((file) => file.startsWith('app/') || file.startsWith('pages/'))) {
    frameworks.add('Next.js');
  }
  if (deps.has('commander') || deps.has('yargs') || files.some((file) => file.includes('cli'))) {
    frameworks.add('Node CLI');
  }
  if (files.includes('pyproject.toml')) {
    frameworks.add('Python package');
  }
  if (files.includes('go.mod')) {
    frameworks.add('Go module');
  }
  if (files.includes('Cargo.toml')) {
    frameworks.add('Rust crate');
  }

  return [...frameworks].sort();
}

export function findConfigs(files: string[]): Evidence[] {
  const configPatterns = [
    /^package\.json$/,
    /^tsconfig\.json$/,
    /^pyproject\.toml$/,
    /^go\.mod$/,
    /^Cargo\.toml$/,
    /^Dockerfile$/,
    /^\.github\/workflows\/.+\.ya?ml$/,
    /^\.env\.example$/,
    /^eslint\.config\./,
    /^vitest\.config\./
  ];

  return files
    .filter((file) => configPatterns.some((pattern) => pattern.test(file)))
    .map((file) => ({ path: file }));
}

export function findConventions(files: string[]): Evidence[] {
  return files
    .filter((file) => /(^|\/)(AGENTS|CLAUDE|CONTRIBUTING|README|SECURITY)\.md$/i.test(file))
    .map((file) => ({ path: file }));
}

export function findEntryPoints(files: string[]): Evidence[] {
  const patterns = [
    /^src\/index\.(ts|js)$/,
    /^src\/cli\.(ts|js)$/,
    /^src\/main\.(ts|js|py)$/,
    /^index\.(ts|js)$/,
    /^bin\//,
    /^app\//,
    /^pages\//,
    /^cmd\//
  ];

  return files
    .filter((file) => patterns.some((pattern) => pattern.test(file)))
    .slice(0, 12)
    .map((file) => ({ path: file }));
}

export function findRisks(files: string[]): Evidence[] {
  const risks: Evidence[] = [];
  if (files.some((file) => file.includes('migrations/'))) {
    risks.push({ path: 'migrations/', detail: 'database migrations can be stateful' });
  }
  if (files.some((file) => file.includes('.github/workflows/'))) {
    risks.push({ path: '.github/workflows/', detail: 'CI/release automation changes can affect publishing' });
  }
  if (files.includes('Dockerfile') || files.some((file) => file.startsWith('deploy/'))) {
    risks.push({ path: 'Dockerfile/deploy', detail: 'deployment surface detected' });
  }
  if (files.some((file) => /secret|credential|token/i.test(file))) {
    risks.push({ path: '.', detail: 'secret-like filename detected; inspect before sharing output' });
  }
  return risks;
}

export function findGaps(files: string[], commands: Evidence[]): Evidence[] {
  const gaps: Evidence[] = [];
  if (!files.some((file) => /^README\.md$/i.test(file))) {
    gaps.push({ path: 'README.md', detail: 'missing top-level README' });
  }
  if (!files.some((file) => /^AGENTS\.md$/i.test(file))) {
    gaps.push({ path: 'AGENTS.md', detail: 'missing agent instructions' });
  }
  if (!files.some((file) => /test|spec|fixtures/i.test(file))) {
    gaps.push({ path: 'tests/', detail: 'no obvious tests or fixtures found' });
  }
  if (commands.length === 0) {
    gaps.push({ path: '.', detail: 'no common runnable commands detected' });
  }
  return gaps;
}
