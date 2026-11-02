#!/usr/bin/env node
import { spawn } from 'node:child_process';

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', env });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is required');
  if (!apiToken) throw new Error('CLOUDFLARE_API_TOKEN is required');

  console.log('[deploy] Building and deploying the full-stack CERA Worker...');
  await run('pnpm', ['--filter', 'web', 'run', 'deploy:vinext'], {
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: accountId,
    CLOUDFLARE_API_TOKEN: apiToken,
  });
  console.log('✓ CERA Cloudflare Worker deployment completed.');
}

main().catch((error) => {
  console.error('[deploy] Error:', error.message);
  process.exit(1);
});
