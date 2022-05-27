import nock from 'nock';
import axios from 'axios';

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

  it('cancels request', async () => {
    const source = axios.CancelToken.source();
    const cancellationMessage = `cancelled by client`;

    const baseUrl = 'https://example.com';
    const requester = new SdkRequester({ baseUrl });
    const expectedUrl = '/';
    const getNock = nock(baseUrl)
      .get(expectedUrl)
      .delayConnection(2000)
      .reply(200);
    const request = requester.get('/', {}, { cancelToken: source.token });
    source.cancel(`cancelled by client`);

    await expect(request).rejects.toEqual({
      message: cancellationMessage,
    });
    expect(getNock.isDone()).toBeFalsy();
  });

  it('catch request & response interceptors', async () => {
    const baseUrl = 'https://example.com';
    const requester = new SdkRequester({ baseUrl });
    let requestCatched = false,
      responseCatched = false;
    requester.setInterceptors({
      request: {
        onFulfilled: (request) => {
          expect(request.baseURL).toBe(baseUrl);
          requestCatched = true;
          return request;
        },
      },
      response: {
        onFulfilled: (response) => {
          expect(response.status).toBe(200);
          responseCatched = true;
          return response;
        },
      },
    });

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
    expect(requestCatched).toBeTruthy();
    expect(responseCatched).toBeTruthy();
  });
});
