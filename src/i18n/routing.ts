import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['zh', 'en', 'hi', 'de'],

  // Used when no locale matches
  defaultLocale: 'en',
  localePrefix: "as-needed", // 默认语言不显示前缀，其他语言显示前缀
  // 开启自动检测客户端环境
  localeDetection: false
});

