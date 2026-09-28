import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import ts from 'typescript';

const source = path.resolve('migrations');
const destination = path.resolve('dist/migrations');
await mkdir(destination, { recursive: true });
for (const file of await readdir(source)) {
  if (!file.endsWith('.ts')) continue;
  const input = await readFile(path.join(source, file), 'utf8');
  const output = ts.transpileModule(input, {
    fileName: file,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  await writeFile(path.join(destination, file.replace(/\.ts$/, '.js')), output.outputText);
}
