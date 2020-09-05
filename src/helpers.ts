import { camelCase, upperFirst } from 'lodash';

export function clone<T>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}

export function isNameValid(name: string) {
  return /^[a-z0-9_]+$/i.test(name);
}

export function pascalCase(s: string) {
  return upperFirst(camelCase(s));
}
