import axios, { AxiosRequestConfig, AxiosError } from 'axios';

import { RequestOptions, SdkOptions } from './options';
import { SdkRequester } from './requester';
import * as types from './types';

export function createSdkClient(options: SdkOptions) {
  const requester = new SdkRequester(options);
  return {
    setAuthToken(authToken: string | undefined | null) {
      requester.setAuthToken(authToken);
    },
    setErrorHandler(handler: (error: AxiosError) => void) {
      requester.setErrorHandler(handler);
    },
    setInterceptors(
      interceptors: Parameters<typeof requester.setInterceptors>[0],
    ) {
      requester.setInterceptors(interceptors);
    },
    get(path: string, query?: object, requestOptions?: RequestOptions) {
      return requester.get(path, query, requestOptions);
    },
    post(path: string, data?: object, requestOptions?: RequestOptions) {
      return requester.post(path, data, requestOptions);
    },
    put(path: string, data?: object, requestOptions?: RequestOptions) {
      return requester.put(path, data, requestOptions);
    },
    patch(path: string, data?: object, requestOptions?: RequestOptions) {
      return requester.patch(path, data, requestOptions);
    },
    delete(path: string, data?: object, requestOptions?: RequestOptions) {
      return requester.delete(path, data, requestOptions);
    },
    request(options: AxiosRequestConfig) {
      return requester.request(options);
    },
    // content-to-replace
  };
}

export type SdkClient = ReturnType<typeof createSdkClient>;

export const CancelToken = axios.CancelToken;
export const isCancel = axios.isCancel;

type ProxyPathParameter<
  Key extends string,
  T extends { [K in Key]: (...args: any) => any },
> = T & T[Key] & { [K in \`\${string}\${'id' | 'Id' | 'ID'}\`]: T[Key] };

function proxyPathParameter<
  Key extends string,
  T extends { [K in Key]: (...args: any) => any },
>(key: Key, node: T): ProxyPathParameter<Key, T> {
  const handler = node[key];
  return new Proxy(handler, {
    get(target, p) {
      if (Object.hasOwnProperty.call(node, p)) {
        return (node as any)[p];
      }

      if (
        typeof p === 'string' &&
        !p.endsWith('id') &&
        !p.endsWith('Id') &&
        !p.endsWith('ID')
      ) {
        throw new Error(\`Path segment "\${p}" does not exist\`);
      }

      return handler;
    },
  }) as ProxyPathParameter<Key, T>;
}
