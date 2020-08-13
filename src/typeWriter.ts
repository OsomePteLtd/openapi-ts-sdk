import fs from 'fs';
import { camelCase, uniq } from 'lodash';
import * as sw2dts from 'sw2dts';

import { format } from './formatter';
import { clone } from './helpers';
import { SdkSpec } from './specReader';

export async function writeTypes(spec: SdkSpec, fileName: string) {
  const definitions = clone(spec.definitions);
  const dts = await sw2dts.convert({ definitions } as any);
  const postProcessed = processEnums(dts);
  const formatted = await format(postProcessed);
  fs.writeFileSync(fileName, formatted);
}

// private

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
