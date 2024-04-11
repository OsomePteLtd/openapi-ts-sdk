import fs from 'fs';
import { join } from 'path';
import parseProject from 'tinyspec/lib/parseProject';
import tmp from 'tmp';
import YAML from 'yamljs';

import { generateSdk } from '..';

export async function generate(options: {
  endpoints: string;
  models: string;
  prefix?: string;
  typedSchemas?: boolean;
}) {
  const { endpoints, models, prefix, typedSchemas } = options;
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
  const specPath = join(tmpDirJson.name, 'openapi.json');
  fs.writeFileSync(specPath, JSON.stringify(YAML.parse(yamlSpec), null, 2));
  await generateSdk({
    specFiles: [specPath],
    outDir: tmpDirResult.name,
    prefix,
    typedSchemas,
  });
  const clientPath = join(tmpDirResult.name, 'client.ts');
  const typesPath = join(tmpDirResult.name, 'types.ts');
  const schemasPath = join(tmpDirResult.name, 'schemas.ts');
  const fakesPath = join(tmpDirResult.name, 'fakes.ts');
  const clientSource = fs.readFileSync(clientPath, 'utf8');
  const typesSource = fs.readFileSync(typesPath, 'utf8');
  const schemasSource = fs.readFileSync(schemasPath, 'utf8');
  const fakesSource = fs.readFileSync(fakesPath, 'utf8');
  tmpDirTinyspec.removeCallback();
  tmpDirJson.removeCallback();
  tmpDirResult.removeCallback();
  return { clientSource, typesSource, schemasSource, fakesSource };
}

export async function generateFromOpenApiSpecs(options: {
  files: string[];
  prefix?: string;
  typedSchemas?: boolean;
}) {
  const { files, prefix, typedSchemas } = options;
  const tmpDirResult = tmp.dirSync({ unsafeCleanup: true });
  await generateSdk({
    specFiles: [...files],
    outDir: tmpDirResult.name,
    prefix,
    typedSchemas,
  });
  const clientPath = join(tmpDirResult.name, 'client.ts');
  const typesPath = join(tmpDirResult.name, 'types.ts');
  const schemasPath = join(tmpDirResult.name, 'schemas.ts');
  const clientSource = fs.readFileSync(clientPath, 'utf8');
  const typesSource = fs.readFileSync(typesPath, 'utf8');
  const schemasSource = fs.readFileSync(schemasPath, 'utf8');
  tmpDirResult.removeCallback();
  return { clientSource, typesSource, schemasSource };
}

// private

function trimLines(input: string) {
  const lines = input.split('\n');
  return lines.map((line) => line.trim()).join('\n');
}
