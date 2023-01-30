import fs from 'fs';

import { format } from './formatter';
import { clone, isNameValid } from './helpers';
import { SdkSpec } from './specReader';

export async function writeSchemas(options: {
  spec: SdkSpec;
  fileName: string;
  prefix?: string;
  typedSchemas?: boolean;
}) {
  const { spec, fileName, typedSchemas } = options;
  const prefix = options.prefix || 'default';
  const definitions = clone(spec.definitions);
  const names = Object.keys(definitions).filter(isNameValid);
  const lines = [];
  if (typedSchemas) {
    lines.push(`import { JSONSchema6 } from 'json-schema';`);
    lines.push(`import * as types from './types';`);
    lines.push(
      `export interface SdkSchema<T> extends JSONSchema6 { _type?: T }`,
    );
  }
  lines.push(`export const schemas = {`);
  names.forEach((name) => {
    const schemaType = typedSchemas ? `SdkSchema<types.${name}>` : 'any';
    lines.push(`${name}: {} as ${schemaType},`);
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
  lines.push(
    `schemas[name as keyof typeof schemas].$id = '${prefix}_' + name;`,
  );
  lines.push(`});`);
  const ts = lines.join('\n');
  const postProcessed = deref(ts);
  const formatted = await format(postProcessed);
  fs.writeFileSync(fileName, formatted);
}

// private

function deref(input: string) {
  return input.replace(
    /{"\$ref":"#\/(definitions|components\/schemas)\/(.+?)"}/gm,
    (fullMatch, _, name) => {
      return isNameValid(name) ? `schemas.${name}` : fullMatch;
    },
  );
}
