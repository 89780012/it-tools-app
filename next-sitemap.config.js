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
    // 处理工具页面路径
    if (path.includes('/tools/')) {
      return {
        loc: path,
        changefreq: config.changefreq,
        priority: 0.8, // 工具页面优先级更高
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
        alternateRefs: [
          {
            href: `${config.siteUrl}${path}`,
            hreflang: 'en',
          },
          {
            href: `${config.siteUrl}/zh${path}`,
            hreflang: 'zh',
          },
          {
            href: `${config.siteUrl}/hi${path}`,
            hreflang: 'hi',
          },
        ],
      }
    }

    // 处理首页路径
    if (path === '/') {
      return {
        loc: path,
        changefreq: config.changefreq,
        priority: 1.0, // 首页最高优先级
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
        alternateRefs: config.alternateRefs,
      }
    }

    // 默认处理
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    }
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

  // 额外的路径（如果有动态路由）
  additionalPaths: async (config) => {
    const result = []
    
    // 添加工具页面路径
    const tools = [
      'json-formatter',
      'json-to-csv', 
      'json-to-yaml'
    ]

    // 为每个工具页面生成多语言路径
    tools.forEach(tool => {
      // 英文版（默认语言，无前缀）
      result.push({
        loc: `/tools/${tool}`,
        changefreq: 'weekly',
        priority: 0.8,
        alternateRefs: [
          {
            href: `${config.siteUrl}/tools/${tool}`,
            hreflang: 'en',
          },
          {
            href: `${config.siteUrl}/zh/tools/${tool}`,
            hreflang: 'zh',
          },
          {
            href: `${config.siteUrl}/hi/tools/${tool}`,
            hreflang: 'hi',
          },
        ],
      })

      // 中文版
      result.push({
        loc: `/zh/tools/${tool}`,
        changefreq: 'weekly',
        priority: 0.8,
        alternateRefs: [
          {
            href: `${config.siteUrl}/tools/${tool}`,
            hreflang: 'en',
          },
          {
            href: `${config.siteUrl}/zh/tools/${tool}`,
            hreflang: 'zh',
          },
          {
            href: `${config.siteUrl}/hi/tools/${tool}`,
            hreflang: 'hi',
          },
        ],
      })

      // Hindi 版
      result.push({
        loc: `/hi/tools/${tool}`,
        changefreq: 'weekly', 
        priority: 0.8,
        alternateRefs: [
          {
            href: `${config.siteUrl}/tools/${tool}`,
            hreflang: 'en',
          },
          {
            href: `${config.siteUrl}/zh/tools/${tool}`,
            hreflang: 'zh',
          },
          {
            href: `${config.siteUrl}/hi/tools/${tool}`,
            hreflang: 'hi',
          },
        ],
      })
    })

    return result
  },
}