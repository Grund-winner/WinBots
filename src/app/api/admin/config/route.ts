import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getAllConfigs, setSiteConfig, invalidateCache } from '@/lib/config';

export async function GET() {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }
    const configs = await getAllConfigs();
    return NextResponse.json({ configs });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const body = await request.json();
    const { configs } = body;

    if (!configs || typeof configs !== 'object') {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(configs)) {
      await setSiteConfig(key, String(value));
    }

    return NextResponse.json({ message: 'Configuration mise a jour' });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
