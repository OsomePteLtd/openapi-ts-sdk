import { CancelToken } from 'axios';

export interface SdkOptions {
  baseUrl: string;
}

export interface RequestOptions {
  cancelToken?: CancelToken;
  arrayFormat?: 'brackets' | 'indices' | 'repeat' | 'comma' | undefined;
  idempotencyKey?: string;
}
