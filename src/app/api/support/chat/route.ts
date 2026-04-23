import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter';
import { sanitizeString, truncate } from '@/lib/sanitize';

// ─── Groq API Key Management ────────────────────────────────────────────────

// Keys that are temporarily marked as failed (e.g., rate limited) get a cooldown
const failedKeys = new Map<string, number>(); // key -> timestamp when it can be retried
const COOLDOWN_MS = 60_000; // 1 minute cooldown for failed keys

function getAvailableKeys(): string[] {
  const keys: string[] = [];

  // Support multiple keys: GROQ_API_KEY_1, GROQ_API_KEY_2, ... GROQ_API_KEY_5
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key && key.trim()) {
      keys.push(key.trim());
    }
  }

  // Fallback: single GROQ_API_KEY for backward compatibility
  if (keys.length === 0) {
    const singleKey = process.env.GROQ_API_KEY;
    if (singleKey && singleKey.trim()) {
      keys.push(singleKey.trim());
    }
  }

  return keys;
}

function getWorkingKey(): string | null {
  const keys = getAvailableKeys();
  const now = Date.now();

  // Find a key that isn't in cooldown
  const available = keys.filter((key) => {
    const failTime = failedKeys.get(key);
    if (!failTime) return true;
    if (now > failTime) {
      failedKeys.delete(key);
      return true;
    }
    return false;
  });

  if (available.length === 0) {
    // If all keys are in cooldown, pick the one that will be available soonest
    let soonestKey: string | null = null;
    let soonestTime = Infinity;
    for (const key of keys) {
      const failTime = failedKeys.get(key);
      if (failTime && failTime < soonestTime) {
        soonestTime = failTime;
        soonestKey = key;
      }
    }
    // If the soonest key is ready now, use it
    if (soonestKey && now >= soonestTime) {
      failedKeys.delete(soonestKey!);
      return soonestKey;
    }
    return null;
  }

  // Rotate: pick a random key from available ones for load distribution
  return available[Math.floor(Math.random() * available.length)];
}

function markKeyFailed(key: string) {
  failedKeys.set(key, Date.now() + COOLDOWN_MS);
}

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
    const ip = getClientIp(request);
    const { limited } = rateLimit(`chat_${ip}`, RATE_LIMITS.chat);
    if (limited) {
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

    // Validate and sanitize messages
    const sanitizedMessages = messages
      .filter((m: { role: string; content: string }) => {
        if (typeof m.content !== 'string') return false;
        if (m.content.length > 5000) return false;
        if (!['user', 'assistant'].includes(m.role)) return false;
        return true;
      })
      .map((m: { role: string; content: string }) => ({
        role: m.role,
        content: sanitizeString(m.content).slice(0, 2000),
      }));

    if (sanitizedMessages.length === 0) {
      return NextResponse.json(
        { error: 'Messages invalides.' },
        { status: 400 }
      );
    }

    // Build the messages array for Groq
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...sanitizedMessages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Get a working API key (with failover)
    const apiKey = getWorkingKey();

    if (!apiKey) {
      // All keys are in cooldown - return a graceful fallback
      const fallbackReplies = [
        'Merci pour votre message ! Notre equipe est actuellement tres sollicitee. Veuillez reessayer dans quelques instants ou contactez-nous sur WhatsApp ou Telegram pour une reponse plus rapide.',
        'Bonjour ! Nous recevons beaucoup de messages en ce moment. Pour une assistance immediate, veuillez utiliser notre support WhatsApp ou Telegram disponible dans le menu.',
        'Merci de nous avoir contactes. Notre systeme est temporairement surcharge. Veuillez reessayer dans un instant ou utiliser le support WhatsApp ou Telegram.',
      ];
      const randomReply =
        fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      return NextResponse.json({ reply: randomReply });
    }

    // Try calling Groq API with failover
    const allKeys = getAvailableKeys();
    let lastError: string | null = null;

    for (const key of allKeys) {
      const failTime = failedKeys.get(key);
      const now = Date.now();
      if (failTime && now < failTime) continue; // Skip keys in cooldown

      try {
        const response = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: apiMessages,
              max_tokens: 1024,
              temperature: 0.7,
              top_p: 0.9,
            }),
            signal: AbortSignal.timeout(15000), // 15s timeout per key
          }
        );

        if (response.status === 429) {
          // Rate limited - mark this key as failed and try next
          markKeyFailed(key);
          lastError = `Key rate limited (429)`;
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Groq API error:', response.status, errorData);
          lastError = `API error ${response.status}`;
          // Don't mark non-429 errors as key failures - they might be request-specific
          if (response.status >= 500) {
            markKeyFailed(key);
          }
          continue;
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content?.trim();

        if (!reply) {
          lastError = 'Empty response';
          continue;
        }

        return NextResponse.json({ reply });
      } catch (fetchError: any) {
        if (fetchError?.name === 'TimeoutError') {
          markKeyFailed(key);
          lastError = 'Request timeout';
          continue;
        }
        console.error('Groq fetch error:', fetchError);
        lastError = fetchError?.message || 'Unknown error';
        // Network errors - try next key
        continue;
      }
    }

    // All keys failed
    console.error('All Groq keys failed. Last error:', lastError);
    const fallbackReplies = [
      'Merci pour votre message ! Notre equipe va vous repondre dans les plus brefs delais. En attendant, n\'hesitez pas a nous contacter sur WhatsApp ou Telegram pour une reponse plus rapide.',
      'Bonjour ! Je suis actuellement en train de mettre a jour mes donnees. Pour une assistance immediate, veuillez utiliser notre support WhatsApp ou Telegram disponible dans le menu.',
      'Merci de nous avoir contactes. Pour le moment, notre systeme est en maintenance. Veuillez essayer notre support WhatsApp ou Telegram pour obtenir de l\'aide rapidement.',
    ];
    const randomReply =
      fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
    return NextResponse.json({ reply: randomReply });
  } catch (error) {
    console.error('Support chat error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez reessayer.' },
      { status: 500 }
    );
  }
}
