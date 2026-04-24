import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSessionCookieName } from './auth';

export { getSessionCookieName } from './auth';

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: string;
  referralCode: string;
  isVerified1Win: boolean;
  totalDeposits: number;
  verifiedRefCount: number;
  rank: string;
}

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) return null;

  const session = await db.siteConfig.findUnique({
    where: { key: `session_${token}` },
  });

  if (!session) return null;

  // Check session expiry (stored as JSON: {userId, createdAt})
  let userId: string;

  try {
    const sessionData = JSON.parse(session.value);
    const createdAt = new Date(sessionData.createdAt).getTime();
    const now = Date.now();
    
    if (now - createdAt > SESSION_EXPIRY_MS) {
      // Session expired - clean up
      await db.siteConfig.delete({ where: { key: `session_${token}` } });
      return null;
    }
    
    userId = sessionData.userId;
  } catch {
    // Legacy format: value is just the userId string
    // These are older sessions that don't have expiry - clean them up
    await db.siteConfig.delete({ where: { key: `session_${token}` } });
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      referralCode: true,
      isVerified1Win: true,
      totalDeposits: true,
      verifiedRefCount: true,
      rank: true,
    },
  });

  return user;
}

export async function createSession(userId: string): Promise<string> {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const sessionData = JSON.stringify({ userId, createdAt: new Date().toISOString() });
  await db.siteConfig.upsert({
    where: { key: `session_${token}` },
    update: { value: sessionData },
    create: { key: `session_${token}`, value: sessionData },
  });
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await db.siteConfig.deleteMany({
    where: { key: { startsWith: `session_${token}` } },
  });
}

// Clean up expired sessions (call periodically)
export async function cleanupExpiredSessions(): Promise<number> {
  const sessions = await db.siteConfig.findMany({
    where: { key: { startsWith: 'session_' } },
  });
  
  let deleted = 0;
  const now = Date.now();
  
  for (const session of sessions) {
    try {
      const data = JSON.parse(session.value);
      const createdAt = new Date(data.createdAt).getTime();
      if (now - createdAt > SESSION_EXPIRY_MS) {
        await db.siteConfig.delete({ where: { key: session.key } });
        deleted++;
      }
    } catch {
      // Legacy format - delete old sessions that don't have expiry
      // They are older than the new format, so they should be cleaned
      await db.siteConfig.delete({ where: { key: session.key } });
      deleted++;
    }
  }
  
  return deleted;
}
