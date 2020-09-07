# OpenAPI TypeScript SDK Generator

This tool allows generating a TypeScript SDK from OpenAPI specification files. This will provide you with fully typed API library to use in a client-side application.

## Install

```bash
npm install -D openapi-ts-sdk
```

You will also need some dependencies used by the generated code:

```bash
npm install -S axios qs
npm install -D @types/qs
```

## Usage sample

```bash
openapi-ts-sdk /path/to/service1/openapi.json /path/to/service2/openapi.json --outDir /path/to/client/sdk
```

This command will take your `openapi.json` files and generate a TypeScript SDK within your client-side project. You will then be able to `import` it in your code:

```ts
import { createSdkClient } from '../sdk';

const sdk = createSdkClient({
  baseUrl: process.env.API_URL,
});

const { company } = await sdk.companies.id(9526).get();
console.log(company);
```
