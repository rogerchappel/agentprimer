#!/usr/bin/env node
import { runCli } from './cli.js';

runCli().then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
    process.stderr.write(`agentprimer: directory not found: ${(error as NodeJS.ErrnoException).path ?? error.message}\n`);
  } else {
    process.stderr.write(`agentprimer: ${error instanceof Error ? error.message : String(error)}\n`);
  }
  process.exitCode = 1;
});
