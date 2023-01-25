import {readFileSync} from 'fs'

export enum OpenApiVersion {
  v2,
  v3,
}

export function getOpenApiVersionFromFiles(files: string[]) {
  const specs = files.map(path => JSON.parse(readFileSync(path, 'utf8')));
  const [firstSpec] = specs;
  const ver = getOpenApiVersionFromSpec(firstSpec);
  if (specs.some((spec) => getOpenApiVersionFromSpec(spec) !== ver)) {
    throw new Error("Specifications should be the same version");
  }
  return ver;
}

export function isV2(ver: OpenApiVersion) {
  return ver === OpenApiVersion.v2;
}

export function isV3(ver: OpenApiVersion) {
  return ver === OpenApiVersion.v3;;
}

// private

function getOpenApiVersionFromSpec(spec: any) {
  let ver = '';
  if ('openapi' in spec) {
    ver = spec.openapi;
  } else if ('swagger' in spec) {
    ver = spec.swagger;
  }
  return getVersionValue(ver);
}

function getVersionValue(input: string) {
  const verWithoutMinor = input.split('.').slice(0, 2).join('.');
  if (verWithoutMinor === '2.0') {
    return OpenApiVersion.v2;
  }
  if (verWithoutMinor === '3.0') {
    return OpenApiVersion.v3;
  }
  throw new Error(`OpenApi version: ${verWithoutMinor} is unsupported`);
}
