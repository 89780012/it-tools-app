import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 修复as-needed模式的匹配规则，确保正确处理分享路由
  matcher: [
    // 匹配根路径
    '/',
    // 匹配所有路径，包括无前缀的share路径和有前缀的语言路径
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};