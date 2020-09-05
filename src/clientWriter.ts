import fs from 'fs';

import { format } from './formatter';
import { isNameValid } from './helpers';
import { SdkMethod, SdkNode, SdkSpec } from './specReader';

export async function writeClient(spec: SdkSpec, fileName: string) {
  const lines: string[] = [];
  writeHeader(lines);
  for (const name in spec.methodsRoot.children) {
    writeNode(spec, lines, spec.methodsRoot.children[name]);
  }
  writeFooter(lines);
  const formatted = await format(lines.join('\n'));
  fs.writeFileSync(fileName, formatted);
}

// private

function writeHeader(lines: string[]) {
  lines.push(`import { AxiosRequestConfig, AxiosError } from 'axios';`);
  lines.push(``);
  lines.push(`import { SdkOptions } from './options';`);
  lines.push(`import { SdkRequester } from './requester';`);
  lines.push(`import * as types from './types';`);
  lines.push(``);
  lines.push(`export function createSdkClient(options: SdkOptions) {`);
  lines.push(`const requester = new SdkRequester(options);`);
  lines.push(`return {`);
  lines.push(`setAuthToken(authToken: string | undefined) {`);
  lines.push(`requester.setAuthToken(authToken);`);
  lines.push(`},`);
  lines.push(`setErrorHandler(handler: (error: AxiosError) => void) {`);
  lines.push(`requester.setErrorHandler(handler);`);
  lines.push(`},`);
  lines.push(`get(path: string, query?: object) {`);
  lines.push(`return requester.get(path, query);`);
  lines.push(`},`);
  lines.push(`post(path: string, data?: object) {`);
  lines.push(`return requester.post(path, data);`);
  lines.push(`},`);
  lines.push(`put(path: string, data?: object) {`);
  lines.push(`return requester.put(path, data);`);
  lines.push(`},`);
  lines.push(`patch(path: string, data?: object) {`);
  lines.push(`return requester.patch(path, data);`);
  lines.push(`},`);
  lines.push(`delete(path: string, data?: object) {`);
  lines.push(`return requester.delete(path, data);`);
  lines.push(`},`);
  lines.push(`request(options: AxiosRequestConfig) {`);
  lines.push(`return requester.request(options);`);
  lines.push(`},`);
}

function writeFooter(lines: string[]) {
  lines.push(`};`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export type SdkClient = ReturnType<typeof createSdkClient>;`);
}

function writeNode(spec: SdkSpec, lines: string[], node: SdkNode) {
  const nodeWithValidName = {
    ...node,
    name: node.name.replace(/-/g, '_'),
  };
  if (!isNameValid(nodeWithValidName.name)) {
    return;
  }
  if (node.isFunction) {
    writeFunctionNode(spec, lines, nodeWithValidName);
  } else {
    writeRegularNode(spec, lines, nodeWithValidName);
  }
}

function writeRegularNode(spec: SdkSpec, lines: string[], node: SdkNode) {
  lines.push(`${node.name}: {`);
  writeChildren(spec, lines, node);
  writeMethods(spec, lines, node);
  lines.push(`},`);
}

function writeFunctionNode(spec: SdkSpec, lines: string[], node: SdkNode) {
  lines.push(`${node.name}: (${node.name}: number | string) => ({`);
  writeChildren(spec, lines, node);
  writeMethods(spec, lines, node);
  lines.push(`}),`);
}

function writeChildren(spec: SdkSpec, lines: string[], node: SdkNode) {
  for (const name in node.children) {
    writeNode(spec, lines, node.children[name]);
  }
}

function writeMethods(spec: SdkSpec, lines: string[], node: SdkNode) {
  for (const name in node.methods) {
    writeMethod(spec, lines, node.methods[name]);
  }
}

function writeMethod(spec: SdkSpec, lines: string[], method: SdkMethod) {
  const responseType = getTsType(spec, method.responseType);
  if (method.method === 'get') {
    const queryType = getTsType(spec, method.queryType);
    lines.push(`get(query?: ${queryType}): Promise<${responseType}> {`);
    lines.push(`return requester.get(\`${method.path}\`, query);`);
  } else {
    const requestType = getTsType(spec, method.requestType);
    const requestTypeWithDefault =
      requestType === 'any' ? 'any = {}' : requestType;
    lines.push(
      `${method.method}(data: ${requestTypeWithDefault}): Promise<${responseType}> {`,
    );
    lines.push(`return requester.${method.method}(\`${method.path}\`, data);`);
  }
  lines.push(`},`);
}

function getTsType(spec: SdkSpec, type: string | undefined) {
  if (!type || type === 'any' || !spec.definitions[type]) {
    return 'any';
  }
  return `types.${type}`;
}
