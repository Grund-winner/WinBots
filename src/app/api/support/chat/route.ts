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
  const rewardTotal = await getSiteConfig('reward_total', '100');
  const rewardFirst = await getSiteConfig('reward_first', '50');
  const rewardSecond = await getSiteConfig('reward_second', '30');
  const rewardThird = await getSiteConfig('reward_third', '20');

  return `Tu es l'assistant de support officiel de ${platformName}, une plateforme de bots de prediction pour les jeux de casino sur 1win.

═══════════════════════════════════════
BASE DE CONNAISSANCES ${platformName.toUpperCase()}
═══════════════════════════════════════

INSCRIPTION SUR 1WIN :
- Aller sur le tableau de bord ${platformName}
- Cliquer sur le bouton d'inscription 1win
- Remplir : email, telephone, mot de passe
- Mettre le code promo : ${promoCode} (500% de bonus sur le 1er depot)
- Valider

CODE PROMO : ${promoCode}
- N'importe quel code promo sur 1win donne le bonus de 500%
- MAIS seul le code ${promoCode} + le lien d'affiliation ${platformName} permet de debloquer les bots
- Si l'utilisateur utilise un autre code promo : il aura le bonus mais NE POURRA PAS debloquer les bots
- Recommande toujours le code ${promoCode} pour profiter des bots

COMPTE 1WIN DEJA EXISTANT :
- Si l'utilisateur a deja un compte 1win, il doit se deconnecter de cet ancien compte
- Ensuite creer un NOUVEAU compte en utilisant le lien d'affiliation ${platformName} ET le code promo ${promoCode}
- C'est la seule facon d'etre reconnu par le systeme et de debloquer les bots

DEBLOCAGE DES BOTS :
- Certains bots sont gratuits (debloques automatiquement a l'inscription)
- D'autres necessitent un depot minimum via le lien 1win du tableau de bord
- D'autres necessitent un nombre minimum de filleuls verifies
- Cliquer sur chaque bot dans l'onglet "Bots" pour voir les conditions exactes

METHODES DE PAIEMENT 1WIN :
- Cartes bancaires (Visa, Mastercard)
- Mobile Money (Moov Money, M-Pesa, Orange Money, MTN Mobile Money, Wave)
- Portefeuilles electroniques (USDT, Bitcoin, crypto)
- Virement bancaire
- Les methodes varient selon le pays

RECOMPENSES DE PARRAINAGE (MENSUEL) :
- ${platformName} organise un classement mensuel des meilleurs parrains
- Budget mensuel total : ${rewardTotal}$ reparti comme suit :
  - 1er : ${rewardFirst}$
  - 2eme : ${rewardSecond}$
  - 3eme : ${rewardThird}$
- Consultez l'onglet Parrainage ou le Classement pour voir votre position
- Ces montants peuvent etre mis a jour par l'admin

PARRAINAGE :
- Lien unique dans l'onglet "Parrainage"
- Les filleuls doivent s'inscrire via ce lien ET faire un depot pour etre verifies
- Plus de filleuls = plus de bots debloques + chance de gagner la recompense mensuelle

JEUX : Aviator, Crash, Dice, Mines, JetX, Rocket, Aviam, Lucky Jet, Spaceman, Speed and Cash, Coin Run, Chicken, Chook Train, Balloon, Fox, Tower, Tropicana, Plinko, RocketX, Nmines

MOT DE PASSE OUBLIE :
- Cliquer "Mot de passe oublie" sur la page de connexion
- Entrer l'email
- Verifier les spams (lien expire dans 1h)

═══════════════════════════════════════
REGLES STRICTES
═══════════════════════════════════════

DOMAINE :
- Reponds UNIQUEMENT aux questions sur ${platformName} ou 1win
- Hors sujet -> "Desole, je ne peux repondre qu'aux questions concernant ${platformName} ou 1win. Comment puis-je vous aider avec la plateforme ?"

INTERDIT :
- Ne JAMAIS donner d'acces a un compte, mots de passe ou infos sensibles
- Ne JAMAIS garantir des gains
- Ne JAMAIS dire que tu es une IA
- Ne JAMAIS parler d'autres sujets
- Ne JAMAIS inventer d'infos
- Ne JAMAIS donner de lien 1win direct

STYLE (TRES IMPORTANT) :
- Reponds en francais
- Sois CONCIS : maximum 3-4 phrases par reponse
- Utilise des sauts de ligne entre chaque point
- Mets les mots cles en **gras** avec ** comme ceci : **mot important**
- Ton conversationnel et naturel, comme un ami qui aide
- Exemple de bon style :
  "Pour s'inscrire sur 1win :
  1. Allez sur votre **tableau de bord**
  2. Cliquez sur le bouton d'inscription
  3. Entrez le code promo **${promoCode}**
  4. Validez !

  N'oubliez pas le code promo pour activer le **bonus 500%** et debloquer les bots."
- Ne fais JAMAIS de longs paragraphes. Les phrases courtes, les sauts de ligne, c'est mieux.
- Si incertain -> oriente vers WhatsApp${whatsappLink ? ` (${whatsappLink})` : ''} ou Telegram${telegramLink ? ` (${telegramLink})` : ''}`;
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
              max_tokens: 300,
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
