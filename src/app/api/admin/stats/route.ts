import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const totalUsers = await db.user.count();
    const verifiedUsers = await db.user.count({ where: { isVerified1Win: true } });
    const totalDeposits = await db.postbackEvent.count({
      where: { eventType: { in: ['first_deposit', 'deposit'] } },
    });
    const totalRevenue = await db.postbackEvent.aggregate({
      where: { eventType: 'revenue' },
      _sum: { amount: true },
    });
    const totalReferrals = await db.user.count({ where: { referredById: { not: null } } });
    const totalBotUnlocks = await db.botUnlock.count();
    const totalPostbacks = await db.postbackEvent.count();

    // Daily stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await db.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    const recentDeposits = await db.postbackEvent.count({
      where: { eventType: { in: ['first_deposit', 'deposit'] }, createdAt: { gte: sevenDaysAgo } },
    });

    return NextResponse.json({
      totalUsers,
      verifiedUsers,
      totalDeposits,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalReferrals,
      totalBotUnlocks,
      totalPostbacks,
      recentUsers,
      recentDeposits,
      conversionRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
