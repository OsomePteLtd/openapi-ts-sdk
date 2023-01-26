import fs from 'fs';
import { join } from 'path';

import { writeClient } from './clientWriter';
import { writeSchemas } from './schemaWriter';
import { readSpecFromFiles } from './specReader';
import { writeTypes } from './typeWriter';

export async function generateSdk(options: {
  specFiles: string[];
  outDir: string;
  prefix?: string;
  typedSchemas?: boolean;
}) {
  const { specFiles, outDir, prefix, typedSchemas } = options;
  const spec = readSpecFromFiles(specFiles);
  copyTemplate(outDir);
  await writeClient(spec, join(outDir, 'client.ts'));
  await writeTypes(spec, join(outDir, 'types.ts'));
  await writeSchemas({
    spec,
    fileName: join(outDir, 'schemas.ts'),
    prefix,
    typedSchemas,
  });
}

// private
const filesToIgnore = ['sdkClient.ts'];

function copyTemplate(outDir: string) {
  const templateDir = join(__dirname, '..', 'template');
  const files = fs
    .readdirSync(templateDir)
    .filter((file) => !filesToIgnore.includes(file));
  for (const file of files) {
    fs.copyFileSync(join(templateDir, file), join(outDir, file));
  }
}
