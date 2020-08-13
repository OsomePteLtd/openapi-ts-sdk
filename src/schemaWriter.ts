import fs from 'fs';

import { format } from './formatter';
import { clone, isNameValid } from './helpers';
import { SdkSpec } from './specReader';

export async function writeSchemas(spec: SdkSpec, fileName: string) {
  const definitions = clone(spec.definitions);
  const names = Object.keys(definitions).filter(isNameValid);
  const lines = [];
  lines.push(`export const schemas = {`);
  names.forEach((name) => {
    lines.push(`${name}: {} as any,`);
  });
  lines.push(`}`);
  lines.push(``);
  names.forEach((name) => {
    lines.push(
      `schemas.${name} = Object.assign(schemas.${name}, ${JSON.stringify(
        definitions[name],
      )});`,
    );
    lines.push(``);
  });
  lines.push(`Object.keys(schemas).forEach((name) => {`);
  lines.push(`schemas[name as keyof typeof schemas].$id = name;`);
  lines.push(`});`);
  const ts = lines.join('\n');
  const postProcessed = deref(ts);
  const formatted = await format(postProcessed);
  fs.writeFileSync(fileName, formatted);
}

// private

function deref(input: string) {
  return input.replace(
    /{"\$ref":"#\/definitions\/(.+?)"}/gm,
    (fullMatch, name) => {
      return isNameValid(name) ? `schemas.${name}` : fullMatch;
    },
  );
}
