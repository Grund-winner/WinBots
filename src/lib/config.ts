import { db } from '@/lib/db';

const CONFIG_CACHE = new Map<string, string>();
let cacheLoaded = false;

async function loadCache() {
  if (cacheLoaded) return;
  const configs = await db.siteConfig.findMany();
  configs.forEach(c => CONFIG_CACHE.set(c.key, c.value));
  cacheLoaded = true;
}

export async function getSiteConfig(key: string, defaultValue: string = ''): Promise<string> {
  await loadCache();
  if (CONFIG_CACHE.has(key)) return CONFIG_CACHE.get(key)!;
  const config = await db.siteConfig.findUnique({ where: { key } });
  if (config) {
    CONFIG_CACHE.set(key, config.value);
    return config.value;
  }
  return defaultValue;
}

export async function setSiteConfig(key: string, value: string): Promise<void> {
  await db.siteConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  CONFIG_CACHE.set(key, value);
}

export async function getAllConfigs(): Promise<Record<string, string>> {
  const configs = await db.siteConfig.findMany();
  const result: Record<string, string> = {};
  configs.forEach(c => { result[c.key] = c.value; CONFIG_CACHE.set(c.key, c.value); });
  cacheLoaded = true;
  return result;
}

export function invalidateCache(): void {
  CONFIG_CACHE.clear();
  cacheLoaded = false;
}

// Seed default configs
export async function seedDefaultConfigs(): Promise<void> {
  const defaults: Record<string, string> = {
    affiliate_link: 'https://lkts.pro/4debb2',
    promo_code: 'DVYS',
    whatsapp_link: '',
    telegram_link: '',
    reward_total: '100',
    reward_first: '50',
    reward_second: '30',
    reward_third: '20',
    platform_name: 'WinBots',
    platform_description: 'Debloquez des bots de prediction gratuits et gagnez de l\'argent avec le parrainage',
  };
  for (const [key, value] of Object.entries(defaults)) {
    await db.siteConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  invalidateCache();
}
