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

  it('pass arrayFormat', async () => {
    const baseUrl = 'https://example.com';
    const requester = new SdkRequester({ baseUrl });
    const expectedUrl = encodeURI(
      '/path?periods[0][0]=2020-01-01&periods[0][1]=2020-01-31',
    );
    const getNock = nock(baseUrl).get(expectedUrl).reply(200);
    await requester.get(
      '/path',
      {
        periods: [['2020-01-01', '2020-01-31']],
      },
      { arrayFormat: 'indices' },
    );
    expect(getNock.isDone()).toBeTruthy();
  });
});
