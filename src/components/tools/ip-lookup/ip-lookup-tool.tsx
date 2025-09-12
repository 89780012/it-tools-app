'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { IPInfo, IPAPIError, getIPInfo } from '@/lib/ip-api';
import IPInputSection from './ip-input-section';
import IPResultSection from './ip-result-section';

export default function IPLookupTool() {
  const t = useTranslations('tools.ip-lookup');
  const [result, setResult] = useState<IPInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = useCallback(async (ip: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const ipInfo = await getIPInfo(ip);
      setResult(ipInfo);
    } catch (err) {
      let errorMessage = t('query_failed');
      
      if (err instanceof IPAPIError) {
        switch (err.code) {
          case 'INVALID_IP':
            errorMessage = t('invalid_ip');
            break;
          case 'RATE_LIMITED':
            errorMessage = t('rate_limited');
            break;
          case 'NETWORK_ERROR':
            errorMessage = t('network_error');
            break;
          case 'TIMEOUT':
            errorMessage = t('network_error');
            break;
          default:
            errorMessage = err.message || t('query_failed');
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Toast notification would go here in a real implementation
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  const handleExport = useCallback(() => {
    if (!result) return;

    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        ip_address: result.query,
        location: {
          country: result.country,
          country_code: result.countryCode,
          region: result.regionName,
          city: result.city,
          postal_code: result.zip,
          latitude: result.lat,
          longitude: result.lon,
          timezone: result.timezone,
        },
        network: {
          isp: result.isp,
          organization: result.org,
          as_number: result.as,
        },
        security: {
          proxy: result.proxy,
          hosting: result.hosting,
          mobile: result.mobile,
        }
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ip-lookup-${result.query}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [result]);

  const handleClear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：输入区域 */}
        <div className="space-y-6">
          <IPInputSection
            onQuery={handleQuery}
            isLoading={isLoading}
          />
        </div>

        {/* 右侧：结果展示 */}
        <div className="space-y-6">
          <IPResultSection
            result={result}
            error={error}
            isLoading={isLoading}
            onCopy={handleCopy}
            onExport={handleExport}
            onClear={handleClear}
          />
        </div>
      </div>

      {/* 移动端单列布局优化 */}
      <style jsx>{`
        @media (max-width: 1023px) {
          .grid-cols-1.lg\\:grid-cols-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}