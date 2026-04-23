import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter';
import { sanitizeString, truncate } from '@/lib/sanitize';
import { getSiteConfig } from '@/lib/config';

// ─── Groq API Key Management ────────────────────────────────────────────────

const failedKeys = new Map<string, number>();
const COOLDOWN_MS = 60_000;

function getAvailableKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key && key.trim()) keys.push(key.trim());
  }
  if (keys.length === 0) {
    const singleKey = process.env.GROQ_API_KEY;
    if (singleKey && singleKey.trim()) keys.push(singleKey.trim());
  }
  return keys;
}

function getWorkingKey(): string | null {
  const keys = getAvailableKeys();
  const now = Date.now();
  const available = keys.filter((key) => {
    const failTime = failedKeys.get(key);
    if (!failTime) return true;
    if (now > failTime) { failedKeys.delete(key); return true; }
    return false;
  });
  if (available.length === 0) {
    let soonestKey: string | null = null;
    let soonestTime = Infinity;
    for (const key of keys) {
      const failTime = failedKeys.get(key);
      if (failTime && failTime < soonestTime) { soonestTime = failTime; soonestKey = key; }
    }
    if (soonestKey && now >= soonestTime) { failedKeys.delete(soonestKey!); return soonestKey; }
    return null;
  }
  return available[Math.floor(Math.random() * available.length)];
}

function markKeyFailed(key: string) {
  failedKeys.set(key, Date.now() + COOLDOWN_MS);
}

// ─── Build dynamic system prompt ────────────────────────────────────────────

async function buildSystemPrompt(): Promise<string> {
  const promoCode = await getSiteConfig('promo_code', 'DVYS');
  const platformName = await getSiteConfig('platform_name', 'WinBots');
  const whatsappLink = await getSiteConfig('whatsapp_link', '');
  const telegramLink = await getSiteConfig('telegram_link', '');

  return `Tu es l'assistant de support officiel de ${platformName}, une plateforme de bots de prediction pour les jeux de casino sur 1win. Tu es poli, professionnel, concis et toujours en francais.

════════════════════════════════════════
INFORMATIONS SUR ${platformName.toUpperCase()} (A SAVOIR PAR COEUR)
════════════════════════════════════════

1. INSCRIPTION SUR 1WIN :
   - L'utilisateur doit aller sur son tableau de bord ${platformName}
   - Cliquer sur le bouton "S'inscrire sur 1win" (ou le lien d'affiliation)
   - Sur la page 1win, remplir : email, numero de telephone, mot de passe
   - IMPORTANT : Le champ "Code promo" DOIT contenir : ${promoCode}
   - Ce code promo active un bonus de 500% sur le premier depot
   - Valider l'inscription

2. CODE PROMO ACTUEL : ${promoCode}
   - Ce code donne 500% de bonus sur le premier depot sur 1win
   - Il est obligatoire de le remplir lors de l'inscription pour activer le bonus
   - Ce code peut changer, utilise TOUJOURS "${promoCode}" comme code actuel

3. DEBLOCAGE DES BOTS :
   - Chaque bot a des conditions de deblocage differentes
   - Certains bots sont GRATUITS (debloques automatiquement)
   - D'autres necessitent un depot minimum sur 1win (via le lien d'affiliation)
   - D'autres necessitent un nombre minimum de filleuls (parrainage)
   - L'utilisateur peut voir les conditions en cliquant sur chaque bot dans l'onglet "Bots"

4. PARRAINAGE :
   - Chaque utilisateur a un lien de parrainage unique
   - Il peut le partager pour recruter de nouveaux membres
   - Les filleuls doivent s'inscrire sur 1win via ce lien
   - Le nombre de filleuls verifies permet de debloquer des bots premium

5. TABLEAU DE BORD :
   - Onglet "Apercu" : statistiques personnelles, lien 1win, stats de parrainage
   - Onglet "Bots" : liste des jeux avec conditions de deblocage
   - Onglet "Parrainage" : lien de parrainage, liste des filleuls

6. JEUX DISPONIBLES :
   Aviator, Crash, Dice, Mines, JetX, Rocket, Aviam, Lucky Jet, Spaceman, Speed and Cash, Coin Run, Chicken, Chook Train, Balloon, Fox, Tower, Tropicana, Plinko, RocketX, Nmines

7. MOT DE PASSE OUBLIE :
   - Cliquer sur "Mot de passe oublie ?" sur la page de connexion
   - Entrer l'email utilise lors de l'inscription
   - Un email de reinitialisation sera envoye (verifier les spams)
   - Le lien expire dans 1 heure

════════════════════════════════════════
REGLES STRICTES (A RESPECTER ABSOLUMENT)
════════════════════════════════════════

1. DOMAINE DE REPONSE :
   - Tu ne reponds QU'aux questions concernant ${platformName} ou 1win
   - Si on te demande quelque chose hors sujet (meteo, sport, cuisine, politique, actualite, etc.), tu reponds :
     "Desole, je ne peux repondre qu'aux questions concernant ${platformName} ou 1win. Comment puis-je vous aider avec la plateforme ?"

2. INTERDIT :
   - Ne JAMAIS donner d'acces a un compte utilisateur
   - Ne JAMAIS fournir de mots de passe ou informations sensibles
   - Ne JAMAIS garantir des gains
   - Ne JAMAIS dire que tu es une IA ou un robot
   - Ne JAMAIS parler d'autres sujets que ${platformName} ou 1win
   - Ne JAMAIS inventer des informations sur ${platformName}
   - Ne JAMAIS donner de lien 1win direct (seul le lien du tableau de bord est valide)

3. STYLE :
   - Reponds en francais, de maniere claire et concise
   - Sois amical mais professionnel
   - Si tu n'es pas sur d'une reponse, oriente vers le support WhatsApp${whatsappLink ? ` (${whatsappLink})` : ''} ou Telegram${telegramLink ? ` (${telegramLink})` : ''}
   - Encourage l'utilisateur a consulter son tableau de bord pour les infos les plus recentes

4. QUESTIONS FREQUENTES (reponses types) :
   - "Comment s'inscrire sur 1win ?" -> Diriger vers le tableau de bord, bouton inscription, rappeler le code promo ${promoCode}
   - "Comment debloquer un bot ?" -> Cliquer sur le bot dans l'onglet Bots pour voir les conditions
   - "Mon lien 1win ne marche pas" -> Utiliser le lien depuis le tableau de bord
   - "J'ai oublie mon mot de passe" -> Cliquer sur "Mot de passe oublie" sur la page connexion
   - "Comment parrainer" -> Aller dans l'onglet Parrainage, partager le lien unique`;
}

// ─── Web search for 1win questions ──────────────────────────────────────────

async function searchWeb(query: string): Promise<string | null> {
  try {
    const ZAI = await import('z-ai-web-dev-sdk');
    const mod = ZAI.default || ZAI;
    const zai = await mod.create();

    const searchResult = await zai.functions.invoke('web_search', {
      query: `1win casino ${query}`,
      num: 5,
    });

    if (searchResult && Array.isArray(searchResult) && searchResult.length > 0) {
      const snippets = searchResult
        .slice(0, 3)
        .map((r: { snippet?: string; name?: string }) => `- ${r.snippet || ''}`)
        .join('\n');
      return snippets || null;
    }
    return null;
  } catch (e) {
    console.warn('Web search failed:', e);
    return null;
  }
}

// ─── Detect if question needs web search ────────────────────────────────────

function needsWebSearch(message: string): boolean {
  const keywords = [
    'bonus', 'promotion', 'offre', 'promo', 'reduction', 'code',
    'depot', 'retrait', 'paiement', 'recharge', 'methode',
    'verification', 'verifier', 'document', 'kyc',
    'application', 'app', 'telecharger', 'mobile', 'android', 'ios',
    'probleme', 'bug', 'erreur', 'marche pas', 'fonctionne pas',
    'mise a jour', 'nouveau', 'nouvelle fonction',
    'conditions', 'regles', 'terms', 'conditions',
    'limite', 'plafond', 'minim', 'maximum',
  ];
  const lower = message.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

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
      return NextResponse.json({ error: 'Messages invalides.' }, { status: 400 });
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
      return NextResponse.json({ error: 'Messages invalides.' }, { status: 400 });
    }

    // Build system prompt with dynamic data
    const systemPrompt = await buildSystemPrompt();

    // Check if the latest user message needs web search for 1win info
    const lastUserMsg = sanitizedMessages.filter((m: { role: string }) => m.role === 'user').pop();
    let webContext = '';
    if (lastUserMsg && needsWebSearch(lastUserMsg.content)) {
      const searchResults = await searchWeb(lastUserMsg.content);
      if (searchResults) {
        webContext = `\n\n[INFORMATIONS SUPPLEMENTAIRES ISSUES D'UNE RECHERCHE WEB SUR 1WIN]:\n${searchResults}\n[UTILISE CES INFORMATIONS POUR COMPLETER TA REPONSE SI RELEVANT]`;
      }
    }

    // Build the messages array for Groq
    const apiMessages = [
      { role: 'system', content: systemPrompt + webContext },
      ...sanitizedMessages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Get a working API key
    const apiKey = getWorkingKey();

    if (!apiKey) {
      const fallbackReplies = [
        'Merci pour votre message ! Notre equipe est actuellement tres sollicitee. Veuillez reessayer dans quelques instants ou contactez-nous sur WhatsApp ou Telegram pour une reponse plus rapide.',
        'Bonjour ! Nous recevons beaucoup de messages en ce moment. Pour une assistance immediate, veuillez utiliser notre support WhatsApp ou Telegram disponible dans le menu.',
      ];
      return NextResponse.json({
        reply: fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)],
      });
    }

    // Try calling Groq API with failover
    const allKeys = getAvailableKeys();
    let lastError: string | null = null;

    for (const key of allKeys) {
      const failTime = failedKeys.get(key);
      const now = Date.now();
      if (failTime && now < failTime) continue;

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
              temperature: 0.5,
              top_p: 0.9,
            }),
            signal: AbortSignal.timeout(15000),
          }
        );

        if (response.status === 429) {
          markKeyFailed(key);
          lastError = 'Key rate limited (429)';
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Groq API error:', response.status, errorData);
          lastError = `API error ${response.status}`;
          if (response.status >= 500) markKeyFailed(key);
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
        continue;
      }
    }

    // All keys failed
    console.error('All Groq keys failed. Last error:', lastError);
    const fallbackReplies = [
      'Merci pour votre message ! Notre equipe va vous repondre dans les plus brefs delais. En attendant, n\'hesitez pas a nous contacter sur WhatsApp ou Telegram.',
      'Bonjour ! Notre systeme est temporairement indisponible. Pour une assistance immediate, veuillez utiliser notre support WhatsApp ou Telegram disponible dans le menu.',
    ];
    return NextResponse.json({
      reply: fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)],
    });
  } catch (error) {
    console.error('Support chat error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez reessayer.' },
      { status: 500 }
    );
  }
}
