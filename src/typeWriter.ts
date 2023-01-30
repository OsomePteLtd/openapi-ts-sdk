import fs from 'fs';
import { camelCase, uniq } from 'lodash';

import { format } from './formatter';
import { SdkSpec } from './specReader';
import { clone } from './helpers';
import dtsgenerator, { SchemaId, Schema } from 'dtsgenerator';
import { isV2, isV3 } from './specVersion';

export async function writeTypes(spec: SdkSpec, fileName: string) {
  const { openApiVersion } = spec;
  const definitions = clone(spec.definitions);
  let tsTypes = '';
  if (isV2(openApiVersion)) {
    tsTypes = await dtsgenerator({
      contents: [createOpenApi2Schema(definitions)],
    });
  } else if (isV3(openApiVersion)) {
    tsTypes = await dtsgenerator({
      contents: [createOpenApi3Schema(definitions)],
    });
  }
  tsTypes = exportAllTypes(tsTypes);
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

function createOpenApi2Schema(definitions: any): Schema {
  return {
    id: SchemaId.empty,
    type: 'Draft04',
    content: {
      definitions: dereferences(definitions, 'id'),
    } as any,
  };
}

function createOpenApi3Schema(definitions: any): Schema {
  return {
    id: SchemaId.empty,
    type: 'Draft07',
    content: {
      definitions: dereferences(definitions, '$id'),
    } as any,
  };
}

function dereferences(definitions: any, idKey: '$id' | 'id') {
  for (const name in definitions) {
    const schema = definitions[name];
    fixRef(schema);
    schema[idKey] = name;
  }
  return definitions;
}

function fixRef(obj: any) {
  for (const key in obj) {
    if (key === '$ref') {
      obj['$ref'] = obj['$ref'].split('/').pop();
    } else if (typeof obj[key] === 'object') {
      fixRef(obj[key]);
    }
  }
}
