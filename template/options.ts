import { CancelToken } from 'axios';

export interface SdkOptions {
  baseUrl: string;
}

export interface RequestOptions {
  cancelToken?: CancelToken;
}

export interface GetRequestOptions extends RequestOptions {
  arrayFormat?: 'brackets' | 'indices' | 'repeat' | 'comma' | undefined;
}
