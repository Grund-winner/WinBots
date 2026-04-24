import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter';

// GET /api/notifications - Get notifications for logged-in user
// ?count=true - returns only unread count + list of read IDs
export async function GET(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('count') === 'true';

    if (countOnly) {
      // Get all notification IDs
      const allNotifications = await db.notification.findMany({
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      const allIds = allNotifications.map((n) => n.id);

      // Get read notification IDs for this user
      const reads = await db.notificationRead.findMany({
        where: { userId: user.id },
        select: { notificationId: true },
      });
      const readIds = reads.map((r) => r.notificationId);

      const unreadCount = allIds.length - readIds.length;

      return NextResponse.json({ unreadCount, allIds, readIds });
    }

    // Return all notifications with read status
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get read notification IDs for this user
    const reads = await db.notificationRead.findMany({
      where: { userId: user.id },
      select: { notificationId: true },
    });
    const readIds = new Set(reads.map((r) => r.notificationId));

    const result = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      image: n.image || null,
      createdAt: n.createdAt.toISOString(),
      read: readIds.has(n.id),
    }));

    return NextResponse.json({ notifications: result });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/notifications/read - Mark notifications as read
export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Rate limiting
    const ip = getClientIp(request);
    const { limited } = rateLimit(`notif_read_${ip}`, RATE_LIMITS.notifications);
    if (limited) {
      return NextResponse.json({ error: 'Trop de requetes' }, { status: 429 });
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'notificationIds requis' }, { status: 400 });
    }

    // Create read records for unread notifications
    for (const notifId of notificationIds) {
      try {
        await db.notificationRead.upsert({
          where: {
            notificationId_userId: {
              notificationId: notifId,
              userId: user.id,
            },
          },
          update: {},
          create: {
            notificationId: notifId,
            userId: user.id,
          },
        });
      } catch {
        // Ignore duplicate errors
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
