import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // 优化匹配规则，确保正确处理路由
  matcher: [
    // 匹配根路径
    '/',
    // 匹配除了API和静态资源外的所有路径  
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};