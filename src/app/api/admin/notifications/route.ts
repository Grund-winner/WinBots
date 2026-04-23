import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

// GET /api/admin/notifications - List all sent notifications
export async function GET() {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        _count: {
          select: { reads: true },
        },
      },
    });

    // Get total user count
    const totalUsers = await db.user.count({ where: { role: 'user' } });

    const result = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      hasImage: !!n.image,
      sentAt: n.createdAt.toISOString(),
      readCount: n._count.reads,
      totalUsers,
    }));

    return NextResponse.json({ notifications: result });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/notifications - Send a notification to all users
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, image } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Titre et message requis' },
        { status: 400 }
      );
    }

    if (title.trim().length > 100) {
      return NextResponse.json(
        { error: 'Le titre ne doit pas depasser 100 caracteres' },
        { status: 400 }
      );
    }

    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Le message ne doit pas depasser 2000 caracteres' },
        { status: 400 }
      );
    }

    // Validate image if provided
    let imageData: string | undefined;
    if (image && typeof image === 'string') {
      if (image.length > 2_800_000) {
        return NextResponse.json(
          { error: "L'image ne doit pas depasser 2 Mo" },
          { status: 400 }
        );
      }
      if (
        !image.startsWith('data:image/') ||
        !image.includes(';base64,')
      ) {
        return NextResponse.json(
          { error: "Format d'image invalide" },
          { status: 400 }
        );
      }
      imageData = image;
    }

    const notification = await db.notification.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        image: imageData,
        sentBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        title: notification.title,
        sentAt: notification.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/admin/notifications - Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await db.notification.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Notification non trouvee' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
