'use server';

import { cookies } from 'next/headers';

import { defaultLocale, Locale } from '@/i18n/config';

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.
const COOKIE_NAME = 'NEXT_LOCALE';

export async function getLocale() {
  console.log("current get locale :" , (await cookies()).get(COOKIE_NAME)?.value , " default locale: " , defaultLocale);
  return (await cookies()).get(COOKIE_NAME)?.value || defaultLocale;
}

export async function setLocale(locale: Locale) {
   console.log("current set locale :" , locale);
  (await cookies()).set(COOKIE_NAME, locale);
}