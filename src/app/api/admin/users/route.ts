import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { referralCode: { contains: search.toUpperCase() } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          referralCode: true,
          isVerified1Win: true,
          totalDeposits: true,
          verifiedRefCount: true,
          rank: true,
          referredById: true,
          createdAt: true,
          referrals: { select: { id: true } },
          botUnlocks: { select: { id: true } },
          postbackEvents: { select: { id: true, eventType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    const enrichedUsers = users.map(u => ({
      ...u,
      totalReferrals: u.referrals.length,
      botsUnlocked: u.botUnlocks.length,
      eventCount: u.postbackEvents.length,
    }));

    return NextResponse.json({
      users: enrichedUsers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getSession();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Delete related records
    await db.botUnlock.deleteMany({ where: { userId } });
    await db.postbackEvent.deleteMany({ where: { userId } });
    await db.monthlyReward.deleteMany({ where: { userId } });

    // Delete sessions for this user
    const sessions = await db.siteConfig.findMany({ where: { key: { startsWith: 'session_' } } });
    for (const session of sessions) {
      if (session.value === userId) {
        await db.siteConfig.delete({ where: { key: session.key } });
      }
    }

    await db.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: 'Utilisateur supprime avec succes' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
