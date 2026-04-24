// Maps game slugs to their bot HTML folders
export const SLUG_TO_FOLDER: Record<string, string> = {
  fox: 'foxjob',
  lucky_jet: 'luckyjet',
  rocket: 'rocketqueen',
  rocket_queen: 'rocketqueen',
  rocketx: 'rocketx',
  tropicana: 'tropicana',
};

// Check if a game has a bot page
export function hasBotPage(slug: string): boolean {
  return slug in SLUG_TO_FOLDER;
}

// Get the bot page URL for a given slug
export function getBotPagePath(slug: string): string | null {
  const folder = SLUG_TO_FOLDER[slug];
  return folder ? `/bots/${slug}` : null;
}

// Get the iframe src for a given slug
export function getBotIframeSrc(slug: string): string | null {
  const folder = SLUG_TO_FOLDER[slug];
  return folder ? `/games/bots/${folder}/index.html` : null;
}
