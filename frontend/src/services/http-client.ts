/**
 * 统一的 HTTP 客户端
 * 提供统一的请求处理、错误处理、认证和拦截器功能
 */

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class HttpClient {
  private config: HttpClientConfig;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = [];
  private responseInterceptors: Array<(response: ApiResponse) => ApiResponse | Promise<ApiResponse>> = [];

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseURL: '',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * 执行请求拦截器
   */
  private async executeRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  /**
   * 执行响应拦截器
   */
  private async executeResponseInterceptors(response: ApiResponse): Promise<ApiResponse> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  /**
   * 构建查询参数
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  }

  /**
   * 将蛇形命名转换为驼峰命名
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * 将驼峰命名转换为蛇形命名
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 递归转换对象的键名从蛇形到驼峰（后端响应 → 前端）
   */
  private convertKeysToCamelCase(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertKeysToCamelCase(item));
    }

    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const camelKey = this.toCamelCase(key);
          converted[camelKey] = this.convertKeysToCamelCase(obj[key]);
        }
      }
      return converted;
    }

    return obj;
  }

  /**
   * 递归转换对象的键名从驼峰到蛇形（前端请求 → 后端）
   */
  private convertKeysToSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertKeysToSnakeCase(item));
    }

    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const snakeKey = this.toSnakeCase(key);
          converted[snakeKey] = this.convertKeysToSnakeCase(obj[key]);
        }
      }
      return converted;
    }

    return obj;
  }

  /**
   * 统一处理API响应数据结构
   * 智能解析嵌套的数据结构，提取实际数据
   */
  private processApiResponse(rawResponse: any): any {
    // 如果响应本身就是数组，直接返回并转换字段命名
    if (Array.isArray(rawResponse)) {
      return {
        success: true,
        data: this.convertKeysToCamelCase(rawResponse),
        status: 200,
        message: 'OK'
      };
    }

    // 如果响应是对象
    if (typeof rawResponse === 'object' && rawResponse !== null) {
      // 检查是否是标准的API响应格式
      if (rawResponse.hasOwnProperty('success') && rawResponse.hasOwnProperty('data')) {
        // 情况1: 标准格式 { success: true, data: [...] }
        return {
          success: rawResponse.success,
          data: this.convertKeysToCamelCase(rawResponse.data),
          status: 200,
          message: rawResponse.message || 'OK'
        };
      }

      // 检查是否是嵌套的响应格式 (httpClient包装的)
      if (rawResponse.data && typeof rawResponse.data === 'object') {
        // 情况2: 嵌套格式 { data: { success: true, data: [...] }, status: 200 }
        if (rawResponse.data.hasOwnProperty('success') && rawResponse.data.hasOwnProperty('data')) {
          return {
            success: rawResponse.data.success,
            data: this.convertKeysToCamelCase(rawResponse.data.data),
            status: rawResponse.status || 200,
            message: rawResponse.message || rawResponse.data.message || 'OK'
          };
        }
        
        // 情况3: 简单嵌套 { data: [...], status: 200 }
        return {
          success: rawResponse.success !== false, // 默认为true，除非明确为false
          data: this.convertKeysToCamelCase(rawResponse.data),
          status: rawResponse.status || 200,
          message: rawResponse.message || 'OK'
        };
      }

      // 情况4: 直接的对象响应，可能包含业务数据
      return {
        success: rawResponse.success !== false,
        data: this.convertKeysToCamelCase(rawResponse),
        status: rawResponse.status || 200,
        message: rawResponse.message || 'OK'
      };
    }

    // 其他情况：包装为标准格式
    return {
      success: true,
      data: rawResponse,
      status: 200,
      message: 'OK'
    };
  }

  /**
   * 核心请求方法
   */
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      // 执行请求拦截器
      const processedConfig = await this.executeRequestInterceptors(config);
      
      // 构建 URL
      let url: URL;
      if (this.config.baseURL) {
        url = new URL(processedConfig.url, this.config.baseURL);
      } else {
        // 当baseURL为空时，使用当前域名
        url = new URL(processedConfig.url, window.location.origin);
      }
      
      if (processedConfig.params) {
        url.search = this.buildQueryString(processedConfig.params);
      }

      // 构建请求选项
      const fetchOptions: RequestInit = {
        method: processedConfig.method || 'GET',
        headers: {
          ...this.config.headers,
          ...processedConfig.headers,
        },
        credentials: 'include',
      };

      // 添加请求体
      if (processedConfig.data) {
        if (processedConfig.data instanceof FormData) {
          fetchOptions.body = processedConfig.data;
          // FormData 会自动设置 Content-Type
          delete (fetchOptions.headers as any)['Content-Type'];
        } else {
          // 将前端驼峰命名转换为后端蛇形命名
          const convertedData = this.convertKeysToSnakeCase(processedConfig.data);
          fetchOptions.body = JSON.stringify(convertedData);
        }
      }

      // 设置超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), processedConfig.timeout || this.config.timeout);
      fetchOptions.signal = controller.signal;

      // 发送请求
      const response = await fetch(url.toString(), fetchOptions);
      clearTimeout(timeoutId);

      // 解析响应
      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // 构建响应对象
      const processedResponse = this.processApiResponse(responseData);
      
      const apiResponse: ApiResponse<T> = {
        data: processedResponse.data,
        status: response.status,
        success: processedResponse.success,
        message: processedResponse.message || response.statusText,
      };

      if (!response.ok) {
        throw new HttpError(
          responseData?.message || response.statusText || 'Request failed',
          response.status,
          responseData
        );
      }

      // 执行响应拦截器
      return await this.executeResponseInterceptors(apiResponse);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpError('Request timeout', 408);
      }
      
      throw new HttpError(
        error instanceof Error ? error.message : 'Unknown error',
        0
      );
    }
  }

  /**
   * GET 请求
   */
  async get<T = any>(url: string, params?: Record<string, any>, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      params,
      ...config,
    });
  }

  /**
   * POST 请求
   */
  async post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config,
    });
  }

  /**
   * PUT 请求
   */
  async put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config,
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config,
    });
  }

  /**
   * PATCH 请求
   */
  async patch<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      ...config,
    });
  }
}

// 创建默认的 HTTP 客户端实例
export const httpClient = new HttpClient();
