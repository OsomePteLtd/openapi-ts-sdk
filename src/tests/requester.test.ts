import nock from 'nock';

import { SdkRequester } from '../../template/requester';

describe('get', () => {
  it('serializes params correctly', async () => {
    const baseUrl = 'https://example.com';
    const requester = new SdkRequester({ baseUrl });
    const expectedUrl = encodeURI(
      '/path?filter[companyId]=1234&filter[status][]=active&filter[status][]=inactive',
    );
    const getNock = nock(baseUrl).get(expectedUrl).reply(200);
    await requester.get('/path', {
      filter: {
        companyId: 1234,
        status: ['active', 'inactive'],
      },
    });
    expect(getNock.isDone()).toBeTruthy();
  });
});
