import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Get full user data
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        referrals: {
          select: { id: true, username: true, isVerified1Win: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        postbackEvents: {
          select: { eventType: true, amount: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        botUnlocks: {
          select: { botId: true, botName: true, unlockedVia: true, unlockedAt: true },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Count stats
    const totalReferrals = fullUser.referrals.length;
    const verifiedReferrals = fullUser.referrals.filter(r => r.isVerified1Win).length;
    const totalEvents = await db.postbackEvent.count({
      where: { userId: user.id },
    });
    const deposits = await db.postbackEvent.count({
      where: { userId: user.id, eventType: { in: ['first_deposit', 'deposit'] } },
    });

    // Monthly reward rank
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyReward = await db.monthlyReward.findUnique({
      where: { userId_month: { userId: user.id, month: currentMonth } },
    });

    return NextResponse.json({
      user: {
        id: fullUser.id,
        username: fullUser.username,
        email: fullUser.email,
        role: fullUser.role,
        referralCode: fullUser.referralCode,
        isVerified1Win: fullUser.isVerified1Win,
        totalDeposits: fullUser.totalDeposits,
        verifiedRefCount: fullUser.verifiedRefCount,
        rank: fullUser.rank,
      },
      stats: {
        totalReferrals,
        verifiedReferrals,
        totalEvents,
        totalDeposits: deposits,
        botsUnlocked: fullUser.botUnlocks.length,
        monthlyRank: monthlyReward?.rank || null,
        monthlyReward: monthlyReward?.amount || 0,
      },
      referrals: fullUser.referrals,
      recentEvents: fullUser.postbackEvents,
      unlockedBots: fullUser.botUnlocks.map(b => b.botId),
    });
  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
