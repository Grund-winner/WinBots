import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createSession, getSessionCookieName } from '@/lib/session';
import { seedDefaultConfigs } from '@/lib/config';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter';
import { sanitizeString, isValidEmail } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    await seedDefaultConfigs();

    // Rate limiting by IP
    const ip = getClientIp(request);
    const { limited } = rateLimit(`login_${ip}`, RATE_LIMITS.login);
    if (limited) {
      return NextResponse.json(
        { error: 'Trop de tentatives de connexion. Veuillez attendre 5 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Sanitize and validate email
    const cleanEmail = sanitizeString(email).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    // Limit password length to prevent DoS
    if (typeof password !== 'string' || password.length > 200) {
      return NextResponse.json(
        { error: 'Donnees invalides' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession(user.id);

    // Create response with session cookie
    const response = NextResponse.json({
      message: 'Connexion reussie',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        isVerified1Win: user.isVerified1Win,
        totalDeposits: user.totalDeposits,
        verifiedRefCount: user.verifiedRefCount,
        rank: user.rank,
      },
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days (reduced from 30)
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la connexion' },
      { status: 500 }
    );
  }
}
