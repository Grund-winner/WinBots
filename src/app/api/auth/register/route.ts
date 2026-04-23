import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateReferralCode } from '@/lib/auth';
import { seedDefaultConfigs } from '@/lib/config';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter';
import { sanitizeString, sanitizeUsername, isValidEmail, isStrongPassword, stripHtml, truncate } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    await seedDefaultConfigs();

    // Rate limiting by IP
    const ip = getClientIp(request);
    const { limited } = rateLimit(`register_${ip}`, RATE_LIMITS.register);
    if (limited) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez attendre 10 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, email, password, referralCode } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Nom d'utilisateur, email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Validate and sanitize username
    const cleanUsername = sanitizeUsername(username);
    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Le nom d'utilisateur doit contenir 3 a 20 caracteres (lettres, chiffres, _, -)" },
        { status: 400 }
      );
    }

    // Validate email
    const cleanEmail = sanitizeString(email).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    // Limit password length
    if (typeof password !== 'string' || password.length > 200) {
      return NextResponse.json(
        { error: 'Donnees invalides' },
        { status: 400 }
      );
    }

    // Strong password validation
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.reason },
        { status: 400 }
      );
    }

    // Check if user/email already exists
    const existingUser = await db.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { username: cleanUsername }] },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Ce nom d'utilisateur ou email est deja utilise" },
        { status: 409 }
      );
    }

    // Handle referral
    let referredById: string | null = null;
    if (referralCode) {
      const cleanCode = sanitizeString(referralCode).toUpperCase();
      const referrer = await db.user.findUnique({
        where: { referralCode: cleanCode },
      });
      if (!referrer) {
        return NextResponse.json(
          { error: 'Code de parrainage invalide' },
          { status: 400 }
        );
      }
      referredById = referrer.id;
    }

    // Create user - first registered user OR owner email becomes admin
    const passwordHash = await hashPassword(password);
    const userCount = await db.user.count();
    const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase().trim();
    const isOwner = ownerEmail && cleanEmail === ownerEmail;
    const isAdmin = userCount === 0 || isOwner;
    const user = await db.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        referralCode: generateReferralCode(),
        referredById,
        role: isAdmin ? 'admin' : 'user',
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
      { error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    );
  }
}
