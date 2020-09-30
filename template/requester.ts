import axios, {
  AxiosError,
  AxiosInstance,
  AxiosPromise,
  AxiosRequestConfig,
} from 'axios';
import qs from 'qs';

import { SdkOptions } from './options';

export class SdkRequester {
  private options: SdkOptions;
  private axiosInstance: AxiosInstance;
  private authToken?: string;

  constructor(options: SdkOptions) {
    this.options = options;
    this.axiosInstance = axios.create();
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

  async get(path: string, query?: object) {
    try {
      const result = await this.axiosInstance.get(
        `${this.options.baseUrl}${path}`,
        {
          params: query,
          paramsSerializer: (params) =>
            qs.stringify(params, { arrayFormat: 'brackets' }),
          headers: this.getHeaders(),
        },
      );
      return result.data;
    } catch (e) {
      throw e;
    }
  }

  async post(path: string, data?: object) {
    const result = await this.axiosInstance.post(
      `${this.options.baseUrl}${path}`,
      data,
      { headers: this.getHeaders() },
    );
    return result.data;
  }

  async put(path: string, data?: object) {
    const result = await this.axiosInstance.put(
      `${this.options.baseUrl}${path}`,
      data,
      { headers: this.getHeaders() },
    );
    return result.data;
  }

  async patch(path: string, data?: object) {
    const result = await this.axiosInstance.patch(
      `${this.options.baseUrl}${path}`,
      data,
      { headers: this.getHeaders() },
    );
    return result.data;
  }

  async delete(path: string, data?: object) {
    const result = await this.axiosInstance.delete(
      `${this.options.baseUrl}${path}`,
      {
        data,
        headers: this.getHeaders(),
      },
    );
    return result.data;
  }

  async head(path: string, data?: object) {
    const result = await this.axiosInstance.head(
      `${this.options.baseUrl}${path}`,
      {
        data,
        headers: this.getHeaders(),
      },
    );
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
    if (!this.authToken) {
      return {};
    }
    return { 'x-access-token': this.authToken };
  }
}
