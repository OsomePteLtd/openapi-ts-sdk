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

type ProxyPathParameters<
  Keys extends readonly string[],
  Spec extends {
    [K in Keys[number]]: (...args: any) => any;
  },
> = Omit<Spec, Keys[number]> &
  MergePathParameters<Keys, Spec> & {
    [K in Keys[number]]: MergePathParameters<Keys, Spec>;
  };

type MergePathParameters<
  Keys extends readonly string[],
  Spec extends {
    [K in Keys[number]]: (...args: any) => any;
  },
> = (
  ...args: Parameters<Spec[Keys[0]]>
) => (Keys[0] extends keyof Spec ? ReturnType<Spec[Keys[0]]> : {}) &
  (Keys[1] extends keyof Spec ? ReturnType<Spec[Keys[1]]> : {}) &
  (Keys[2] extends keyof Spec ? ReturnType<Spec[Keys[2]]> : {});

function proxyPathParameter<
  Keys extends readonly string[],
  Spec extends {
    [K in Keys[number]]: (...args: any) => any;
  },
>(keys: Keys, spec: Spec): ProxyPathParameters<Keys, Spec> {
  const handler = (...args: unknown[]) => {
    const specs = keys.map((k: Keys[number]) => spec[k](...args));
    // TODO: deep merge here
    return Object.assign({}, ...specs);
  };
  return new Proxy(handler, {
    get(target, p) {
      if (typeof p === 'string' && keys.includes(p)) {
        return handler;
      }

      if (Object.hasOwnProperty.call(spec, p)) {
        return (spec as any)[p];
      }

      throw new Error(\`Path segment "\${p.toString()}" does not exist\`);
    },
  }) as any;
}
