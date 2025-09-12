/**
 * IP API服务
 * 封装ip-api.com接口调用，提供IP地址信息查询功能
 */

import { validateIP } from './ip-utils';

/**
 * IP信息接口定义
 */
export interface IPInfo {
  query: string;           // 查询的IP地址
  status: 'success' | 'fail'; // 查询状态
  message?: string;        // 错误信息（当status为fail时）
  country?: string;        // 国家
  countryCode?: string;    // 国家代码
  region?: string;         // 地区代码
  regionName?: string;     // 地区名称
  city?: string;           // 城市
  zip?: string;           // 邮政编码
  lat?: number;           // 纬度
  lon?: number;           // 经度
  timezone?: string;       // 时区
  isp?: string;           // 网络服务提供商
  org?: string;           // 组织
  as?: string;            // AS号
  proxy?: boolean;        // 是否代理
  hosting?: boolean;      // 是否为托管服务器
  mobile?: boolean;       // 是否为移动网络
}

/**
 * API错误类型
 */
export class IPAPIError extends Error {
  constructor(
    message: string, 
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'IPAPIError';
  }
}

/**
 * API配置
 */
const API_CONFIG = {
  BASE_URL: 'http://ip-api.com/json',
  TIMEOUT: 10000, // 10秒超时
  RATE_LIMIT: 45, // 每分钟45次请求限制
  FIELDS: 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,mobile,query'
} as const;

/**
 * 请求缓存管理
 */
class RequestCache {
  private cache = new Map<string, { data: IPInfo; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  set(key: string, data: IPInfo) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): IPInfo | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * 速率限制管理
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly WINDOW_SIZE = 60 * 1000; // 1分钟窗口

  canMakeRequest(): boolean {
    const now = Date.now();
    // 移除窗口外的请求记录
    this.requests = this.requests.filter(time => now - time < this.WINDOW_SIZE);
    
    return this.requests.length < API_CONFIG.RATE_LIMIT;
  }

  recordRequest() {
    this.requests.push(Date.now());
  }

  getRequestCount(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.WINDOW_SIZE);
    return this.requests.length;
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const oldest = Math.min(...this.requests);
    const resetTime = oldest + this.WINDOW_SIZE;
    return Math.max(0, resetTime - Date.now());
  }
}

// 全局实例
const cache = new RequestCache();
const rateLimiter = new RateLimiter();

/**
 * 构建API URL
 */
function buildApiUrl(ip?: string): string {
  const url = new URL(API_CONFIG.BASE_URL + (ip ? `/${ip}` : ''));
  url.searchParams.set('fields', API_CONFIG.FIELDS);
  return url.toString();
}

/**
 * 发起API请求
 */
async function makeRequest(url: string): Promise<IPInfo> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new IPAPIError(
        `HTTP ${response.status}: ${response.statusText}`,
        'HTTP_ERROR',
        response.status
      );
    }

    const data: IPInfo = await response.json();
    
    // 检查API返回的状态
    if (data.status === 'fail') {
      throw new IPAPIError(
        data.message || 'API查询失败',
        'API_ERROR'
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof IPAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new IPAPIError('请求超时', 'TIMEOUT');
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new IPAPIError('网络连接失败', 'NETWORK_ERROR');
      }
    }

    throw new IPAPIError('未知错误', 'UNKNOWN_ERROR');
  }
}

/**
 * 获取当前用户的IP地址信息
 */
export async function getCurrentIPInfo(): Promise<IPInfo> {
  const cacheKey = 'current-ip';
  
  // 检查缓存
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 检查速率限制
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = Math.ceil(rateLimiter.getTimeUntilReset() / 1000);
    throw new IPAPIError(
      `查询过于频繁，请等待${waitTime}秒后重试`,
      'RATE_LIMITED'
    );
  }

  try {
    rateLimiter.recordRequest();
    const url = buildApiUrl(); // 不传IP参数，获取当前用户IP
    const data = await makeRequest(url);
    
    // 缓存结果
    cache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    if (error instanceof IPAPIError) {
      throw error;
    }
    throw new IPAPIError('获取当前IP信息失败', 'REQUEST_FAILED');
  }
}

/**
 * 查询指定IP地址的信息
 */
export async function getIPInfo(ip: string): Promise<IPInfo> {
  // 验证IP地址格式
  if (!ip || !validateIP(ip)) {
    throw new IPAPIError('无效的IP地址格式', 'INVALID_IP');
  }

  const cacheKey = `ip-${ip}`;
  
  // 检查缓存
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 检查速率限制
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = Math.ceil(rateLimiter.getTimeUntilReset() / 1000);
    throw new IPAPIError(
      `查询过于频繁，请等待${waitTime}秒后重试`,
      'RATE_LIMITED'
    );
  }

  try {
    rateLimiter.recordRequest();
    const url = buildApiUrl(ip);
    const data = await makeRequest(url);
    
    // 缓存结果
    cache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    if (error instanceof IPAPIError) {
      throw error;
    }
    throw new IPAPIError('查询IP信息失败', 'REQUEST_FAILED');
  }
}

/**
 * 批量查询IP信息（注意速率限制）
 */
export async function getBatchIPInfo(ips: string[]): Promise<(IPInfo | IPAPIError)[]> {
  const results: (IPInfo | IPAPIError)[] = [];
  
  for (const ip of ips) {
    try {
      const info = await getIPInfo(ip);
      results.push(info);
      
      // 在批量查询中添加延迟以避免速率限制
      if (ips.indexOf(ip) < ips.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5秒延迟
      }
    } catch (error) {
      results.push(error instanceof IPAPIError ? error : new IPAPIError('查询失败', 'BATCH_ERROR'));
    }
  }
  
  return results;
}

/**
 * 获取API状态信息
 */
export function getAPIStatus() {
  return {
    requestCount: rateLimiter.getRequestCount(),
    rateLimit: API_CONFIG.RATE_LIMIT,
    timeUntilReset: rateLimiter.getTimeUntilReset(),
    canMakeRequest: rateLimiter.canMakeRequest(),
  };
}

/**
 * 清除缓存
 */
export function clearCache() {
  cache.clear();
}

/**
 * 格式化IP信息为可读文本
 */
export function formatIPInfoText(info: IPInfo): string {
  const lines: string[] = [];
  
  if (info.query) lines.push(`IP地址: ${info.query}`);
  if (info.country) lines.push(`国家: ${info.country} (${info.countryCode})`);
  if (info.regionName) lines.push(`地区: ${info.regionName}`);
  if (info.city) lines.push(`城市: ${info.city}`);
  if (info.zip) lines.push(`邮政编码: ${info.zip}`);
  if (info.lat && info.lon) lines.push(`坐标: ${info.lat}, ${info.lon}`);
  if (info.timezone) lines.push(`时区: ${info.timezone}`);
  if (info.isp) lines.push(`ISP: ${info.isp}`);
  if (info.org) lines.push(`组织: ${info.org}`);
  if (info.as) lines.push(`AS号: ${info.as}`);
  
  const flags: string[] = [];
  if (info.proxy) flags.push('代理');
  if (info.hosting) flags.push('托管');
  if (info.mobile) flags.push('移动');
  if (flags.length > 0) lines.push(`标记: ${flags.join(', ')}`);
  
  return lines.join('\n');
}