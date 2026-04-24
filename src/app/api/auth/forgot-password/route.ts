import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter';
import { sanitizeString, isValidEmail } from '@/lib/sanitize';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const { limited } = rateLimit(`forgot_${ip}`, RATE_LIMITS.register);
    if (limited) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez attendre 10 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    const cleanEmail = sanitizeString(email).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, username: true, email: true },
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate secure reset token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');

      // Store token in SiteConfig with 1-hour expiry
      const resetData = JSON.stringify({
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
      });

      await db.siteConfig.upsert({
        where: { key: `reset_${token}` },
        update: { value: resetData },
        create: { key: `reset_${token}`, value: resetData },
      });

      // Delete any previous reset tokens for this user
      const allSessions = await db.siteConfig.findMany({
        where: { key: { startsWith: 'reset_' } },
      });
      for (const session of allSessions) {
        if (session.key === `reset_${token}`) continue;
        try {
          const data = JSON.parse(session.value);
          if (data.userId === user.id) {
            await db.siteConfig.delete({ where: { key: session.key } });
          }
        } catch {}
      }

      // Send email via Resend
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://win-bots.vercel.app';
          const resetUrl = `${baseUrl}/reset-password?token=${token}`;

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'WinBots <onboarding@resend.dev>',
            to: user.email,
            subject: 'Reinitialisation de votre mot de passe - WinBots',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">WinBots</h1>
                </div>
                <div style="background: #f8fafc; border-radius: 16px; padding: 32px; text-align: center;">
                  <p style="font-size: 16px; color: #334155; margin: 0 0 8px;">Bonjour <strong>${user.username}</strong>,</p>
                  <p style="font-size: 14px; color: #64748b; margin: 0 0 24px;">Nous avons recu une demande de reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en definir un nouveau.</p>
                  <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
                    Reinitialiser le mot de passe
                  </a>
                  <p style="font-size: 12px; color: #94a3b8; margin: 24px 0 0;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
                </div>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px;">WinBots - Bots de Prediction Casino</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send reset email:', emailError);
          // Still return success to prevent email enumeration
        }
      } else {
        console.warn('RESEND_API_KEY not configured - reset token created but email not sent');
      }
    }

    return NextResponse.json({
      message: 'Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
