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

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) return null;

  const session = await db.siteConfig.findUnique({
    where: { key: `session_${token}` },
  });

  if (!session) return null;

  const userId = session.value;
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
  await db.siteConfig.upsert({
    where: { key: `session_${token}` },
    update: { value: userId },
    create: { key: `session_${token}`, value: userId },
  });
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await db.siteConfig.deleteMany({
    where: { key: { startsWith: `session_${token}` } },
  });
}
