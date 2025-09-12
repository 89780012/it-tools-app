'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Download, RotateCcw } from 'lucide-react';
import { IPInfo } from '@/lib/ip-api';
import IPInfoDisplay from './ip-info-display';

interface IPResultSectionProps {
  result: IPInfo | null;
  error: string | null;
  isLoading: boolean;
  onCopy: (content: string) => void;
  onExport: () => void;
  onClear: () => void;
}

export default function IPResultSection({
  result,
  error,
  isLoading,
  onCopy,
  onExport,
  onClear
}: IPResultSectionProps) {
  const t = useTranslations('tools.ip-lookup');

  const handleCopyIP = () => {
    if (result?.query) {
      onCopy(result.query);
    }
  };

  const handleCopyAll = () => {
    if (!result) return;

    const info = [
      `${t('info.ip_address')}: ${result.query}`,
      result.country && `${t('info.country')}: ${result.country} (${result.countryCode})`,
      result.regionName && `${t('info.region')}: ${result.regionName}`,
      result.city && `${t('info.city')}: ${result.city}`,
      result.zip && `${t('info.postal_code')}: ${result.zip}`,
      result.lat && result.lon && `${t('info.latitude')}: ${result.lat}, ${t('info.longitude')}: ${result.lon}`,
      result.timezone && `${t('info.timezone')}: ${result.timezone}`,
      result.isp && `${t('info.isp')}: ${result.isp}`,
      result.org && `${t('info.organization')}: ${result.org}`,
      result.as && `${t('info.as_number')}: ${result.as}`,
    ].filter(Boolean).join('\n');

    onCopy(info);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('output_title')}</CardTitle>
          <CardDescription>{t('querying')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">{t('querying')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('output_title')}</CardTitle>
          <CardDescription>{t('query_failed')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="mt-4"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('actions.clear_results')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('output_title')}</CardTitle>
          <CardDescription>{t('output_placeholder')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <div className="space-y-2">
              <div className="text-4xl">🌐</div>
              <p className="text-sm">{t('output_placeholder')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('output_title')}
              <Badge variant="outline" className="font-mono">
                {result.query}
              </Badge>
            </CardTitle>
            <CardDescription>
              {result.country && result.city 
                ? `${result.city}, ${result.country}`
                : t('output_title')
              }
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyIP}
              className="h-8"
            >
              <Copy className="h-3 w-3 mr-1" />
              {t('actions.copy_ip')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="h-8"
            >
              <Copy className="h-3 w-3 mr-1" />
              {t('actions.copy_all')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-8"
            >
              <Download className="h-3 w-3 mr-1" />
              {t('actions.export_json')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <IPInfoDisplay ipInfo={result} />
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('actions.clear_results')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}