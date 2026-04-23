'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from '@/components/router';
import { useAuth } from '@/components/auth-provider';
import { useSiteConfig } from '@/components/config-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { RANK_THRESHOLDS, isGameUnlocked } from '@/lib/bots';
import { toast } from 'sonner';

// WhatsApp SVG
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

// Telegram SVG
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
);

// Copy SVG
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);

// Check SVG (for copied state)
const CheckBadgeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-500"><path d="M20 6 9 17l-5-5"/></svg>
);

// Share SVG
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
);

// External Link SVG
const ExternalLinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
);

// Check SVG
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 6 9 17l-5-5"/></svg>
);

interface UserStats {
  totalReferrals: number;
  verifiedReferrals: number;
  totalEvents: number;
  totalDeposits: number;
  botsUnlocked: number;
  monthlyRank: number | null;
  monthlyReward: number;
}

interface GameData {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  color: string;
  icon: string;
  unlockType: string;
  unlockValue: number;
  tier: number;
  isActive: boolean;
}

export default function DashboardPage() {
  const { navigate } = useRouter();
  const { user, logout } = useAuth();
  const { config } = useSiteConfig();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [unlockedBotIds, setUnlockedBotIds] = useState<string[]>([]);
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bots' | 'invite'>('overview');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/user/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUnlockedBotIds(data.unlockedBots || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/user/bots');
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
        setUnlockedBotIds(data.unlockedBots || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchGames();
    }
  }, [user, fetchStats, fetchGames]);

  const copyReferralLink = () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}?ref=${user?.referralCode}` : '';
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Lien d\'invitation copie !');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPromoCode = () => {
    if (config.promo_code) {
      navigator.clipboard.writeText(config.promo_code);
      setCopiedPromo(true);
      toast.success('Code promo copie !');
      setTimeout(() => setCopiedPromo(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}?ref=${user?.referralCode}` : '';
    const text = `Tu cherches un moyen de gagner plus sur les jeux casino ? Rejoins WinBots et accede a des bots de prediction gratuits pour Aviator, Crash, Dice et plus. Inscription rapide, premier bot debloque immediatement. Clique ici : ${link}`;
    const url = config.whatsapp_link ? `${config.whatsapp_link}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareTelegram = () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}?ref=${user?.referralCode}` : '';
    const text = `Tu cherches un moyen de gagner plus sur les jeux casino ? Rejoins WinBots et accede a des bots de prediction gratuits pour Aviator, Crash, Dice et plus. Inscription rapide, premier bot debloque immediatement. Clique ici : ${link}`;
    const url = config.telegram_link ? `${config.telegram_link}?text=${encodeURIComponent(text)}` : `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleLogout = async () => {
    await logout();
    navigate('landing');
  };

  const rankInfo = RANK_THRESHOLDS.find(r => r.rank === user?.rank) || RANK_THRESHOLDS[0];
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}?ref=${user?.referralCode}` : '';
  const personal1WinLink = user ? `${config.affiliate_link}?sub1=${user.id}` : config.affiliate_link;

  // Check referral code from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        sessionStorage.setItem('referralCode', ref);
      }
    }
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="WinBots" width={32} height={32} className="rounded-xl" />
            <span className="text-base font-bold text-slate-900">{config.platform_name}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100">
              <div className={`w-2 h-2 rounded-full ${user.isVerified1Win ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-xs font-medium text-slate-700 max-w-[60px] sm:max-w-[80px] truncate">{user.username}</span>
            </div>
            <Badge variant="secondary" className={`${rankInfo.color} text-white rounded-full text-[10px] px-1.5 py-0.5`}>{rankInfo.label}</Badge>
            {user.role === 'admin' && (
              <Button variant="outline" size="sm" onClick={() => navigate('admin')} className="rounded-full text-[10px] sm:text-xs h-7 px-2 border-sky-200 text-sky-600 hover:bg-sky-50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 sm:mr-1"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 rounded-full h-7 w-7 p-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4">
        {/* Mobile Tabs */}
        <div className="flex gap-1 p-1 bg-slate-200/60 rounded-2xl mb-5">
          {([
            { key: 'overview' as const, label: 'Accueil' },
            { key: 'bots' as const, label: 'Bots' },
            { key: 'invite' as const, label: 'Inviter' },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Stats Grid - Mobile First */}
              {loading ? (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                </div>
              ) : stats && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Invites', value: stats.totalReferrals, sub: `${stats.verifiedReferrals} actifs` },
                    { label: 'Depots', value: `$${user.totalDeposits.toFixed(0)}`, sub: 'cumules' },
                    { label: 'Bots', value: `${stats.botsUnlocked}/${games.length || '--'}`, sub: 'debloques' },
                    { label: 'Rang', value: stats.monthlyRank ? `#${stats.monthlyRank}` : '--', sub: stats.monthlyReward > 0 ? `+$${stats.monthlyReward}` : 'Non classe' },
                  ].map((stat, i) => (
                    <Card key={i} className="border-0 shadow-sm bg-white">
                      <CardContent className="p-3.5">
                        <p className="text-xs text-slate-500 mb-0.5">{stat.label}</p>
                        <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* 1Win Affiliate Link Card - with sub1 tracking */}
              <Card className="border-0 shadow-sm bg-white mb-5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Inscrivez-vous sur 1win</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Utilisez ce lien pour que votre inscription soit comptabilisee automatiquement</p>
                    </div>
                    {user.isVerified1Win ? (
                      <Badge className="bg-emerald-100 text-emerald-700 rounded-full text-xs">Verifie</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 rounded-full text-xs">En attente</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2.5 rounded-xl bg-slate-100 text-xs text-slate-600 font-mono truncate min-w-0">
                      {personal1WinLink}
                    </div>
                    <Button onClick={() => window.open(personal1WinLink, '_blank')} size="sm" className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white shrink-0 h-9 px-3 text-xs">
                      S&apos;inscrire <ExternalLinkIcon />
                    </Button>
                  </div>
                  {config.promo_code && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500">Code promo :</span>
                      <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-100 to-blue-100 text-xs font-bold text-sky-700 tracking-wider">
                        {config.promo_code}
                      </div>
                      <Button onClick={copyPromoCode} variant="outline" size="sm" className={`rounded-lg h-7 w-7 p-0 transition-all duration-200 ${copiedPromo ? 'bg-emerald-50 border-emerald-200' : ''}`}>
                        {copiedPromo ? <CheckBadgeIcon /> : <CopyIcon />}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Card */}
              {!user.isVerified1Win && (
                <Card className="border-0 shadow-sm bg-amber-50 mb-5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm">Inscription 1win requise</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Cliquez sur le lien ci-dessus pour vous inscrire sur 1win et debloquer vos avantages.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Social Links */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm mb-3">Rejoignez nos communautes</h3>
                  <div className="flex gap-3">
                    {config.whatsapp_link && (
                      <Button variant="outline" onClick={() => window.open(config.whatsapp_link, '_blank')} className="rounded-xl flex-1 h-11 text-sm">
                        <div className="w-5 h-5 mr-2 text-green-600"><WhatsAppIcon /></div>
                        WhatsApp
                      </Button>
                    )}
                    {config.telegram_link && (
                      <Button variant="outline" onClick={() => window.open(config.telegram_link, '_blank')} className="rounded-xl flex-1 h-11 text-sm">
                        <div className="w-5 h-5 mr-2 text-blue-500"><TelegramIcon /></div>
                        Telegram
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'bots' && (
            <motion.div key="bots" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {games.length === 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[...Array(20)].map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                  {games.map((game, index) => {
                    const isUnlocked = unlockedBotIds.includes(game.slug) || isGameUnlocked(game, {
                      totalDeposits: user.totalDeposits,
                      verifiedRefCount: user.verifiedRefCount,
                    });
                    return (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15, delay: index * 0.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="group"
                      >
                        <div
                          className={`relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-slate-100 ${!isUnlocked ? 'opacity-50' : ''}`}
                        >
                          {/* Game image - original aspect ratio preserved */}
                          <img
                            src={game.image}
                            alt={game.name}
                            className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {/* Subtle lock badge for locked games */}
                          {!isUnlocked && (
                            <div className="absolute top-1.5 right-1.5">
                              <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'invite' && (
            <motion.div key="invite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {/* Invite Link */}
              <Card className="border-0 shadow-sm bg-white mb-5">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">Votre lien d&apos;invitation</h3>
                  <p className="text-xs text-slate-500 mb-3">Partagez ce lien et debloquez des bots premium</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 p-2.5 rounded-xl bg-slate-100 text-xs text-slate-600 font-mono truncate min-w-0">
                      {referralLink}
                    </div>
                    <Button onClick={copyReferralLink} variant="outline" size="sm" className={`rounded-xl shrink-0 h-9 w-9 p-0 transition-all duration-200 ${copied ? 'bg-emerald-50 border-emerald-200' : ''}`}>
                      {copied ? <CheckBadgeIcon /> : <CopyIcon />}
                    </Button>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">Code : {user.referralCode}</div>
                  <div className="flex gap-2">
                    <Button onClick={shareWhatsApp} variant="outline" className="rounded-xl flex-1 h-10 text-xs">
                      <div className="w-4 h-4 mr-1.5 text-green-600"><WhatsAppIcon /></div>
                      WhatsApp
                    </Button>
                    <Button onClick={shareTelegram} variant="outline" className="rounded-xl flex-1 h-10 text-xs">
                      <div className="w-4 h-4 mr-1.5 text-blue-500"><TelegramIcon /></div>
                      Telegram
                    </Button>
                    <Button onClick={() => { navigator.clipboard.writeText(`Tu cherches un moyen de gagner plus sur les jeux casino ? Rejoins WinBots et accede a des bots de prediction gratuits. Clique ici : ${referralLink}`); }} variant="outline" className="rounded-xl h-10 px-3 text-xs">
                      <ShareIcon />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Leaderboard Mini */}
              <Card className="border-0 shadow-sm bg-white mb-5">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Classement mensuel</CardTitle>
                    <Button variant="link" className="text-sky-600 p-0 h-auto text-xs" onClick={() => navigate('leaderboard')}>Voir tout</Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <LeaderboardMini />
                </CardContent>
              </Card>

              {/* Rewards Info */}
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm mb-3">Recompenses mensuelles</h3>
                  <p className="text-xs text-slate-500 mb-3">Les 3 meilleurs du mois gagnent des recompenses en argent.</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50">
                      <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">1</div>
                      <div className="flex-1"><span className="font-medium text-slate-900 text-sm">Premier place</span></div>
                      <span className="font-bold text-amber-700 text-sm">$50</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="w-9 h-9 rounded-full bg-slate-400 text-white flex items-center justify-center font-bold text-sm">2</div>
                      <div className="flex-1"><span className="font-medium text-slate-900 text-sm">Deuxieme place</span></div>
                      <span className="font-bold text-slate-600 text-sm">$30</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50">
                      <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                      <div className="flex-1"><span className="font-medium text-slate-900 text-sm">Troisieme place</span></div>
                      <span className="font-bold text-orange-700 text-sm">$20</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Mini leaderboard component
function LeaderboardMini() {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/referrals/leaderboard')
      .then(r => r.json())
      .then(d => { setData(d.leaderboard || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>;
  }

  if (data.length === 0) {
    return <p className="text-xs text-slate-500 text-center py-6">Aucun classement pour le moment. Soyez le premier !</p>;
  }

  return (
    <div className="space-y-1.5">
      {data.slice(0, 10).map((item, i) => (
        <div key={item.userId} className={`flex items-center gap-2.5 p-2.5 rounded-xl ${i < 3 ? 'bg-gradient-to-r from-slate-50 to-white' : ''}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {item.position}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-slate-900 text-xs truncate">{item.username}</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-slate-700">{item.verifiedReferrals}</span>
            <span className="text-xs text-slate-400 ml-0.5">actifs</span>
          </div>
          {item.monthlyReward > 0 && (
            <Badge className="bg-emerald-100 text-emerald-700 rounded-full text-xs px-1.5 py-0 shrink-0">+${item.monthlyReward}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
