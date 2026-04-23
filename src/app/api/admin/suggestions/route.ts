import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

// GET /api/admin/suggestions - List all suggestions
export async function GET(request: Request) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const suggestions = await db.suggestion.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const result = suggestions.map((s) => ({
      id: s.id,
      userId: s.userId,
      username: s.username,
      message: s.message,
      hasScreenshot: !!s.screenshot,
      status: s.status,
      adminReply: s.adminReply,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ suggestions: result });
  } catch (error) {
    console.error('Get admin suggestions error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/admin/suggestions - Update suggestion status/reply
export async function PATCH(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, adminReply } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (status && ['pending', 'reviewed', 'dismissed'].includes(status)) {
      updateData.status = status;
    }
    if (adminReply !== undefined && typeof adminReply === 'string') {
      updateData.adminReply = adminReply.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune modification a appliquer' },
        { status: 400 }
      );
    }

    const suggestion = await db.suggestion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      suggestion: {
        id: suggestion.id,
        status: suggestion.status,
        adminReply: suggestion.adminReply,
      },
    });
  } catch (error: any) {
    console.error('Update suggestion error:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Suggestion non trouvee' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
