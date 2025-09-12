/**
 * IP工具函数库
 * 提供IP地址验证、检测和格式化功能
 */

// IPv4地址正则表达式
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// IPv6地址正则表达式（简化版）
const IPV6_REGEX = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^::1$|^::ffff:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// IPv6完整正则（支持缩写形式）
const IPV6_FULL_REGEX = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

/**
 * IP地址类型枚举
 */
export type IPVersion = 'IPv4' | 'IPv6' | 'Invalid';

/**
 * 验证IPv4地址格式
 * @param ip IP地址字符串
 * @returns 是否为有效的IPv4地址
 */
export function validateIPv4(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  return IPV4_REGEX.test(ip.trim());
}

/**
 * 验证IPv6地址格式
 * @param ip IP地址字符串
 * @returns 是否为有效的IPv6地址
 */
export function validateIPv6(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const trimmedIp = ip.trim();
  return IPV6_REGEX.test(trimmedIp) || IPV6_FULL_REGEX.test(trimmedIp);
}

/**
 * 检测IP地址的版本类型
 * @param ip IP地址字符串
 * @returns IP地址版本类型
 */
export function getIPVersion(ip: string): IPVersion {
  if (!ip || typeof ip !== 'string') return 'Invalid';
  
  const trimmedIp = ip.trim();
  
  if (validateIPv4(trimmedIp)) {
    return 'IPv4';
  }
  
  if (validateIPv6(trimmedIp)) {
    return 'IPv6';
  }
  
  return 'Invalid';
}

/**
 * 验证IP地址（支持IPv4和IPv6）
 * @param ip IP地址字符串
 * @returns 是否为有效的IP地址
 */
export function validateIP(ip: string): boolean {
  return getIPVersion(ip) !== 'Invalid';
}

/**
 * 格式化IP地址（去除首尾空格）
 * @param ip IP地址字符串
 * @returns 格式化后的IP地址
 */
export function formatIP(ip: string): string {
  if (!ip || typeof ip !== 'string') return '';
  return ip.trim();
}

/**
 * 检查是否为私有IP地址
 * @param ip IP地址字符串
 * @returns 是否为私有IP
 */
export function isPrivateIP(ip: string): boolean {
  if (!validateIPv4(ip)) return false;
  
  const parts = ip.split('.').map(Number);
  
  // 10.0.0.0 - 10.255.255.255
  if (parts[0] === 10) return true;
  
  // 172.16.0.0 - 172.31.255.255
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  
  // 192.168.0.0 - 192.168.255.255
  if (parts[0] === 192 && parts[1] === 168) return true;
  
  // 127.0.0.0 - 127.255.255.255 (本地回环)
  if (parts[0] === 127) return true;
  
  return false;
}

/**
 * 检查是否为本地IP地址
 * @param ip IP地址字符串
 * @returns 是否为本地IP
 */
export function isLocalIP(ip: string): boolean {
  if (!ip) return false;
  
  const trimmedIp = ip.trim();
  
  // IPv4本地地址
  if (trimmedIp === '127.0.0.1' || trimmedIp === '0.0.0.0') return true;
  
  // IPv6本地地址
  if (trimmedIp === '::1' || trimmedIp === '::') return true;
  
  return false;
}

/**
 * 生成示例IP地址
 * @returns 示例IP地址数组
 */
export function getExampleIPs(): string[] {
  return [
    '8.8.8.8',
    '1.1.1.1', 
    '208.67.222.222',
    '114.114.114.114',
    '2001:4860:4860::8888',
    '2606:4700:4700::1111'
  ];
}

/**
 * IP地址掩码
 * @param ip IP地址
 * @param showLast 显示最后几位（用于隐私保护）
 * @returns 掩码后的IP地址
 */
export function maskIP(ip: string, showLast: number = 1): string {
  if (!validateIP(ip)) return ip;
  
  const version = getIPVersion(ip);
  
  if (version === 'IPv4') {
    const parts = ip.split('.');
    if (showLast >= parts.length) return ip;
    
    for (let i = 0; i < parts.length - showLast; i++) {
      parts[i] = '***';
    }
    return parts.join('.');
  }
  
  if (version === 'IPv6') {
    const parts = ip.split(':');
    if (showLast >= parts.length) return ip;
    
    for (let i = 0; i < parts.length - showLast; i++) {
      parts[i] = '****';
    }
    return parts.join(':');
  }
  
  return ip;
}