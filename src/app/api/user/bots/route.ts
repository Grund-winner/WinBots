import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Fetch all active games from database
    const games = await db.game.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Fetch user's unlocked bots from BotUnlock table
    const unlockedBots = await db.botUnlock.findMany({
      where: { userId: user.id },
      select: { botId: true, botName: true, unlockedVia: true, unlockedAt: true },
      orderBy: { unlockedAt: 'asc' },
    });

    return NextResponse.json({
      games,
      unlockedBots: unlockedBots.map(b => b.botId),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
