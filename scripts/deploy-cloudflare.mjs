#!/usr/bin/env node
import { spawn } from 'node:child_process';
import http from 'node:http';

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log('[deploy] Building web package...');
  await run('pnpm', ['--filter', 'web', 'build']);

  console.log('[deploy] Starting local standalone server on port 3005...');
  const server = spawn('node', ['apps/web/.next/standalone/apps/web/server.js'], {
    env: { ...process.env, PORT: '3005' },
    stdio: 'ignore',
  });

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for standalone server'));
      }, 15000);

      function poll() {
        const req = http.get('http://localhost:3005/about', (res) => {
          if (res.statusCode === 200) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(poll, 300);
          }
        });
        req.on('error', () => setTimeout(poll, 300));
      }

      setTimeout(poll, 400);
    });

    console.log('[deploy] Crawling static snapshot for Cloudflare Pages edge...');
    await run('python3', ['scripts/prepare-cloudflare-pages.py']);
  } finally {
    server.kill();
  }

  console.log('[deploy] Publishing to Cloudflare Pages (cera-web)...');
  await run('npx', [
    'wrangler',
    'pages',
    'deploy',
    'apps/web/cf-dist',
    '--project-name=cera-web',
    '--branch=main',
    '--commit-dirty=true',
  ]);

  console.log('✓ Successfully deployed to Cloudflare Pages!');
}

main().catch((err) => {
  console.error('[deploy] Error:', err.message);
  process.exit(1);
});
