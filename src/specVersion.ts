export enum OpenApiVersion {
  v2,
  v3,
}

export function getOpenApiVersionFromSpec(spec: any) {
  let ver = '';
  if ('openapi' in spec) {
    ver = spec.openapi;
  } else if ('swagger' in spec) {
    ver = spec.swagger;
  }
  return getVersionValue(ver);
}

// private

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
