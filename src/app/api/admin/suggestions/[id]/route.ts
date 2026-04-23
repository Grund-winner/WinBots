import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

// GET /api/admin/suggestions/[id] - Get full suggestion with screenshot
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const { id } = await params;

    const suggestion = await db.suggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion non trouvee' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: suggestion.id,
      userId: suggestion.userId,
      username: suggestion.username,
      message: suggestion.message,
      screenshot: suggestion.screenshot,
      status: suggestion.status,
      adminReply: suggestion.adminReply,
      createdAt: suggestion.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Get suggestion detail error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
