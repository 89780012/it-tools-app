import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
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
    default: 'IT Tools Collection - Essential Toolbox for Developers'
  },
  description: "Online tools collection designed for developers, including JSON formatting, text processing, encryption/decryption and other practical tools.",
  keywords: ["developer tools", "JSON formatter", "online tools", "text processing", "frontend tools"],
  authors: [{ name: "ToolkitPub" }],
  creator: "ToolkitPub",
  publisher: "ToolkitPub",
  metadataBase: new URL(process.env.SITE_URL || 'https://www.toolkitpub.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.SITE_URL || 'https://www.toolkitpub.com',
    siteName: 'IT Tools Collection',
    title: 'IT Tools Collection - Essential Toolbox for Developers',
    description: 'Online tools collection designed for developers, including JSON formatting, text processing, encryption/decryption and other practical tools.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'IT Tools Collection - Essential Toolbox for Developers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IT Tools Collection - Essential Toolbox for Developers',
    description: 'Online tools collection designed for developers, including JSON formatting, text processing, encryption/decryption and other practical tools.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  other: {
    'google-site-verification': 'ug5B82ON5ecwi32czM2KeTKgiBdpf84aNw93YyYsz68',
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
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
