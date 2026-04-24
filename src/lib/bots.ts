export const RANK_THRESHOLDS = [
  { rank: 'bronze', minScore: 0, label: 'Bronze', color: 'bg-amber-700' },
  { rank: 'silver', minScore: 3, label: 'Argent', color: 'bg-gray-400' },
  { rank: 'gold', minScore: 10, label: 'Or', color: 'bg-yellow-500' },
  { rank: 'diamond', minScore: 25, label: 'Diamant', color: 'bg-cyan-400' },
];

interface GameData {
  unlockType: string;
  unlockValue: number;
}

interface UserData {
  totalDeposits: number;
  verifiedRefCount: number;
}

export function isGameUnlocked(game: GameData, user: UserData): boolean {
  switch (game.unlockType) {
    case 'free':
      return true;
    case 'deposit':
      return user.totalDeposits >= game.unlockValue;
    case 'referral':
      return user.verifiedRefCount >= game.unlockValue;
    default:
      return false;
  }
}
