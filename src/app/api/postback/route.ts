import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RANK_THRESHOLDS } from '@/lib/bots';

// Constant-time string comparison to prevent timing attacks
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function verifyPostbackToken(token: string | null): boolean {
  const validToken = process.env.POSTBACK_SECRET;
  if (!validToken || !token) return false;
  return constantTimeEqual(token, validToken);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!verifyPostbackToken(token)) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 403 });
  }

  return NextResponse.json({ status: 'Postback endpoint actif' });
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const eventId = searchParams.get('event_id') || searchParams.get('i1') || '';
    const eventType = searchParams.get('goal') || searchParams.get('event_type') || '';
    const sub1 = searchParams.get('sub1') || '';
    const amount = parseFloat(searchParams.get('amount') || '0');

    // Verify token with constant-time comparison
    if (!verifyPostbackToken(token)) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 403 });
    }

    if (!sub1) {
      return NextResponse.json({ error: 'sub1 (user ID) manquant' }, { status: 400 });
    }

    // Find user by referral code (sub1 = user's referral code or user ID)
    let user = await db.user.findUnique({
      where: { id: sub1 },
    });

    if (!user) {
      user = await db.user.findUnique({
        where: { referralCode: sub1 },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Check if event already processed
    if (eventId) {
      const existingEvent = await db.postbackEvent.findUnique({
        where: { eventId },
      });
      if (existingEvent) {
        return NextResponse.json({ message: 'Evenement deja traite', eventId });
      }
    }

    // Normalize event type
    let normalizedType = eventType.toLowerCase();
    if (normalizedType === 'reg' || normalizedType === 'signup') normalizedType = 'registration';
    if (normalizedType === 'first_deposit' || normalizedType === 'firstpay') normalizedType = 'first_deposit';
    if (normalizedType === 'deposit' || normalizedType === 'pay') normalizedType = 'deposit';
    if (normalizedType === 'revenue') normalizedType = 'revenue';

    // Create postback event
    await db.postbackEvent.create({
      data: {
        userId: user.id,
        eventId,
        eventType: normalizedType,
        amount: amount || null,
      },
    });

    // Fetch all active games with unlock conditions
    const allGames = await db.game.findMany({
      where: { isActive: true },
    });

    // Process based on event type
    if (normalizedType === 'registration') {
      await db.user.update({
        where: { id: user.id },
        data: { isVerified1Win: true },
      });

      if (user.referredById) {
        const referrer = await db.user.findUnique({
          where: { id: user.referredById },
        });
        if (referrer) {
          const newCount = referrer.verifiedRefCount + 1;
          await db.user.update({
            where: { id: referrer.id },
            data: { verifiedRefCount: newCount },
          });

          const referralGames = allGames.filter(g => g.unlockType === 'referral');
          for (const game of referralGames) {
            if (newCount >= game.unlockValue) {
              await db.botUnlock.upsert({
                where: { userId_botId: { userId: referrer.id, botId: game.slug } },
                update: {},
                create: {
                  userId: referrer.id,
                  botId: game.slug,
                  botName: game.name,
                  unlockedVia: `referral_${game.unlockValue}`,
                },
              });
            }
          }
          await updateRank(referrer.id, newCount);
        }
      }
    }

    if (normalizedType === 'first_deposit' || normalizedType === 'deposit') {
      const currentDeposits = user.totalDeposits + (amount || 0);
      await db.user.update({
        where: { id: user.id },
        data: { totalDeposits: currentDeposits },
      });

      const depositGames = allGames.filter(g => g.unlockType === 'deposit');
      for (const game of depositGames) {
        if (currentDeposits >= game.unlockValue) {
          await db.botUnlock.upsert({
            where: { userId_botId: { userId: user.id, botId: game.slug } },
            update: {},
            create: {
              userId: user.id,
              botId: game.slug,
              botName: game.name,
              unlockedVia: `deposit_${game.unlockValue}`,
            },
          });
        }
      }
      await updateRank(user.id, user.verifiedRefCount, currentDeposits);
    }

    return NextResponse.json({
      success: true,
      eventId,
      eventType: normalizedType,
      userId: user.id,
      username: user.username,
    });
  } catch (error) {
    console.error('Postback error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

async function updateRank(userId: string, refCount: number, deposits: number = 0) {
  let rank = 'bronze';
  const score = refCount + (deposits / 5);
  for (const r of RANK_THRESHOLDS) {
    if (score >= r.minScore) rank = r.rank;
  }
  await db.user.update({
    where: { id: userId },
    data: { rank },
  });
}
