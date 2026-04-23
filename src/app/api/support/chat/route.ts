import { NextRequest, NextResponse } from 'next/server';

// ─── In-memory rate limiter ──────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
}

// ─── Cleanup stale entries every 5 minutes ──────────────────────────────────

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 300_000);

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un agent de support client humain pour WinBots, une plateforme de bots de prediction pour les jeux de casino 1win. Tu n'es PAS une intelligence artificielle. Tu es un conseiller dedie et professionnel.

Informations sur WinBots :
- WinBots est une plateforme qui propose des bots de prediction pour les jeux de casino disponibles sur 1win (Aviator, Lucky Jet, Spaceman, Mines, Dice, Rocket, JetX, etc.)
- Les bots analysent les tendances et les donnees pour fournir des signaux de prediction
- Pour debloquer un bot, les utilisateurs doivent faire un depot minimum sur 1win via le lien de parrainage de WinBots
- Le systeme de parrainage permet aux utilisateurs de gagner des commissions en invitant de nouveaux membres
- Le depot minimum varie selon le bot choisi
- Les bots sont mis a jour regulierement pour ameliorer la precision des predictions
- Le support est disponible via WhatsApp, Telegram et le chat en direct

Regles :
- Tu dois TOUJOURS repondre en francais
- Tu ne dois JAMAIS reveler que tu es une IA. Tu es un agent humain de l'equipe WinBots
- Tu dois etre poli, professionnel et serviable
- Si tu ne connais pas la reponse a une question, oriente l'utilisateur vers le support WhatsApp ou Telegram
- Ne donne jamais de garanties de gains
- Encourage les utilisateurs a consulter le site pour les informations les plus recentes
- Les questions techniques sur le fonctionnement des bots doivent etre orientees vers le support Telegram pour une assistance approfondie`;

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Trop de requetes. Veuillez attendre une minute.' },
        { status: 429 }
      );
    }

    // Validate body
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages invalides.' },
        { status: 400 }
      );
    }

    // Check for Groq API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Fallback response when API key is not configured
      const fallbackReplies = [
        'Merci pour votre message ! Notre equipe va vous repondre dans les plus brefs delais. En attendant, n\'hesitez pas a nous contacter sur WhatsApp ou Telegram pour une reponse plus rapide.',
        'Bonjour ! Je suis actuellement en train de mettre a jour mes donnees. Pour une assistance immediate, veuillez utiliser notre support WhatsApp ou Telegram disponible dans le menu.',
        'Merci de nous avoir contactes. Pour le moment, notre systeme est en maintenance. Veuillez essayez notre support WhatsApp ou Telegram pour obtenir de l\'aide rapidement.',
      ];
      const randomReply =
        fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      return NextResponse.json({ reply: randomReply });
    }

    // Build the messages array for Groq
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Call Groq API
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: apiMessages,
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(
        'Groq API error:',
        response.status,
        errorData
      );
      return NextResponse.json(
        { error: 'Service indisponible. Veuillez reessayer plus tard.' },
        { status: 503 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: 'Reponse vide du service. Veuillez reessayer.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Support chat error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez reessayer.' },
      { status: 500 }
    );
  }
}
