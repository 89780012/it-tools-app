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
    description: "All-in-one online developer tools collection with 30+ utilities: JSON formatter/converter/visualizer, Base64/URL encoder-decoder, MD5/SHA256/AES/RSA encryption, QR code generator, UUID generator, Cron parser, Docker run to compose converter, IP lookup, timestamp converter. Completely free, no installation required, multi-language support.",
    keywords: [
      "online developer tools", "JSON formatter", "JSON to CSV", "JSON to YAML", "JSON to XML", "JSON visualizer",
      "Base64 encoder decoder", "URL encoder decoder", "encryption tools", "MD5 hash generator", "SHA256 hash", "AES encryption", "RSA encryption", "HMAC generator",
      "QR code generator", "UUID generator", "password generator", "Cron expression parser", "Docker tools", "Docker run to compose",
      "IP address lookup", "timestamp converter", "color converter", "icon designer", "SVG placeholder generator", "Curl converter",
      "developer toolbox", "programmer tools", "frontend tools", "free online tools", "web development tools", "API testing tools",
      "hex encoder decoder", "binary encoder decoder", "time converter", "image tools", "crypto tools"
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
      description: 'All-in-one online developer tools collection with 30+ utilities: JSON formatter/converter/visualizer, Base64/URL encoder-decoder, MD5/SHA256/AES/RSA encryption, QR code generator, UUID generator, Cron parser, Docker run to compose converter, IP lookup, timestamp converter. Completely free, no installation required, multi-language support.',
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
      description: 'All-in-one online developer tools collection with 30+ utilities: JSON formatter/converter/visualizer, Base64/URL encoder-decoder, MD5/SHA256/AES/RSA encryption, QR code generator, UUID generator, Cron parser, Docker run to compose converter, IP lookup, timestamp converter. Completely free, no installation required.',
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
        "description": "All-in-one online developer tools collection with 30+ utilities including JSON formatter/converter/visualizer, Base64/URL encoder-decoder, MD5/SHA256/AES/RSA encryption, QR code generator, UUID generator, Cron parser, Docker run to compose converter, IP lookup, and timestamp converter. Completely free with multi-language support.",
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