import axios, {
  AxiosError,
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
} from 'axios';
import qs from 'qs';

import { RequestOptions, SdkOptions } from './options';

export class SdkRequester {
  private options: SdkOptions;
  private axiosInstance: AxiosInstance;
  private authToken?: string;

  constructor(options: SdkOptions) {
    this.options = options;
    this.axiosInstance = axios.create({ baseURL: options.baseUrl });
  }

  setAuthToken(authToken: string | undefined) {
    this.authToken = authToken;
  }

  setErrorHandler(handler: (error: AxiosError) => void) {
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        handler(error);
        return Promise.reject(error);
      },
    );
  }

  async get(
    path: string,
    query?: object,
    options: RequestOptions = { arrayFormat: 'brackets' },
  ) {
    const { cancelToken, arrayFormat } = options;
    const result = await this.axiosInstance.get(path, {
      params: query,
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat }),
      headers: this.getHeaders(),
      cancelToken,
    });
    return result.data;
  }

  async post(path: string, data?: object, options: RequestOptions = {}) {
    const { cancelToken } = options;
    const result = await this.axiosInstance.post(path, data, {
      headers: this.getHeaders(),
      cancelToken,
    });
    return result.data;
  }

  async put(path: string, data?: object, options: RequestOptions = {}) {
    const { cancelToken } = options;
    const result = await this.axiosInstance.put(path, data, {
      headers: this.getHeaders(),
      cancelToken,
    });
    return result.data;
  }

  async patch(path: string, data?: object, options: RequestOptions = {}) {
    const { cancelToken } = options;
    const result = await this.axiosInstance.patch(path, data, {
      headers: this.getHeaders(),
      cancelToken,
    });
    return result.data;
  }

  async delete(path: string, data?: object, options: RequestOptions = {}) {
    const { cancelToken } = options;
    const result = await this.axiosInstance.delete(path, {
      data,
      headers: this.getHeaders(),
      cancelToken,
    });
    return result.data;
  }

  async head(path: string, data?: object, options: RequestOptions = {}) {
    const { cancelToken } = options;
    const result = await this.axiosInstance.head(path, {
      data,
      headers: this.getHeaders(),
      cancelToken,
    });
    return result.data;
  }

  request(options: AxiosRequestConfig): AxiosPromise<any> {
    return this.axiosInstance({
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });
  }

  // private

  private getHeaders() {
    const headers: { [key: string]: string } = {
      accept: 'application/json',
    };
    if (this.authToken) {
      headers['x-access-token'] = this.authToken;
    }
    return headers;
  }
}
