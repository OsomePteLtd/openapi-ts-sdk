import fs from 'fs';

import { pascalCase } from './helpers';
import {
  getOpenApiVersion,
  isV2,
  isV3,
  isV3_1,
  OpenApiVersion,
} from './specVersion';

export interface SdkSpec {
  methodsRoot: SdkNode;
  definitions: { [key: string]: object };
  openApiVersion: OpenApiVersion;
}

export type SdkNode = SdkRegularNode | SdkFunctionNode;

export interface SdkBaseNode {
  parent?: SdkNode;
  name: string;
  isFunction: boolean;
  children: { [key: string]: SdkNode };
  methods: { [key: string]: SdkMethod };
}

export interface SdkRegularNode extends SdkBaseNode {
  isFunction: false;
}

export interface SdkFunctionNode extends SdkBaseNode {
  isFunction: true;
  aliases: string[];
}

export interface SdkMethod {
  node: SdkNode;
  method: string;
  path: string;
  requestType?: string;
  responseType?: string;
  queryType?: string;
}

export function readSpecFromFiles(files: string[]) {
  const openApiVersion = getOpenApiVersion(files);
  const resultSpec: SdkSpec = {
    methodsRoot: createRootNode(),
    definitions: {},
    openApiVersion,
  };
  for (const path of files) {
    readSpecFromFile(path, resultSpec);
  }
  return resultSpec;
}

// private

function readSpecFromFile(path: string, resultSpec: SdkSpec) {
  const { openApiVersion } = resultSpec;
  const json = fs.readFileSync(path, 'utf8');
  const sourceSpec = JSON.parse(json);
  if (isV3(openApiVersion) || isV3_1(openApiVersion)) {
    sourceSpec.definitions = sourceSpec.components.schemas;
    delete sourceSpec['components'];
  }
  const urls = Object.keys(sourceSpec.paths);
  for (const url of urls) {
    addUrl(
      sourceSpec,
      url,
      resultSpec.methodsRoot,
      splitUrl(url),
      openApiVersion,
    );
  }
  resultSpec.definitions = {
    ...resultSpec.definitions,
    ...sourceSpec.definitions,
  };
}

function splitUrl(url: string) {
  return url.replace(' (agent)', '').split('/').slice(1);
}

function addUrl(
  spec: any,
  url: string,
  parent: SdkNode,
  path: string[],
  openApiVersion: OpenApiVersion,
) {
  if (path.length === 0) {
    addMethods(spec, url, parent, openApiVersion);
    return;
  }
  const [head, ...tail] = path;
  const { key, isFunction, name } = parsePathSegment(head);
  const node = (parent.children[key] ??= isFunction
    ? createFunctionNode(parent, name)
    : createRegularNode(parent, name));
  if (node.isFunction && !node.aliases.includes(name)) {
    node.aliases.push(name);
  }
  addUrl(spec, url, node, tail, openApiVersion);
}

function parsePathSegment(head: string) {
  const match = head.match(/^\{(.+)\}$/);
  const name = match ? match[1] : head;
  const isFunction = Boolean(match);
  const key = isFunction ? '{}' : name;
  return { key, isFunction, name };
}

function addMethods(
  spec: any,
  url: string,
  node: SdkNode,
  openApiVersion: OpenApiVersion,
) {
  const methodsSpec = spec.paths[url];
  const methods = Object.keys(methodsSpec);
  for (const method of methods) {
    node.methods[method] = createMethod(
      node,
      method,
      methodsSpec[method],
      spec,
      openApiVersion,
    );
  }
}

function createRootNode(): SdkNode {
  return { name: '', isFunction: false, children: {}, methods: {} };
}

function createRegularNode(parent: SdkNode, name: string): SdkRegularNode {
  return {
    parent,
    name,
    isFunction: false,
    children: {},
    methods: {},
  };
}

function createFunctionNode(parent: SdkNode, name: string): SdkFunctionNode {
  return {
    parent,
    name,
    aliases: [name],
    isFunction: true,
    children: {},
    methods: {},
  };
}

function createMethod(
  node: SdkNode,
  method: string,
  methodSpec: any,
  originalSpec: Record<string, any>,
  openApiVersion: OpenApiVersion,
): SdkMethod {
  const path = getMethodPath(node);
  return {
    node,
    method,
    path,
    requestType: getRequestType(
      methodSpec,
      originalSpec,
      method,
      path,
      openApiVersion,
    ),
    responseType: getResponseType(
      methodSpec,
      originalSpec,
      method,
      path,
      openApiVersion,
    ),
    queryType: getQueryType(methodSpec),
  };
}

function getMethodPath(node: SdkNode): string {
  if (!node.parent) {
    return '';
  }
  const prefix = getMethodPath(node.parent);
  return node.isFunction
    ? `${prefix}/\${${node.name}}`
    : `${prefix}/${node.name}`;
}

function getRequestType(
  methodSpec: any,
  originalSpec: Record<string, any>,
  method: string,
  path: string,
  openApiVersion: OpenApiVersion,
) {
  let body = undefined;
  if (isV2(openApiVersion)) {
    const { parameters } = methodSpec;
    body = (parameters || []).find((p: any) => p.name === 'body');
  } else if (isV3(openApiVersion) || isV3_1(openApiVersion)) {
    const { requestBody } = methodSpec;
    body = requestBody?.content['application/json'];
  }
  if (!body) {
    return undefined;
  }
  return getTypeBySchema(body.schema, originalSpec, {
    type: 'request',
    method,
    path,
  });
}

function getResponseType(
  methodSpec: any,
  originalSpec: Record<string, any>,
  method: string,
  path: string,
  openApiVersion: OpenApiVersion,
) {
  const { responses } = methodSpec;
  let schema = undefined;
  if (isV2(openApiVersion)) {
    schema = responses['200']?.schema;
  } else if (isV3(openApiVersion) || isV3_1(openApiVersion)) {
    schema = responses['200']?.content['application/json']?.schema;
  }
  if (!schema) {
    return undefined;
  }
  return getTypeBySchema(schema, originalSpec, {
    type: 'response',
    method,
    path,
  });
}

function getQueryType(methodSpec: any) {
  const { parameters } = methodSpec;
  const query = (parameters || []).find((p: any) => p.name === '...');
  if (!query || !query.description) {
    return undefined;
  }
  const match = String(query.description).match(/^Schema: \[`([a-z0-9_]+)`\]/i);
  if (!match) {
    return undefined;
  }
  return match[1];
}

function getTypeBySchema(
  schema: any,
  originalSpec: Record<string, any>,
  {
    method,
    path,
    type,
  }: {
    method: string;
    path: string;
    type: 'response' | 'request';
  },
) {
  if (!schema.$ref && schema.type === 'object') {
    const nameForSpec = getNameForAutoGeneratedType({ type, method, path });
    const refs = findAllRefs(schema);
    const isCorrect = refs.every(
      (ref) => originalSpec.definitions[replaceRefWithType(ref)],
    );
    if (isCorrect) {
      originalSpec.definitions[nameForSpec] = { ...schema };
      return nameForSpec;
    }
  }
  if (!schema.$ref) {
    return 'any';
  }
  return replaceRefWithType(schema.$ref);
}

function findAllRefs(schema: Record<string, any>) {
  const refs: string[] = [];
  const iterate = (obj: Record<string, any>, stack: string) => {
    for (const property in obj) {
      if (obj.hasOwnProperty(property)) {
        if (typeof obj[property] == 'object') {
          iterate(obj[property] as object, stack + '.' + property);
        } else if (property === '$ref') {
          refs.push(obj[property]);
        }
      }
    }
  };
  iterate(schema, '');
  return refs;
}

function replaceRefWithType(ref: string) {
  return String(ref)
    .replace('#/definitions/', '')
    .replace('#/components/schemas/', '');
}

function getNameForAutoGeneratedType({
  type,
  method,
  path,
}: {
  type: string;
  method: string;
  path: string;
}) {
  const nameFromMethod = pascalCase(method);
  const nameFromPath = path
    .split('/')
    .filter((s) => Boolean(s))
    .map((s) => {
      const extractEntityMatch = s.match(/\$\{(.+)\}/);
      if (extractEntityMatch) {
        return `By${pascalCase(extractEntityMatch[1])}`;
      }
      return pascalCase(s);
    })
    .join('');
  const nameFromType = pascalCase(type);
  return `Ag${nameFromMethod}${nameFromPath}${nameFromType}`;
}
