'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, Eye } from 'lucide-react';
import { validateIP, getIPVersion, getExampleIPs } from '@/lib/ip-utils';
import { getCurrentIPInfo, IPInfo, IPAPIError } from '@/lib/ip-api';

interface IPInputSectionProps {
  onQuery: (ip: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function IPInputSection({ onQuery, isLoading, disabled = false }: IPInputSectionProps) {
  const t = useTranslations('tools.ip-lookup');
  const [inputValue, setInputValue] = useState('');
  const [currentIP, setCurrentIP] = useState<IPInfo | null>(null);
  const [currentIPLoading, setCurrentIPLoading] = useState(false);
  const [currentIPError, setCurrentIPError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const detectCurrentIP = useCallback(async () => {
    setCurrentIPLoading(true);
    setCurrentIPError(null);
    
    try {
      const ipInfo = await getCurrentIPInfo();
      setCurrentIP(ipInfo);
    } catch (error) {
      const errorMsg = error instanceof IPAPIError 
        ? error.message 
        : t('network_error');
      setCurrentIPError(errorMsg);
      console.error('Failed to get current IP:', error);
    } finally {
      setCurrentIPLoading(false);
    }
  }, [t]);

  // 自动获取当前用户IP
  useEffect(() => {
    detectCurrentIP();
  }, [detectCurrentIP]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setInputError(null);
  };

  const handleQuery = () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) {
      setInputError(t('invalid_ip'));
      return;
    }

    if (!validateIP(trimmedValue)) {
      setInputError(t('invalid_ip'));
      return;
    }

    setInputError(null);
    onQuery(trimmedValue);
  };

  const handleCurrentIPQuery = () => {
    if (currentIP?.query) {
      setInputValue(currentIP.query);
      onQuery(currentIP.query);
    }
  };

  const handleExampleClick = (exampleIP: string) => {
    setInputValue(exampleIP);
    setInputError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && !disabled) {
      handleQuery();
    }
  };

  const getIPVersionColor = (ip: string) => {
    const version = getIPVersion(ip);
    switch (version) {
      case 'IPv4': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'IPv6': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const exampleIPs = getExampleIPs();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {t('input_title')}
        </CardTitle>
        <CardDescription>
          {t('placeholder')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前IP显示 */}
        {currentIPLoading ? (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">{t('querying')}</span>
          </div>
        ) : currentIP ? (
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-blue-800">
                {t('current_ip')}
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCurrentIPQuery}
                disabled={isLoading || disabled}
                className="h-7 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                {t('query_button')}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-white rounded text-sm font-mono">
                {currentIP.query}
              </code>
              <Badge variant="outline" className={getIPVersionColor(currentIP.query)}>
                {getIPVersion(currentIP.query)}
              </Badge>
              {currentIP.country && (
                <Badge variant="secondary" className="text-xs">
                  {currentIP.country}
                </Badge>
              )}
            </div>
          </div>
        ) : currentIPError ? (
          <div className="p-3 bg-red-50 rounded-md border border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700">{currentIPError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={detectCurrentIP}
                className="h-7 px-2 text-xs"
              >
                {t('auto_detect')}
              </Button>
            </div>
          </div>
        ) : null}

        {/* IP输入框 */}
        <div className="space-y-2">
          <Label htmlFor="ip-input" className="text-sm font-medium">
            IP地址
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="ip-input"
                type="text"
                placeholder={t('placeholder')}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || disabled}
                className={inputError ? 'border-red-500 focus:border-red-500' : ''}
              />
              {inputError && (
                <p className="text-sm text-red-600 mt-1">{inputError}</p>
              )}
              {inputValue && !inputError && (
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className={getIPVersionColor(inputValue)}>
                    {getIPVersion(inputValue)}
                  </Badge>
                </div>
              )}
            </div>
            <Button 
              onClick={handleQuery}
              disabled={isLoading || disabled || !inputValue.trim()}
              className="px-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('querying')}
                </>
              ) : (
                t('query_button')
              )}
            </Button>
          </div>
        </div>

        {/* 示例IP */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">
            示例IP地址
          </Label>
          <div className="flex flex-wrap gap-1">
            {exampleIPs.map((ip) => (
              <Button
                key={ip}
                variant="ghost"
                size="sm"
                onClick={() => handleExampleClick(ip)}
                disabled={isLoading || disabled}
                className="h-7 px-2 text-xs font-mono"
              >
                {ip}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}