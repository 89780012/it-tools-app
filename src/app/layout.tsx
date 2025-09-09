import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import {NextIntlClientProvider} from 'next-intl';
import type { Metadata } from 'next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
  metadataBase: new URL(process.env.SITE_URL || 'https://www.toolkitpub.com'),
  alternates: {
    canonical: '/',
    languages: {
      'zh': '/zh',
      'en': '/',
      'hi': '/hi'
    }
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-16x16.png'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['zh_CN', 'hi_IN'],
    url: process.env.SITE_URL || 'https://www.toolkitpub.com',
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
      "url": process.env.SITE_URL || 'https://www.toolkitpub.com',
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
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            {children}
            <Toaster />
          </NextIntlClientProvider>
      
        </ThemeProvider>
      </body>
    </html>
  );
}
