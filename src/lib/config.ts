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

// Auto-seed games (safe to run on every request)
export async function ensureGamesSeeded(): Promise<void> {
  const count = await db.game.count();
  if (count > 0) return; // Games already exist, skip

  const GAMES = [
    { name: 'Aviator', slug: 'aviator', image: '/games/aviator.avif', description: 'Algorithme de prediction pour le jeu Aviator', color: 'bg-sky-500', icon: 'Plane', unlockType: 'free', unlockValue: 0, tier: 1, sortOrder: 0, showOnLanding: true },
    { name: 'Crash', slug: 'crash', image: '/games/crash.avif', description: 'Predictions avancees pour le jeu Crash', color: 'bg-red-500', icon: 'TrendingDown', unlockType: 'deposit', unlockValue: 5, tier: 2, sortOrder: 1, showOnLanding: true },
    { name: 'Dice', slug: 'dice', image: '/games/dice.avif', description: 'Prediction intelligente pour le jeu de des', color: 'bg-violet-500', icon: 'Dice5', unlockType: 'deposit', unlockValue: 5, tier: 2, sortOrder: 2, showOnLanding: true },
    { name: 'Mines', slug: 'mines', image: '/games/mines.avif', description: 'Detecteur de zones sur pour le jeu Mines', color: 'bg-amber-500', icon: 'Bomb', unlockType: 'deposit', unlockValue: 10, tier: 3, sortOrder: 3, showOnLanding: true },
    { name: 'JetX', slug: 'jetx', image: '/games/jetx.avif', description: 'Prediction JetX avec analyse en temps reel', color: 'bg-emerald-500', icon: 'Rocket', unlockType: 'deposit', unlockValue: 10, tier: 3, sortOrder: 4, showOnLanding: true },
    { name: 'Rocket', slug: 'rocket', image: '/games/rocket.avif', description: 'Prediction Rocket avec analyse de trajectoire', color: 'bg-orange-500', icon: 'Flame', unlockType: 'deposit', unlockValue: 20, tier: 4, sortOrder: 5, showOnLanding: true },
    { name: 'Aviam', slug: 'aviam', image: '/games/aviam.avif', description: 'Algorithme de prediction pour Aviam', color: 'bg-teal-500', icon: 'Zap', unlockType: 'free', unlockValue: 0, tier: 1, sortOrder: 6, showOnLanding: true },
    { name: 'Lucky Jet', slug: 'lucky_jet', image: '/games/luckyjet.avif', description: 'Prediction Lucky Jet avec detection de tendances', color: 'bg-green-500', icon: 'Clover', unlockType: 'deposit', unlockValue: 20, tier: 4, sortOrder: 7, showOnLanding: true },
    { name: 'Spaceman', slug: 'spaceman', image: '/games/spaceman.avif', description: 'Prediction Spaceman avec algorithmes orbitaux', color: 'bg-indigo-500', icon: 'Astronaut', unlockType: 'referral', unlockValue: 5, tier: 5, sortOrder: 8, showOnLanding: true },
    { name: 'Speed and Cash', slug: 'speed_cash', image: '/games/speedandcash.avif', description: 'Prediction rapide pour Speed and Cash', color: 'bg-yellow-500', icon: 'Zap', unlockType: 'referral', unlockValue: 15, tier: 5, sortOrder: 9, showOnLanding: true },
    { name: 'Coin Run', slug: 'coin_run', image: '/games/coinrun.avif', description: 'Prediction Coin Run avec machine learning', color: 'bg-pink-500', icon: 'Coins', unlockType: 'referral', unlockValue: 30, tier: 6, sortOrder: 10, showOnLanding: true },
    { name: 'Chicken', slug: 'chicken', image: '/games/chicken.avif', description: 'Prediction pour le jeu Chicken', color: 'bg-rose-500', icon: 'Zap', unlockType: 'deposit', unlockValue: 10, tier: 3, sortOrder: 11, showOnLanding: true },
    { name: 'Chook Train', slug: 'chook_train', image: '/games/chooktrain.avif', description: 'Prediction Chook Train avec analyse avancee', color: 'bg-fuchsia-500', icon: 'Zap', unlockType: 'deposit', unlockValue: 10, tier: 3, sortOrder: 12, showOnLanding: false },
    { name: 'Balloon', slug: 'balloon', image: '/games/balloon.avif', description: 'Prediction Balloon avec calcul de probabilites', color: 'bg-cyan-500', icon: 'Zap', unlockType: 'referral', unlockValue: 5, tier: 5, sortOrder: 13, showOnLanding: false },
    { name: 'Fox', slug: 'fox', image: '/games/fox.avif', description: 'Prediction Fox avec reconnaissance de motifs', color: 'bg-amber-600', icon: 'Zap', unlockType: 'deposit', unlockValue: 20, tier: 4, sortOrder: 14, showOnLanding: false },
    { name: 'Tower', slug: 'tower', image: '/games/tower.avif', description: 'Prediction Tower avec analyse structurelle', color: 'bg-stone-500', icon: 'Zap', unlockType: 'referral', unlockValue: 15, tier: 5, sortOrder: 15, showOnLanding: false },
    { name: 'Tropicana', slug: 'tropicana', image: '/games/tropicana.avif', description: 'Prediction Tropicana avec tendances tropicales', color: 'bg-lime-500', icon: 'Zap', unlockType: 'deposit', unlockValue: 20, tier: 4, sortOrder: 16, showOnLanding: false },
    { name: 'Plinko', slug: 'plinko', image: '/games/plinko.avif', description: 'Prediction Plinko avec calcul de trajectoire', color: 'bg-sky-600', icon: 'Zap', unlockType: 'referral', unlockValue: 30, tier: 6, sortOrder: 17, showOnLanding: false },
    { name: 'RocketX', slug: 'rocketx', image: '/games/rocketx.avif', description: 'Prediction RocketX avec forecast avance', color: 'bg-red-600', icon: 'Zap', unlockType: 'deposit', unlockValue: 20, tier: 4, sortOrder: 18, showOnLanding: false },
    { name: 'Nmines', slug: 'nmines', image: '/games/nmines.avif', description: 'Prediction Nmines avec detection avancee', color: 'bg-orange-600', icon: 'Zap', unlockType: 'deposit', unlockValue: 10, tier: 3, sortOrder: 19, showOnLanding: false },
  ];

  for (const game of GAMES) {
    await db.game.create({ data: game });
  }
  console.log(`${GAMES.length} games auto-seeded.`);
}

// Seed default configs (called on every register/login)
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

  // Auto-seed games if none exist (for fresh deployments like Vercel)
  try {
    await ensureGamesSeeded();
  } catch (e) {
    console.warn('Game seeding failed:', e);
  }

  // Auto-promote owner: if OWNER_EMAIL is set, ensure that user is admin
  try {
    const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase().trim();
    if (ownerEmail) {
      const ownerUser = await db.user.findUnique({ where: { email: ownerEmail } });
      if (ownerUser && ownerUser.role !== 'admin') {
        await db.user.update({ where: { id: ownerUser.id }, data: { role: 'admin' } });
        console.log(`Auto-promoted owner '${ownerUser.username}' to admin.`);
      }
    }
  } catch (e) {
    console.warn('Owner promotion failed:', e);
  }

  // One-time auto-cleanup: removes ALL test users created during development
  // This runs only once (tracked by 'test_cleanup_done' config)
  try {
    const cleanupDone = await db.siteConfig.findUnique({ where: { key: 'test_cleanup_done' } });
    if (!cleanupDone) {
      const allUsers = await db.user.findMany();
      for (const testUser of allUsers) {
        await db.botUnlock.deleteMany({ where: { userId: testUser.id } });
        await db.postbackEvent.deleteMany({ where: { userId: testUser.id } });
        await db.monthlyReward.deleteMany({ where: { userId: testUser.id } });
        const sessions = await db.siteConfig.findMany({ where: { key: { startsWith: 'session_' } } });
        for (const session of sessions) {
          if (session.value === testUser.id) {
            await db.siteConfig.delete({ where: { key: session.key } });
          }
        }
        await db.user.delete({ where: { id: testUser.id } });
        console.log(`Auto-cleaned test user: ${testUser.username} (${testUser.email})`);
      }
      await db.siteConfig.upsert({
        where: { key: 'test_cleanup_done' },
        update: { value: 'true' },
        create: { key: 'test_cleanup_done', value: 'true' },
      });
      if (allUsers.length > 0) {
        console.log(`One-time cleanup: removed ${allUsers.length} test user(s).`);
      }
    }
  } catch (e) {
    console.warn('Test cleanup failed:', e);
  }
}
