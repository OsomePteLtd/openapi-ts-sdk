import fs from 'fs';
import { join } from 'path';
import parseProject from 'tinyspec/lib/parseProject';
import tmp from 'tmp';
import YAML from 'yamljs';

import { writeClient } from '../clientWriter';
import { writeSchemas } from '../schemaWriter';
import { readSpecFromFiles } from '../specReader';
import { writeTypes } from '../typeWriter';

export async function generate(endpoints: string, models: string) {
  const tmpDirTinyspec = tmp.dirSync({ unsafeCleanup: true });
  const tmpDirJson = tmp.dirSync({ unsafeCleanup: true });
  const tmpDirResult = tmp.dirSync({ unsafeCleanup: true });
  fs.copyFileSync(
    join(__dirname, 'assets', 'header.yaml'),
    join(tmpDirTinyspec.name, 'header.yaml'),
  );
  fs.writeFileSync(
    join(tmpDirTinyspec.name, 'endpoints.tinyspec'),
    trimLines(endpoints),
  );
  fs.writeFileSync(
    join(tmpDirTinyspec.name, 'models.tinyspec'),
    trimLines(models),
  );
  const yamlSpec = parseProject(tmpDirTinyspec.name);
  const specPath = join(tmpDirResult.name, 'openapi.json');
  fs.writeFileSync(specPath, JSON.stringify(YAML.parse(yamlSpec), null, 2));
  const spec = readSpecFromFiles([specPath]);
  const clientPath = join(tmpDirResult.name, 'client.ts');
  const typesPath = join(tmpDirResult.name, 'types.ts');
  const schemasPath = join(tmpDirResult.name, 'schemas.ts');
  await writeClient(spec, clientPath);
  await writeTypes(spec, typesPath);
  await writeSchemas(spec, schemasPath);
  const clientSource = fs.readFileSync(clientPath, 'utf8');
  const typesSource = fs.readFileSync(typesPath, 'utf8');
  const schemasSource = fs.readFileSync(schemasPath, 'utf8');
  tmpDirTinyspec.removeCallback();
  tmpDirJson.removeCallback();
  tmpDirResult.removeCallback();
  return { clientSource, typesSource, schemasSource };
}

// private

function trimLines(input: string) {
  const lines = input.split('\n');
  return lines.map((line) => line.trim()).join('\n');
}
