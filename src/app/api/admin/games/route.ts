import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const games = await db.game.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ games });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, isActive, showOnLanding, unlockType, unlockValue, tier } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID du jeu requis' }, { status: 400 });
    }

    const game = await db.game.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(showOnLanding !== undefined ? { showOnLanding } : {}),
        ...(unlockType !== undefined ? { unlockType } : {}),
        ...(unlockValue !== undefined ? { unlockValue: Number(unlockValue) } : {}),
        ...(tier !== undefined ? { tier: Number(tier) } : {}),
      },
    });

    return NextResponse.json({ game });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
