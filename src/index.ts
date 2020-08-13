import fs from 'fs';
import { join } from 'path';

import { writeClient } from './clientWriter';
import { writeSchemas } from './schemaWriter';
import { readSpecFromFiles } from './specReader';
import { writeTypes } from './typeWriter';

export async function generateSdk(specFiles: string[], outDir: string) {
  const spec = readSpecFromFiles(specFiles);
  copyTemplate(outDir);
  await writeClient(spec, join(outDir, 'client.ts'));
  await writeTypes(spec, join(outDir, 'types.ts'));
  await writeSchemas(spec, join(outDir, 'schemas.ts'));
}

// private

function copyTemplate(outDir: string) {
  const templateDir = join(__dirname, '..', 'template');
  const files = fs.readdirSync(templateDir);
  for (const file of files) {
    fs.copyFileSync(join(templateDir, file), join(outDir, file));
  }
}
