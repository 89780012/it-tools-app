'use server';

import { cookies, headers } from 'next/headers';

import { defaultLocale, Locale, locales } from '@/i18n/config';

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.
const COOKIE_NAME = 'NEXT_LOCALE';

export async function getLocale() {
  const headerList = await headers();
  const nextUrl = headerList.get('next-url') || headerList.get('x-url') || headerList.get('referer') || '';

  let urlLocale: string | undefined;
  try {
    if (nextUrl) {
      const host = headerList.get('host') || 'localhost';
      const proto = headerList.get('x-forwarded-proto') || 'http';
      const url = nextUrl.startsWith('http') ? new URL(nextUrl) : new URL(`${proto}://${host}${nextUrl}`);

      const qp = url.searchParams.get('lang') || url.searchParams.get('locale') || url.searchParams.get('l');
      if (qp && (locales as readonly string[]).includes(qp)) {
        urlLocale = qp;
      }

      if (!urlLocale) {
        const first = url.pathname.split('/').filter(Boolean)[0];
        if (first && (locales as readonly string[]).includes(first)) {
          urlLocale = first;
        }
      }
    }
  } catch {}

  const cookieLocale = (await cookies()).get(COOKIE_NAME)?.value as string | undefined;
  const resolved = (urlLocale || cookieLocale || defaultLocale) as Locale;
  console.log("current get locale :", resolved, " default locale: ", defaultLocale);
  return resolved;
}

export async function setLocale(locale: Locale) {
   console.log("current set locale :" , locale);
  (await cookies()).set(COOKIE_NAME, locale);
}