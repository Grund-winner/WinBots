import { NextResponse } from 'next/server';
import { getSession, deleteSession, getSessionCookieName } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName())?.value;
    if (token) {
      await deleteSession(token);
    }
    const response = NextResponse.json({ message: 'Deconnexion reussie' });
    response.cookies.set(getSessionCookieName(), '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
