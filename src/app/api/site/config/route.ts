import { NextResponse } from 'next/server';
import { getSiteConfig } from '@/lib/config';

export async function GET() {
  try {
    const configs = {
      affiliate_link: await getSiteConfig('affiliate_link', ''),
      promo_code: await getSiteConfig('promo_code', ''),
      whatsapp_link: await getSiteConfig('whatsapp_link', ''),
      telegram_link: await getSiteConfig('telegram_link', ''),
      platform_name: await getSiteConfig('platform_name', 'WinBots'),
      platform_description: await getSiteConfig('platform_description', ''),
    };
    return NextResponse.json({ configs });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
