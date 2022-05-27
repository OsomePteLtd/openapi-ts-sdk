import axios, { AxiosRequestConfig, AxiosError } from 'axios';

import { RequestOptions, SdkOptions } from './options';
import { SdkRequester } from './requester';
import * as types from './types';

export function createSdkClient(options: SdkOptions) {
  const requester = new SdkRequester(options);
  return {
    setAuthToken(authToken: string | undefined) {
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
    contentToReplace: types.schemas, // content-to-replace
  };
}

export type SdkClient = ReturnType<typeof createSdkClient>;

export const CancelToken = axios.CancelToken;
export const isCancel = axios.isCancel;
