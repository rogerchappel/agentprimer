import type { CommandCandidate } from './types.js';

export function ecosystemCommands(files: string[]): CommandCandidate[] {
  const commands: CommandCandidate[] = [];

  if (files.includes('pyproject.toml')) {
    commands.push({
      name: 'test',
      command: 'python -m pytest',
      confidence: files.some((file) => file.startsWith('tests/')) ? 'medium' : 'low',
      evidence: [{ path: 'pyproject.toml', detail: 'Python project metadata detected' }]
    });
  }

  if (files.includes('go.mod')) {
    commands.push({
      name: 'test',
      command: 'go test ./...',
      confidence: 'high',
      evidence: [{ path: 'go.mod', detail: 'Go module detected' }]
    });
  }

  if (files.includes('Cargo.toml')) {
    commands.push({
      name: 'test',
      command: 'cargo test',
      confidence: 'high',
      evidence: [{ path: 'Cargo.toml', detail: 'Rust crate detected' }]
    });
  }

  return commands;
}
