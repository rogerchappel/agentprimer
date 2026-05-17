#!/usr/bin/env node
import { runCli } from './cli.js';

runCli().then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

export { scanRepo } from './scan.js';
export { suggestTask } from './task.js';
export type { RepoPrimer, SuggestedTask } from './types.js';
