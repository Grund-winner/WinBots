import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Top referrers by verified referrals
    const topReferrers = await db.user.findMany({
      where: { verifiedRefCount: { gt: 0 } },
      select: {
        id: true,
        username: true,
        referralCode: true,
        verifiedRefCount: true,
        totalDeposits: true,
        rank: true,
        createdAt: true,
        referrals: {
          where: { isVerified1Win: true },
          select: { id: true },
        },
      },
      orderBy: { verifiedRefCount: 'desc' },
      take: 50,
    });

    // Get monthly rewards
    const monthlyRewards = await db.monthlyReward.findMany({
      where: { month: currentMonth },
      include: {
        user: {
          select: { username: true, referralCode: true },
        },
      },
      orderBy: { rank: 'asc' },
    });

    const leaderboard = topReferrers.map((user, index) => {
      const reward = monthlyRewards.find(r => r.userId === user.id);
      return {
        position: index + 1,
        userId: user.id,
        username: user.username,
        referralCode: user.referralCode,
        verifiedReferrals: user.referrals.length,
        totalDeposits: user.totalDeposits,
        rank: user.rank,
        monthlyReward: reward?.amount || 0,
        monthlyRank: reward?.rank || null,
      };
    });

    return NextResponse.json({ leaderboard, month: currentMonth, rewards: monthlyRewards });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
