import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter';
import { isStrongPassword } from '@/lib/sanitize';

const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const { limited } = rateLimit(`reset_${ip}`, RATE_LIMITS.register);
    if (limited) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez attendre 10 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (typeof password !== 'string' || password.length > 200) {
      return NextResponse.json(
        { error: 'Donnees invalides' },
        { status: 400 }
      );
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.reason },
        { status: 400 }
      );
    }

    // Look up reset token
    const resetEntry = await db.siteConfig.findUnique({
      where: { key: `reset_${token}` },
    });

    if (!resetEntry) {
      return NextResponse.json(
        { error: 'Lien de reinitialisation invalide ou expire' },
        { status: 400 }
      );
    }

    // Parse and validate token data
    let resetData: { userId: string; email: string; createdAt: string };
    try {
      resetData = JSON.parse(resetEntry.value);
    } catch {
      await db.siteConfig.delete({ where: { key: `reset_${token}` } });
      return NextResponse.json(
        { error: 'Lien de reinitialisation invalide' },
        { status: 400 }
      );
    }

    // Check token expiry
    const createdAt = new Date(resetData.createdAt).getTime();
    const now = Date.now();
    if (now - createdAt > RESET_EXPIRY_MS) {
      await db.siteConfig.delete({ where: { key: `reset_${token}` } });
      return NextResponse.json(
        { error: 'Ce lien a expire. Veuillez demander un nouveau lien.' },
        { status: 400 }
      );
    }

    // Update user password
    const passwordHash = await hashPassword(password);
    await db.user.update({
      where: { id: resetData.userId },
      data: { passwordHash },
    });

    // Delete all sessions for this user (force re-login)
    const allSessions = await db.siteConfig.findMany({
      where: { key: { startsWith: 'session_' } },
    });
    for (const session of allSessions) {
      try {
        const data = JSON.parse(session.value);
        if (data.userId === resetData.userId) {
          await db.siteConfig.delete({ where: { key: session.key } });
        }
      } catch {
        // Legacy format
        if (session.value === resetData.userId) {
          await db.siteConfig.delete({ where: { key: session.key } });
        }
      }
    }

    // Delete the used reset token
    await db.siteConfig.delete({ where: { key: `reset_${token}` } });

    return NextResponse.json({
      message: 'Mot de passe mis a jour avec succes. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
