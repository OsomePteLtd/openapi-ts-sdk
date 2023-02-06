import fs from 'fs';
import { camelCase, uniq } from 'lodash';

import { format } from './formatter';
import { SdkSpec } from './specReader';
import { clone } from './helpers';
import dtsgenerator, { SchemaId, Schema, SchemaType } from 'dtsgenerator';
import { isV2, isV3, isV3_1 } from './specVersion';

export async function writeTypes(spec: SdkSpec, fileName: string) {
  const { openApiVersion } = spec;
  const definitions = clone(spec.definitions);
  let dtsTypes = '';
  if (isV2(openApiVersion)) {
    dtsTypes = await dtsgenerator({
      contents: [createOpenApiSchema(definitions, 'Draft04', 'id')],
    });
  } else if (isV3(openApiVersion)) {
    dtsTypes = await dtsgenerator({
      contents: [createOpenApiSchema(definitions, 'Draft07', '$id')],
    });
  } else if (isV3_1(openApiVersion)) {
    dtsTypes = await dtsgenerator({
      contents: [createOpenApiSchema(definitions, '2020-12', '$id')],
    });
  }
  const tsTypes = dts2ts(dtsTypes);
  const postProcessed = processEnums(processObjectInterfaces(tsTypes));
  const formatted = await format(postProcessed);
  fs.writeFileSync(fileName, formatted);
}

// private

function dts2ts(source: string) {
  const regexp = /^declare (.*)/gm;
  return source.replace(regexp, 'export $1');
}

function processObjectInterfaces(source: string) {
  const regexp = /\{\s*\[key: string\]: any;\s*\}/gm;
  return source.replace(regexp, '{}');
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

function createOpenApiSchema(
  definitions: any,
  schemaType: SchemaType,
  idKey: '$id' | 'id',
): Schema {
  return {
    id: SchemaId.empty,
    type: schemaType,
    content: {
      definitions: dereferences(definitions, idKey),
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
