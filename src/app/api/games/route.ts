import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const landingOnly = searchParams.get('landing') === 'true';

    const where = {
      isActive: true,
      ...(landingOnly ? { showOnLanding: true } : {}),
    };

    const games = await db.game.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
