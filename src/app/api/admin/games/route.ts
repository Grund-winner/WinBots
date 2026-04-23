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
    console.log('Game update request:', body);
    const { id, name, description, isActive, showOnLanding, unlockType, unlockValue, tier } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID du jeu requis' }, { status: 400 });
    }

    const game = await db.game.findUnique({ where: { id } });
    if (!game) {
      return NextResponse.json({ error: 'Jeu non trouve' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (showOnLanding !== undefined) updateData.showOnLanding = showOnLanding;
    if (unlockType !== undefined) updateData.unlockType = unlockType;
    if (unlockValue !== undefined) updateData.unlockValue = Number(unlockValue);
    if (tier !== undefined) updateData.tier = Number(tier);

    const updated = await db.game.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ game: updated });
  } catch (error) {
    console.error('Game update error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
