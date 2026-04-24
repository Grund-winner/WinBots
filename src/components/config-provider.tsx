'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SiteConfig {
  affiliate_link: string;
  promo_code: string;
  whatsapp_link: string;
  telegram_link: string;
  platform_name: string;
  platform_description: string;
  reward_total: string;
  reward_first: string;
  reward_second: string;
  reward_third: string;
}

const defaultConfig: SiteConfig = {
  affiliate_link: 'https://lkts.pro/4debb2',
  promo_code: 'DVYS',
  whatsapp_link: '',
  telegram_link: '',
  platform_name: 'WinBots',
  platform_description: 'Debloquez des bots de prediction gratuits et gagnez de l\'argent avec le parrainage',
  reward_total: '100',
  reward_first: '50',
  reward_second: '30',
  reward_third: '20',
};

interface ConfigContextType {
  config: SiteConfig;
  loading: boolean;
  refresh: () => void;
}

const ConfigContext = createContext<ConfigContextType>({
  config: defaultConfig,
  loading: true,
  refresh: () => {},
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/site/config');
      if (res.ok) {
        const data = await res.json();
        setConfig({ ...defaultConfig, ...data.configs });
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <ConfigContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useSiteConfig = () => useContext(ConfigContext);
