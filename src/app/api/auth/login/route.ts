import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createSession, getSessionCookieName } from '@/lib/session';
import { seedDefaultConfigs } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    await seedDefaultConfigs();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
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
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 30, // 30 days
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
