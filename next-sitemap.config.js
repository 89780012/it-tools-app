/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://your-domain.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'weekly',
  priority: 0.7,
  
  // 多语言配置
  alternateRefs: [
    {
      href: process.env.SITE_URL || 'https://your-domain.com',
      hreflang: 'en',
    },
    {
      href: `${process.env.SITE_URL || 'https://your-domain.com'}/zh`,
      hreflang: 'zh',
    },
    {
      href: `${process.env.SITE_URL || 'https://your-domain.com'}/hi`,
      hreflang: 'hi',
    },
  ],

  // 自定义转换函数，处理多语言路由
  transform: async (config, path) => {
    // 处理多语言路径
    const alternateRefs = config.alternateRefs.map((alt) => {
      let hrefPath = path;
      // 如果是非默认语言路径，需要调整
      if (alt.hreflang !== 'en') {
        hrefPath = `/${alt.hreflang}${path}`;
      }
      return {
        href: `${alt.href}${hrefPath}`,
        hreflang: alt.hreflang,
      };
    });

    return {
      loc: `${config.siteUrl}${path}`,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs,
    };
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: '/api/',
      },
    ],
    additionalSitemaps: [
      `${process.env.SITE_URL || 'https://your-domain.com'}/sitemap.xml`,
    ],
  },

  // 排除不需要的路径
  exclude: [
    '/api/*',
    '/server-sitemap.xml',
    '/_next/*',
    '/admin/*',
  ],
}