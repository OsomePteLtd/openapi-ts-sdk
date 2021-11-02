import { CancelToken } from 'axios';

export interface SdkOptions {
  baseUrl: string;
  withCredentials?: boolean;
}

export interface RequestOptions {
  cancelToken?: CancelToken;
  arrayFormat?: 'brackets' | 'indices' | 'repeat' | 'comma' | undefined;
}
