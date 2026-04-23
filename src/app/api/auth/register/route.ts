import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateReferralCode } from '@/lib/auth';
import { seedDefaultConfigs } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    // Ensure default configs exist
    await seedDefaultConfigs();

    const body = await request.json();
    const { username, email, password, referralCode } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Nom d\'utilisateur, email et mot de passe requis' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Le nom d\'utilisateur doit contenir au moins 3 caracteres' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caracteres' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    // Check if user/email already exists
    const existingUser = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ce nom d\'utilisateur ou email est deja utilise' },
        { status: 409 }
      );
    }

    // Handle referral
    let referredById: string | null = null;
    if (referralCode) {
      const referrer = await db.user.findUnique({
        where: { referralCode: referralCode.toUpperCase() },
      });
      if (!referrer) {
        return NextResponse.json(
          { error: 'Code de parrainage invalide' },
          { status: 400 }
        );
      }
      referredById = referrer.id;
    }

    // Create user - first registered user becomes admin
    const passwordHash = await hashPassword(password);
    const userCount = await db.user.count();
    const user = await db.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash,
        referralCode: generateReferralCode(),
        referredById,
        role: userCount === 0 ? 'admin' : 'user',
      },
    });

    // Auto-unlock free games on registration
    const freeGames = await db.game.findMany({
      where: { unlockType: 'free', isActive: true },
    });
    for (const game of freeGames) {
      await db.botUnlock.create({
        data: {
          userId: user.id,
          botId: game.slug,
          botName: game.name,
          unlockedVia: 'registration',
        },
      });
    }

    return NextResponse.json({
      message: 'Inscription reussie ! Bienvenue.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        referralCode: user.referralCode,
        rank: user.rank,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
