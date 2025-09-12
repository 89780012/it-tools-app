import { getTranslations } from 'next-intl/server';
import { ToolContainer } from '@/components/tool-container';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function IPLookupLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools.ip-lookup' });
  
  return (
    <ToolContainer
      title={t('name')}
      description={t('description')}
    >
      {children}
    </ToolContainer>
  );
}