import fs from 'fs';
import { camelCase, uniq } from 'lodash';

import { format } from './formatter';
import { SdkSpec } from './specReader';
import { clone } from './helpers';
import dtsgenerator, { SchemaId, Schema } from 'dtsgenerator';
import * as sw2dts from 'sw2dts';
import { OpenApiVersion } from './specVersion';

export async function writeTypes(spec: SdkSpec, fileName: string) {
  const definitions = clone(spec.definitions);
  let tsTypes = '';
  if (spec.openApiVersion === OpenApiVersion.v2) {
    tsTypes = await sw2dts.convert({ definitions } as any);
  } else if (spec.openApiVersion === OpenApiVersion.v3) {
    tsTypes = await dtsgenerator({
      contents: [createOpenApi3Schema(definitions)],
    });
    tsTypes = exportAllTypes(tsTypes);
  }
  const postProcessed = processEnums(tsTypes);
  const formatted = await format(postProcessed);
  fs.writeFileSync(fileName, formatted);
}

// private

function exportAllTypes(source: string) {
  const regexp = /^declare (.*)/gm;
  return source.replace(regexp, 'export $1');
}

function processEnums(source: string) {
  const regexp = /export type ([a-z0-9_]+) = ((?:(?: \| )?"(?:[^"]*)")+);/gim;
  return source.replace(regexp, (original, name, valueString) => {
    return buildEnum(name, parseEnumValues(valueString)) || original;
  });
}

function parseEnumValues(valueString: string) {
  return valueString
    .split(' | ')
    .map((value) => value.substr(1, value.length - 2));
}

function buildEnum(name: string, values: string[]) {
  if (uniq(values.map(buildEnumKey)).length !== values.length) {
    return undefined;
  }
  const parts = values.map((value) => `${buildEnumKey(value)} = "${value}"`);
  const body = parts.join(',');
  return `export enum ${name} { ${body} }`;
}

function buildEnumKey(value: string) {
  return camelCase(value) || 'empty';
}

function createOpenApi3Schema(definitions: any): Schema {
  return {
    id: new SchemaId(''),
    type: 'Draft07',
    content: {
      definitions: dereferences(definitions),
    } as any,
  };
}

function dereferences(definitions: any) {
  const newDefinitions = JSON.parse(
    JSON.stringify(definitions).replace(/#\/components\/schemas\//g, ''),
  )
  for (const name in newDefinitions) {
    const schema = newDefinitions[name];
    schema['$id'] = name;
  }
  return newDefinitions;
}
