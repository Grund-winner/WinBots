import { db } from './src/lib/db';
import { hashPassword } from './src/lib/auth';
import { seedDefaultConfigs } from './src/lib/config';

const GAMES_DATA = [
  { name: 'Aviator', slug: 'aviator', image: 'aviator.avif', description: 'Algorithme de prediction pour le jeu Aviator', color: 'bg-sky-500', icon: 'Plane', unlockType: 'free', unlockValue: 0, tier: 1, sortOrder: 0, showOnLanding: true },
  { name: 'Crash', slug: 'crash', image: 'crash.avif', description: 'Predictions avancees pour le jeu Crash', color: 'bg-red-500', icon: 'TrendingDown', unlockType: 'deposit', unlockValue: 5, tier: 2, sortOrder: 1, showOnLanding: true },
  { name: 'Dice', slug: 'dice', image: 'dice.avif', description: 'Prediction intelligente pour le jeu de des', color: 'bg-violet-500', icon: 'Dice5', unlockType: 'deposit', unlockValue: 5, tier: 2, sortOrder: 2, showOnLanding: true },
  { name: 'Mines', slug: 'mines', image: 'mines.avif', description: 'Detecteur de zones sur pour le jeu Mines', color: 'bg-amber-500', icon: 'Bomb', unlockType: 'deposit', unlockValue: 10, tier: 3, sortOrder: 3, showOnLanding: true },
  { name: 'JetX', slug: 'jetx', image: 'jetx.avif', description: 'Prediction JetX avec analyse en temps reel', color: 'bg-emerald-500', icon: 'Rocket', unlockType: 'deposit', unlockValue: 10, tier: 3, sortOrder: 4, showOnLanding: true },
  { name: 'Rocket', slug: 'rocket', image: 'rocket.avif', description: 'Prediction Rocket avec analyse de trajectoire', color: 'bg-orange-500', icon: 'Flame', unlockType: 'deposit', unlockValue: 20, tier: 4, sortOrder: 5, showOnLanding: true },
  { name: 'Aviam', slug: 'aviam', image: 'aviam.avif', description: 'Algorithme de prediction pour Aviam', color: 'bg-teal-500', icon: 'Zap', unlockType: 'free', unlockValue: 0, tier: 1, sortOrder: 6, showOnLanding: true },
  { name: 'Lucky Jet', slug: 'lucky_jet', image: 'luckyjet.avif', description: 'Prediction Lucky Jet avec detection de tendances', color: 'bg-green-500', icon: 'Clover', unlockType: 'deposit', unlockValue: 20, tier: 4, sortOrder: 7, showOnLanding: true },
  { name: 'Spaceman', slug: 'spaceman', image: 'spaceman.avif', description: 'Prediction Spaceman avec algorithmes orbitaux', color: 'bg-indigo-500', icon: 'Astronaut', unlockType: 'referral', unlockValue: 5, tier: 5, sortOrder: 8, showOnLanding: true },
  { name: 'Speed and Cash', slug: 'speed_cash', image: 'speedandcash.avif', description: 'Prediction rapide pour Speed and Cash', color: 'bg-yellow-500', icon: 'Zap', unlockType: 'referral', unlockValue: 15, tier: 5, sortOrder: 9, showOnLanding: true },
  { name: 'Coin Run', slug: 'coin_run', image: 'coinrun.avif', description: 'Prediction Coin Run avec machine learning', color: 'bg-pink-500', icon: 'Coins', unlockType: 'referral', unlockValue: 30, tier: 6, sortOrder: 10, showOnLanding: true },
  { name: 'Chicken', slug: 'chicken', image: 'chicken.avif', description: 'Prediction pour le jeu Chicken', color: 'bg-rose-500', icon: 'Zap', unlockType: 'deposit', unlockValue: 10, tier: 3, sortOrder: 11, showOnLanding: true },
  { name: 'Chook Train', slug: 'chook_train', image: 'chooktrain.avif', description: 'Prediction Chook Train avec analyse avancee', color: 'bg-fuchsia-500', icon: 'Zap', unlockType: 'deposit', unlockValue: 10, tier: 3, sortOrder: 12, showOnLanding: true },
  { name: 'Balloon', slug: 'balloon', image: 'balloon.avif', description: 'Prediction Balloon avec calcul de probabilites', color: 'bg-cyan-500', icon: 'Zap', unlockType: 'referral', unlockValue: 5, tier: 5, sortOrder: 13, showOnLanding: false },
  { name: 'Fox', slug: 'fox', image: 'fox.avif', description: 'Prediction Fox avec reconnaissance de motifs', color: 'bg-amber-600', icon: 'Zap', unlockType: 'deposit', unlockValue: 20, tier: 4, sortOrder: 14, showOnLanding: false },
  { name: 'Tower', slug: 'tower', image: 'tower.avif', description: 'Prediction Tower avec analyse structurelle', color: 'bg-stone-500', icon: 'Zap', unlockType: 'referral', unlockValue: 15, tier: 5, sortOrder: 15, showOnLanding: false },
  { name: 'Tropicana', slug: 'tropicana', image: 'tropicana.avif', description: 'Prediction Tropicana avec tendances tropicales', color: 'bg-lime-500', icon: 'Zap', unlockType: 'deposit', unlockValue: 20, tier: 4, sortOrder: 16, showOnLanding: false },
  { name: 'Plinko', slug: 'plinko', image: 'plinko.avif', description: 'Prediction Plinko avec calcul de trajectoire', color: 'bg-sky-600', icon: 'Zap', unlockType: 'referral', unlockValue: 30, tier: 6, sortOrder: 17, showOnLanding: false },
  { name: 'RocketX', slug: 'rocketx', image: 'rocketx.avif', description: 'Prediction RocketX avec forecast avance', color: 'bg-red-600', icon: 'Zap', unlockType: 'deposit', unlockValue: 20, tier: 4, sortOrder: 18, showOnLanding: false },
  { name: 'Nmines', slug: 'nmines', image: 'nmines.avif', description: 'Prediction Nmines avec detection avancee', color: 'bg-orange-600', icon: 'Zap', unlockType: 'deposit', unlockValue: 10, tier: 3, sortOrder: 19, showOnLanding: false },
];

async function seed() {
  console.log('Seeding database...');

  // Seed default configs
  await seedDefaultConfigs();
  console.log('Default configs seeded.');

  // Create admin user if not exists
  const existingAdmin = await db.user.findUnique({ where: { email: 'admin@winbots.com' } });
  if (!existingAdmin) {
    const passwordHash = await hashPassword('Admin@2024');
    const admin = await db.user.create({
      data: {
        username: 'Admin',
        email: 'admin@winbots.com',
        passwordHash,
        role: 'admin',
        referralCode: 'ADMIN01',
      },
    });
    console.log('Admin user created:', admin.username, admin.email);
  } else {
    console.log('Admin user already exists.');
  }

  // Seed games (idempotent - skip if any exist)
  const existingGames = await db.game.count();
  if (existingGames === 0) {
    for (const game of GAMES_DATA) {
      await db.game.create({
        data: {
          name: game.name,
          slug: game.slug,
          image: `/games/${game.image}`,
          description: game.description,
          color: game.color,
          icon: game.icon,
          unlockType: game.unlockType,
          unlockValue: game.unlockValue,
          tier: game.tier,
          sortOrder: game.sortOrder,
          showOnLanding: game.showOnLanding,
        },
      });
    }
    console.log(`${GAMES_DATA.length} games seeded.`);
  } else {
    console.log(`Games already exist (${existingGames} found). Skipping.`);
  }

  console.log('Done!');
}

seed().catch(console.error).finally(() => process.exit(0));
