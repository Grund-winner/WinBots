import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureGamesSeeded } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Ensure games exist (for fresh Vercel deployments)
    await ensureGamesSeeded();

    const games = await db.game.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
