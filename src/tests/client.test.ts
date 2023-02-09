import nock from 'nock';
import { join } from 'path';
import tmp from 'tmp';

import { generateSdk } from '..';

let tmpDirResult: tmp.DirResult;

beforeAll(async () => {
  tmpDirResult = tmp.dirSync({ tmpdir: __dirname, unsafeCleanup: true });
  await generateSdk({
    specFiles: [join(__dirname, 'assets', 'openapi-v3', 'petstore.json')],
    outDir: tmpDirResult.name,
  });
});

afterAll(() => {
  tmpDirResult.removeCallback();
});

it('works', () => {
  return import(join(tmpDirResult.name, 'client.ts'))
    .then(async ({ createSdkClient }) => {
      const baseUrl = 'https://example.com';
      const expectedUrl = '/pets/1';
      const getNock = nock(baseUrl).get(expectedUrl).reply(200);
      const sdkClient = createSdkClient({ baseUrl });

      await sdkClient.pets.id(1).get();

      expect(getNock.isDone()).toBeTruthy();
    })
    .catch((e) => console.error(e));
});

it('supports proxied path parameters', () => {
  return import(join(tmpDirResult.name, 'client.ts')).then(
    async ({ createSdkClient }) => {
      const baseUrl = 'https://example.com';
      const expectedUrl = '/pets/1';
      const getNock = nock(baseUrl).get(expectedUrl).reply(200);
      const sdkClient = createSdkClient({ baseUrl });

      await sdkClient.pets(1).get();

      expect(getNock.isDone()).toBeTruthy();
    },
  );
});

it('treats any whitelisted unknown path segment as path parameter', () => {
  return import(join(tmpDirResult.name, 'client.ts')).then(
    async ({ createSdkClient }) => {
      const baseUrl = 'https://example.com';
      const expectedUrl = '/pets/1';
      const getNock = nock(baseUrl).get(expectedUrl).reply(200);
      const sdkClient = createSdkClient({ baseUrl });

      await sdkClient.pets.petId(1).get();

      expect(getNock.isDone()).toBeTruthy();
    },
  );
});

it("doesn't treat known path segments as path parameters", () => {
  return import(join(tmpDirResult.name, 'client.ts')).then(
    async ({ createSdkClient }) => {
      const baseUrl = 'https://example.com';
      const expectedUrl = '/pets';
      const getNock = nock(baseUrl).get(expectedUrl).reply(200);
      const sdkClient = createSdkClient({ baseUrl });

      await sdkClient.pets.get(1);

      expect(getNock.isDone()).toBeTruthy();
    },
  );
});

it('throws on not whitelisted unknown path segments', () => {
  return import(join(tmpDirResult.name, 'client.ts')).then(
    async ({ createSdkClient }) => {
      const baseUrl = 'https://example.com';
      const sdkClient = createSdkClient({ baseUrl });

      expect(() => sdkClient.pets.notWhitelisted(1).get()).toThrowError(
        'Path segment "notWhitelisted" does not exist',
      );
    },
  );
});
