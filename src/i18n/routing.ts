import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['zh', 'en'],

  // Used when no locale matches
  defaultLocale: 'en',
  localePrefix: "as-needed", // 默认语言不显示前缀，其他语言显示前缀
  // 禁用浏览器语言检测，强制使用默认语言
  localeDetection: false
});

