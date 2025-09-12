'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  MapPin, 
  Wifi, 
  Shield, 
  Clock, 
  Building,
  Navigation,
  Hash
} from 'lucide-react';
import { IPInfo } from '@/lib/ip-api';

interface IPInfoDisplayProps {
  ipInfo: IPInfo;
}

export default function IPInfoDisplay({ ipInfo }: IPInfoDisplayProps) {
  const t = useTranslations('tools.ip-lookup');

  const formatCoordinates = (lat?: number, lon?: number) => {
    if (!lat || !lon) return null;
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  };

  const getCountryFlag = (countryCode?: string) => {
    if (!countryCode) return '🌍';
    
    // 将国家代码转换为旗帜表情符号
    try {
      const flagEmoji = countryCode
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
      return flagEmoji;
    } catch {
      return '🌍';
    }
  };

  const formatBooleanValue = (value?: boolean) => {
    if (value === undefined) return '-';
    return value ? t('info.yes') : t('info.no');
  };

  return (
    <div className="space-y-4">
      {/* 基本信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('info.basic')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-gray-500">
                {t('info.ip_address')}
              </dt>
              <dd className="font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                {ipInfo.query}
              </dd>
            </div>
            
            {ipInfo.country && (
              <div className="space-y-1">
                <dt className="text-sm font-medium text-gray-500">
                  {t('info.country')}
                </dt>
                <dd className="flex items-center gap-2">
                  <span className="text-xl">{getCountryFlag(ipInfo.countryCode)}</span>
                  <span className="text-sm">
                    {ipInfo.country}
                    {ipInfo.countryCode && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {ipInfo.countryCode}
                      </Badge>
                    )}
                  </span>
                </dd>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 地理位置信息 */}
      {(ipInfo.regionName || ipInfo.city || ipInfo.lat) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('info.location')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ipInfo.regionName && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {t('info.region')}
                  </dt>
                  <dd className="text-sm">{ipInfo.regionName}</dd>
                </div>
              )}
              
              {ipInfo.city && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {t('info.city')}
                  </dt>
                  <dd className="text-sm">{ipInfo.city}</dd>
                </div>
              )}
              
              {ipInfo.zip && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {t('info.postal_code')}
                  </dt>
                  <dd className="text-sm font-mono">{ipInfo.zip}</dd>
                </div>
              )}
              
              {ipInfo.timezone && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {t('info.timezone')}
                  </dt>
                  <dd className="text-sm font-mono">{ipInfo.timezone}</dd>
                </div>
              )}
            </div>
            
            {ipInfo.lat && ipInfo.lon && (
              <div className="pt-2 border-t">
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {t('info.latitude')} / {t('info.longitude')}
                  </dt>
                  <dd className="text-sm font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                    {formatCoordinates(ipInfo.lat, ipInfo.lon)}
                  </dd>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 网络信息 */}
      {(ipInfo.isp || ipInfo.org || ipInfo.as) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              {t('info.network')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-4">
              {ipInfo.isp && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {t('info.isp')}
                  </dt>
                  <dd className="text-sm">{ipInfo.isp}</dd>
                </div>
              )}
              
              {ipInfo.org && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    <Building className="h-3 w-3 inline mr-1" />
                    {t('info.organization')}
                  </dt>
                  <dd className="text-sm">{ipInfo.org}</dd>
                </div>
              )}
              
              {ipInfo.as && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    <Hash className="h-3 w-3 inline mr-1" />
                    {t('info.as_number')}
                  </dt>
                  <dd className="text-sm font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                    {ipInfo.as}
                  </dd>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 安全信息 */}
      {(ipInfo.proxy !== undefined || ipInfo.hosting !== undefined || ipInfo.mobile !== undefined) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('info.security')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ipInfo.proxy !== undefined && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {t('info.proxy')}
                  </dt>
                  <dd>
                    <Badge 
                      variant={ipInfo.proxy ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {formatBooleanValue(ipInfo.proxy)}
                    </Badge>
                  </dd>
                </div>
              )}
              
              {ipInfo.hosting !== undefined && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    托管服务器
                  </dt>
                  <dd>
                    <Badge 
                      variant={ipInfo.hosting ? "outline" : "secondary"}
                      className="text-xs"
                    >
                      {formatBooleanValue(ipInfo.hosting)}
                    </Badge>
                  </dd>
                </div>
              )}
              
              {ipInfo.mobile !== undefined && (
                <div className="space-y-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {t('info.mobile')}
                  </dt>
                  <dd>
                    <Badge 
                      variant={ipInfo.mobile ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {formatBooleanValue(ipInfo.mobile)}
                    </Badge>
                  </dd>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}