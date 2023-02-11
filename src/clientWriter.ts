import fs from 'fs';
import { loadTemplate } from './clientTemplateLoader';

import { format } from './formatter';
import { isNameValid } from './helpers';
import { SdkMethod, SdkNode, SdkSpec } from './specReader';

export async function writeClient(spec: SdkSpec, fileName: string) {
  const lines: string[] = [];
  const { headerLines, footerLines } = parseClientSdk();
  lines.push(...headerLines);
  for (const name in spec.methodsRoot.children) {
    writeNode(spec, lines, spec.methodsRoot.children[name]);
  }
  lines.push(...footerLines);
  const formatted = await format(lines.join('\n'));
  fs.writeFileSync(fileName, formatted);
}

// private

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
  const pathParametersToProxy = Object.keys(node.children).filter(
    (k) => node.children[k].isFunction,
  );
  const pathParametersToProxyArray =
    pathParametersToProxy.length > 0
      ? `[${pathParametersToProxy
          .map((p) => `'${p.slice(1, -1)}'`)
          .join(', ')}] as const`
      : null;
  lines.push(
    `${node.name}: ${
      pathParametersToProxyArray
        ? `proxyPathParameter(${pathParametersToProxyArray}, `
        : ''
    }{`,
  );
  writeChildren(spec, lines, node);
  writeMethods(spec, lines, node);
  lines.push(`}${pathParametersToProxyArray ? ')' : ''},`);
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
    lines.push(
      `get(query?: ${queryType}, requestOptions?: RequestOptions): Promise<${responseType}> {`,
    );
    lines.push(
      `return requester.get(\`${method.path}\`, query, requestOptions);`,
    );
  } else {
    const requestType = getTsType(spec, method.requestType);
    const requestTypeWithDefault =
      requestType === 'any' ? 'any = {}' : requestType;
    lines.push(
      `${method.method}(data: ${requestTypeWithDefault}, requestOptions?: RequestOptions): Promise<${responseType}> {`,
    );
    lines.push(
      `return requester.${method.method}(\`${method.path}\`, data, requestOptions);`,
    );
  }
  lines.push(`},`);
}

function getTsType(spec: SdkSpec, type: string | undefined) {
  if (!type || type === 'any' || !spec.definitions[type]) {
    return 'any';
  }
  return `types.${type}`;
}

function parseClientSdk(): {
  headerLines: string[];
  footerLines: string[];
} {
  const fileString = loadTemplate();
  const [header, footer] = fileString.split('\n    // content-to-replace\n');
  if (!header || !footer) {
    throw new Error('Parsing error');
  }
  return {
    headerLines: header.split('\n'),
    footerLines: footer.split('\n'),
  };
}
