import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;

    // 1. Check authentication
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ access: false, reason: 'not_authenticated' });
    }

    // 2. Get game from DB by slug
    const game = await db.game.findUnique({
      where: { slug },
    });

    if (!game || !game.isActive) {
      return NextResponse.json({ access: false, reason: 'not_found' });
    }

    // 3. Check if user has the bot unlocked
    let isUnlocked = false;

    // Check conditions based on unlock type
    switch (game.unlockType) {
      case 'free':
        isUnlocked = true;
        break;
      case 'deposit':
        isUnlocked = user.totalDeposits >= game.unlockValue;
        break;
      case 'referral':
        isUnlocked = user.verifiedRefCount >= game.unlockValue;
        break;
    }

    // Also check BotUnlock table for explicit unlock records
    if (!isUnlocked) {
      const explicitUnlock = await db.botUnlock.findUnique({
        where: {
          userId_botId: {
            userId: user.id,
            botId: game.slug,
          },
        },
      });

      if (explicitUnlock) {
        // If there's an explicit unlock record, also verify conditions are still met
        switch (game.unlockType) {
          case 'free':
            isUnlocked = true;
            break;
          case 'deposit':
            isUnlocked = user.totalDeposits >= game.unlockValue;
            break;
          case 'referral':
            isUnlocked = user.verifiedRefCount >= game.unlockValue;
            break;
        }
      }
    }

    // 4. Return result
    if (!isUnlocked) {
      return NextResponse.json({
        access: false,
        reason: 'locked',
        game: {
          name: game.name,
          unlockType: game.unlockType,
          unlockValue: game.unlockValue,
        },
      });
    }

    return NextResponse.json({
      access: true,
      game: {
        name: game.name,
        slug: game.slug,
      },
    });
  } catch (error) {
    console.error('Bot access check error:', error);
    return NextResponse.json({ access: false, reason: 'not_found' });
  }
}
