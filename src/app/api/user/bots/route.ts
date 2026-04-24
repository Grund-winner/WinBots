import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Get full user data with deposits and referral counts
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { totalDeposits: true, verifiedRefCount: true },
    });

    // Fetch all active games from database
    const games = await db.game.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Fetch user's unlocked bots from BotUnlock table
    const unlockedBots = await db.botUnlock.findMany({
      where: { userId: user.id },
      select: { botId: true },
    });
    const unlockedBotIds = new Set(unlockedBots.map(b => b.botId));

    // Determine which bots are ACTUALLY unlocked based on current game conditions
    // A bot is unlocked only if:
    // 1. It's in BotUnlock AND
    // 2. The current game conditions are still met
    const actuallyUnlocked: string[] = [];
    for (const game of games) {
      const hasRecord = unlockedBotIds.has(game.slug);
      if (!hasRecord) continue;

      switch (game.unlockType) {
        case 'free':
          // Free games are always unlocked if recorded
          actuallyUnlocked.push(game.slug);
          break;
        case 'deposit':
          // Check if user still meets deposit requirement
          if (fullUser && fullUser.totalDeposits >= game.unlockValue) {
            actuallyUnlocked.push(game.slug);
          }
          break;
        case 'referral':
          // Check if user still meets referral requirement
          if (fullUser && fullUser.verifiedRefCount >= game.unlockValue) {
            actuallyUnlocked.push(game.slug);
          }
          break;
      }
    }

    return NextResponse.json({
      games,
      unlockedBots: actuallyUnlocked,
    });
  } catch (error) {
    console.error('User bots error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
