import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

// POST /api/suggestions - Submit a suggestion/feedback
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const body = await request.json();
    const { message, screenshot } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le message est requis' },
        { status: 400 }
      );
    }

    if (message.trim().length > 3000) {
      return NextResponse.json(
        { error: 'Le message ne doit pas depasser 3000 caracteres' },
        { status: 400 }
      );
    }

    // Validate screenshot if provided (base64 data URL, max ~2MB)
    let screenshotData: string | undefined;
    if (screenshot && typeof screenshot === 'string') {
      if (screenshot.length > 2_800_000) {
        return NextResponse.json(
          { error: 'La capture d\'ecran est trop volumineuse (max 2 Mo)' },
          { status: 400 }
        );
      }
      // Validate it's a data URL with an image type
      if (
        !screenshot.startsWith('data:image/') ||
        !screenshot.includes(';base64,')
      ) {
        return NextResponse.json(
          { error: 'Format d\'image invalide' },
          { status: 400 }
        );
      }
      screenshotData = screenshot;
    }

    const suggestion = await db.suggestion.create({
      data: {
        userId: user.id,
        username: user.username,
        message: message.trim(),
        screenshot: screenshotData,
      },
    });

    return NextResponse.json({
      success: true,
      id: suggestion.id,
    });
  } catch (error) {
    console.error('Submit suggestion error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
