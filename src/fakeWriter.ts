import fs from 'fs';

import { format } from './formatter';
import { clone } from './helpers';
import { SdkSpec } from './specReader';

export async function writeFakes(spec: SdkSpec, fileName: string) {
  const definitions = clone(spec.definitions);
  const names = Object.keys(definitions);
  const lines: string[] = [];
  for (const name of names) {
    const definition = definitions[name];
    if (isFakeRequired(definition)) {
      writeFake(lines, name, definitions[name]);
    }
  }
  const formatted = await format(lines.join('\n'));
  fs.writeFileSync(fileName, formatted);
}

// private

function isFakeRequired(definition: any): boolean {
  return Boolean(definition.properties?.id);
}

function writeFake(lines: string[], name: string, definition: any): void {
  lines.push(`// fake${name}`);
  lines.push(`// ${JSON.stringify(definition)}`);
  lines.push('');
}
