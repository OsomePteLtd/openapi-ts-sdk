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

type WithPathParameters<
  Keys extends readonly string[],
  Spec extends { pathParameter: (...args: any) => any },
> = Spec['pathParameter'] &
  Omit<Spec, 'pathParameter'> & {
    [K in Keys[number]]: Spec['pathParameter'];
  };

function withPathParameters<
  Keys extends readonly string[],
  Spec extends { pathParameter: (...args: any) => any },
>(keys: Keys, spec: Spec): WithPathParameters<Keys, Spec> {
  return new Proxy(spec.pathParameter, {
    get(target, key) {
      if (typeof key === 'string' && keys.includes(key)) {
        return spec.pathParameter;
      }

      if (key !== 'pathParameter' && Object.hasOwnProperty.call(spec, key)) {
        return spec[key as keyof Spec];
      }

      throw new Error('Path segment "' + key.toString() + '" does not exist');
    },
  }) as WithPathParameters<Keys, Spec>;
}
