import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import LocaleLayoutClient from './layout-client'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.toolkitpub.com'),
    title: {
      template: '%s - IT Tools Collection',
      default: 'IT Tools Collection - Developer Toolbox'
    },
    description: "Online tools designed for developers, including JSON formatting, text processing, encryption/decryption and other practical tools.",
    keywords: [
      "developer tools", "JSON formatter", "online tools", "text processing", "frontend tools",
      "JSON validator", "JSON to CSV converter", "JSON to YAML", "free developer utilities",
      "web development tools", "API testing tools", "code formatting tools", "developer productivity"
    ],
    authors: [{ name: "ToolkitPub" }],
    creator: "ToolkitPub",
    publisher: "ToolkitPub",
    alternates: {
      languages: {
          en: "https://www.toolkitpub.com",
          zh: "https://www.toolkitpub.com/zh",
          hi: "https://www.toolkitpub.com/hi",
          'x-default': 'https://www.toolkitpub.com',
        },
        canonical: locale === 'en' ? 'https://www.toolkitpub.com' : `https://www.toolkitpub.com/${locale}`,
    },
    openGraph: {
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      url: locale === 'en' ? 'https://www.toolkitpub.com' : `https://www.toolkitpub.com/${locale}`,
      siteName: 'IT Tools Collection',
      title: 'IT Tools Collection - Developer Toolbox',
      description: 'Online tools designed for developers, including JSON formatting, text processing, encryption/decryption and other practical tools.',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'IT Tools Collection - Developer Toolbox',
        },
        {
          url: '/og-image-small.png',
          width: 600,
          height: 315,
          alt: 'IT Tools Collection Tools Preview'
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'IT Tools Collection - Developer Toolbox',
      description: 'Online tools designed for developers, including JSON formatting, text processing, encryption/decryption and other practical tools.',
      images: ['/og-image.png'],
      creator: '@ToolkitPub',
      site: '@ToolkitPub'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    category: 'Technology',
    classification: 'Business',
    other: {
      'google-site-verification': 'ug5B82ON5ecwi32czM2KeTKgiBdpf84aNw93YyYsz68',
      'application/ld+json': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "IT Tools Collection",
        "description": "Online tools collection designed for developers, including JSON formatting, text processing, encryption/decryption and other practical tools.",
        "url": locale === 'en' ? 'https://www.toolkitpub.com' : `https://www.toolkitpub.com/${locale}`,
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "author": {
          "@type": "Organization",
          "name": "ToolkitPub"
        }
      })
    }
  }
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LocaleLayoutClient>{children}</LocaleLayoutClient>
}