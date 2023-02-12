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

it('works', async () => {
  const baseUrl = 'https://example.com';
  const getPetNock = nock(baseUrl).get('/pets/1').reply(200);
  const getSiblingsNock = nock(baseUrl).get('/pets/1/siblings').reply(200);
  const sdkClient = await importSdkClient(baseUrl);

  await sdkClient.pets.id(1).get();
  await sdkClient.pets.petId(1).siblings.get();

  expect(getPetNock.isDone()).toBeTruthy();
  expect(getSiblingsNock.isDone()).toBeTruthy();
});

it('supports proxied path parameters', async () => {
  const baseUrl = 'https://example.com';
  const getPetNock = nock(baseUrl).get('/pets/1').reply(200);
  const getSiblingsNock = nock(baseUrl).get('/pets/1/siblings').reply(200);
  const sdkClient = await importSdkClient(baseUrl);

  await sdkClient.pets(1).get();
  await sdkClient.pets(1).siblings.get();

  expect(getPetNock.isDone()).toBeTruthy();
  expect(getSiblingsNock.isDone()).toBeTruthy();
});

it('merges differently named path parameters', async () => {
  const baseUrl = 'https://example.com';
  const getPetNock = nock(baseUrl).get('/pets/1').reply(200);
  const getSiblingsNock = nock(baseUrl).get('/pets/1/siblings').reply(200);
  const sdkClient = await importSdkClient(baseUrl);

  await sdkClient.pets.petId(1).get();
  await sdkClient.pets.id(1).siblings.get();

  expect(getPetNock.isDone()).toBeTruthy();
  expect(getSiblingsNock.isDone()).toBeTruthy();
});

it("doesn't treat known path segments as path parameters", async () => {
  const baseUrl = 'https://example.com';
  const getNock = nock(baseUrl).get('/pets').reply(200);
  const sdkClient = await importSdkClient(baseUrl);

  await sdkClient.pets.get(1);

  expect(getNock.isDone()).toBeTruthy();
});

it('throws on unknown path segments', async () => {
  const baseUrl = 'https://example.com';
  const sdkClient = await importSdkClient(baseUrl);

  expect(() => sdkClient.pets.unknown(1).get()).toThrowError(
    'Path segment "unknown" does not exist',
  );
});

// helpers

async function importSdkClient(baseUrl: string) {
  return import(join(tmpDirResult.name, 'client.ts')).then(
    async ({ createSdkClient }) => {
      const sdkClient = createSdkClient({ baseUrl });
      return sdkClient;
    },
    (error) => {
      console.error(error);
      throw error;
    },
  );
}
