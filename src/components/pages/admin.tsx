'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from '@/components/router';
import { useAuth } from '@/components/auth-provider';
import { useSiteConfig } from '@/components/config-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalDeposits: number;
  totalRevenue: number;
  totalReferrals: number;
  totalBotUnlocks: number;
  totalPostbacks: number;
  recentUsers: number;
  recentDeposits: number;
  conversionRate: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  referralCode: string;
  isVerified1Win: boolean;
  totalDeposits: number;
  verifiedRefCount: number;
  rank: string;
  totalReferrals: number;
  botsUnlocked: number;
  eventCount: number;
  createdAt: string;
}

interface AdminGame {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  unlockType: string;
  unlockValue: number;
  tier: number;
  sortOrder: number;
  showOnLanding: boolean;
  createdAt: string;
}

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  sentAt: string;
  readCount: number;
  totalUsers: number;
}

interface AdminSuggestion {
  id: string;
  userId: string;
  username: string;
  message: string;
  hasScreenshot: boolean;
  status: string;
  adminReply: string | null;
  createdAt: string;
}

type AdminTab = 'stats' | 'users' | 'games' | 'postback' | 'notifications' | 'suggestions' | 'config';

// ─── Postback Link Item ──────────────────────────────────────────────────────

function PostbackLinkItem({ label, goal, desc }: { label: string; goal: string; desc: string }) {
  const [copied, setCopied] = useState(false);
  const link = `https://win-bots.vercel.app/api/postback?token=winbots_postback_secret_2024&sub1={sub1}&event_id={event_id}&goal=${goal}&amount={amount}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-slate-700 font-medium">{label}</Label>
        <Button
          variant="outline"
          size="sm"
          className={`rounded-lg h-7 text-xs transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`}
          onClick={() => { navigator.clipboard.writeText(link); setCopied(true); toast.success('Lien copie !'); setTimeout(() => setCopied(false), 2000); }}
        >
          {copied ? (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1 text-emerald-500"><path d="M20 6 9 17l-5-5"/></svg>Copie</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>Copier</>
          )}
        </Button>
      </div>
      <p className="text-xs text-slate-400">{desc}</p>
      <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-500 font-mono break-all leading-relaxed select-all">{link}</div>
    </div>
  );
}

// ─── Suggestion Detail Item ──────────────────────────────────────────────────

function SuggestionItem({ suggestion }: { suggestion: AdminSuggestion }) {
  const [expanded, setExpanded] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);
  const [reply, setReply] = useState(suggestion.adminReply || '');
  const [savingReply, setSavingReply] = useState(false);
  const [status, setStatus] = useState(suggestion.status);

  const handleExpand = useCallback(async () => {
    const shouldExpand = !expanded;
    setExpanded(shouldExpand);
    if (shouldExpand && suggestion.hasScreenshot && !screenshot) {
      setLoadingScreenshot(true);
      try {
        const res = await fetch(`/api/admin/suggestions/${suggestion.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.screenshot) setScreenshot(data.screenshot);
        }
      } catch {}
      setLoadingScreenshot(false);
    }
  }, [expanded, suggestion]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    setStatus(newStatus);
    try {
      const res = await fetch('/api/admin/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: suggestion.id, status: newStatus }),
      });
      if (!res.ok) {
        setStatus(suggestion.status);
        toast.error('Erreur lors de la mise a jour');
      }
    } catch {
      setStatus(suggestion.status);
    }
  }, [suggestion]);

  const handleReply = useCallback(async () => {
    setSavingReply(true);
    try {
      const res = await fetch('/api/admin/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: suggestion.id, adminReply: reply }),
      });
      if (res.ok) {
        toast.success('Reponse enregistree');
      } else {
        toast.error('Erreur lors de l\'enregistrement');
      }
    } catch {
      toast.error('Erreur serveur');
    }
    setSavingReply(false);
  }, [suggestion.id, reply]);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    reviewed: 'bg-emerald-100 text-emerald-700',
    dismissed: 'bg-slate-100 text-slate-500',
  };

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    reviewed: 'Traitee',
    dismissed: 'Ignoree',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        {/* Header row */}
        <button onClick={handleExpand} className="w-full text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">{suggestion.username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{suggestion.username}</p>
                <p className="text-xs text-slate-400">{formatDate(suggestion.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {suggestion.hasScreenshot && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  Photo
                </span>
              )}
              <Badge className={`rounded-full text-[10px] ${statusColors[status] || statusColors.pending}`}>
                {statusLabels[status] || statusLabels.pending}
              </Badge>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          {/* Preview text */}
          <p className="text-sm text-slate-600 mt-2 line-clamp-1">{suggestion.message}</p>
        </button>

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                {/* Full message */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Message</p>
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{suggestion.message}</p>
                </div>

                {/* Screenshot */}
                {suggestion.hasScreenshot && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Capture d&apos;ecran</p>
                    {loadingScreenshot ? (
                      <div className="w-full h-32 rounded-xl bg-slate-100 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : screenshot ? (
                      <img src={screenshot} alt="Capture d'ecran" className="max-w-full max-h-64 rounded-xl object-contain border border-slate-200" />
                    ) : (
                      <p className="text-xs text-slate-400">Impossible de charger l&apos;image</p>
                    )}
                  </div>
                )}

                {/* Status change */}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">Statut :</p>
                  <select
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="h-8 rounded-lg border border-slate-200 text-xs px-2 bg-white"
                  >
                    <option value="pending">En attente</option>
                    <option value="reviewed">Traitee</option>
                    <option value="dismissed">Ignoree</option>
                  </select>
                </div>

                {/* Admin reply */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Reponse (visible par l&apos;utilisateur)</p>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Ecrire une reponse..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none h-20 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                  />
                  <Button
                    onClick={handleReply}
                    disabled={savingReply || !reply.trim()}
                    size="sm"
                    className="rounded-lg text-xs bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {savingReply ? 'Envoi...' : 'Envoyer la reponse'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const { navigate, goBack } = useRouter();
  const { user } = useAuth();
  const { config, refresh: refreshConfig } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications state
  const [sentNotifications, setSentNotifications] = useState<AdminNotification[]>([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<AdminSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Config form state
  const [formConfig, setFormConfig] = useState({
    affiliate_link: '',
    promo_code: '',
    whatsapp_link: '',
    telegram_link: '',
    platform_name: '',
    platform_description: '',
    reward_total: '100',
    reward_first: '50',
    reward_second: '30',
    reward_third: '20',
  });
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchStats = useCallback(async () => {
    try { const res = await fetch('/api/admin/stats'); if (res.ok) setStats(await res.json()); } catch (e) { console.error(e); }
  }, []);

  const fetchUsers = useCallback(async (search = '') => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) { const data = await res.json(); setUsers(data.users); }
    } catch (e) { console.error(e); }
  }, []);

  const fetchGames = useCallback(async () => {
    try { const res = await fetch('/api/admin/games'); if (res.ok) { const data = await res.json(); setGames(data.games || []); } } catch (e) { console.error(e); }
  }, []);

  const fetchAdminConfig = useCallback(async () => {
    try { const res = await fetch('/api/admin/config'); if (res.ok) { const data = await res.json(); setFormConfig(prev => ({ ...prev, ...data.configs })); } } catch (e) { console.error(e); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try { const res = await fetch('/api/admin/notifications'); if (res.ok) { const data = await res.json(); setSentNotifications(data.notifications || []); } } catch {}
    setLoadingNotifs(false);
  }, []);

  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try { const res = await fetch('/api/admin/suggestions'); if (res.ok) { const data = await res.json(); setSuggestions(data.suggestions || []); } } catch {}
    setLoadingSuggestions(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('landing'); return; }
    const init = async () => {
      await Promise.all([fetchStats(), fetchUsers(), fetchGames(), fetchAdminConfig()]);
      setLoading(false);
    };
    init();
  }, [user, navigate, fetchStats, fetchUsers, fetchGames, fetchAdminConfig]);

  // Fetch notifications/suggestions when their tab is opened
  useEffect(() => {
    if (activeTab === 'notifications' && sentNotifications.length === 0) fetchNotifications();
    if (activeTab === 'suggestions' && suggestions.length === 0) fetchSuggestions();
  }, [activeTab, sentNotifications.length, suggestions.length, fetchNotifications, fetchSuggestions]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ configs: formConfig }) });
      if (res.ok) { toast.success('Configuration mise a jour avec succes'); refreshConfig(); }
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    setSavingConfig(false);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchUsers(searchQuery); };

  // Games management
  const [savingGame, setSavingGame] = useState<string | null>(null);
  const updateGameField = (gameId: string, field: string, value: any) => {
    setGames(prev => prev.map(g => g.id === gameId ? { ...g, [field]: value } : g));
  };

  const handleSaveGame = async (game: AdminGame) => {
    setSavingGame(game.id);
    try {
      const payload = { id: game.id, name: game.name, description: game.description, isActive: game.isActive, showOnLanding: game.showOnLanding, unlockType: game.unlockType, unlockValue: game.unlockValue, tier: game.tier };
      const res = await fetch('/api/admin/games', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) toast.success(`${game.name} mis a jour`);
      else { const errData = await res.json().catch(() => ({})); toast.error(`Erreur: ${errData.error || 'mise a jour echouee'}`); }
    } catch { toast.error('Erreur serveur'); }
    setSavingGame(null);
  };

  // Send notification
  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) { toast.error('Titre et message requis'); return; }
    setSendingNotif(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: notifTitle.trim(), message: notifMessage.trim() }),
      });
      if (res.ok) {
        toast.success('Notification envoyee a tous les utilisateurs');
        setNotifTitle('');
        setNotifMessage('');
        fetchNotifications();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de l\'envoi');
      }
    } catch { toast.error('Erreur serveur'); }
    setSendingNotif(false);
  };

  if (!user || user.role !== 'admin') return null;

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'stats', label: 'Statistiques' },
    { key: 'users', label: 'Utilisateurs' },
    { key: 'games', label: 'Jeux' },
    { key: 'postback', label: 'Postback' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'suggestions', label: 'Suggestions' },
    { key: 'config', label: 'Configuration' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="rounded-full">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <h1 className="text-lg font-bold text-slate-900">Panneau d&apos;administration</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-200/60 rounded-2xl mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            ) : stats && (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Utilisateurs totaux', value: stats.totalUsers, sub: `${stats.recentUsers} ces 7 derniers jours` },
                    { label: 'Utilisateurs verifies', value: stats.verifiedUsers, sub: `Taux : ${stats.conversionRate}%` },
                    { label: 'Depots recus', value: stats.totalDeposits, sub: `${stats.recentDeposits} ces 7 derniers jours` },
                    { label: 'Bots debloques', value: stats.totalBotUnlocks, sub: `Total evenements: ${stats.totalPostbacks}` },
                  ].map((s, i) => (
                    <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-slate-500 mb-1">{s.label}</p><p className="text-2xl font-bold text-slate-900">{s.value}</p><p className="text-xs text-slate-400 mt-1">{s.sub}</p></CardContent></Card>
                  ))}
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-slate-500 mb-1">Revenus totaux</p><p className="text-2xl font-bold text-emerald-600">${stats.totalRevenue.toFixed(2)}</p></CardContent></Card>
                  <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-slate-500 mb-1">Total parrainages</p><p className="text-2xl font-bold text-slate-900">{stats.totalReferrals}</p></CardContent></Card>
                  <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-xs text-slate-500 mb-1">Postbacks traites</p><p className="text-2xl font-bold text-slate-900">{stats.totalPostbacks}</p></CardContent></Card>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── Users ── */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <Input placeholder="Rechercher par nom, email ou code..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="rounded-xl flex-1" />
              <Button type="submit" variant="outline" className="rounded-xl">Rechercher</Button>
            </form>
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <Card className="border-0 shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100"><th className="text-left p-4 text-xs text-slate-500 font-medium">Utilisateur</th><th className="text-left p-4 text-xs text-slate-500 font-medium hidden sm:table-cell">Code</th><th className="text-center p-4 text-xs text-slate-500 font-medium">Verifie</th><th className="text-center p-4 text-xs text-slate-500 font-medium hidden md:table-cell">Filleuls</th><th className="text-center p-4 text-xs text-slate-500 font-medium hidden md:table-cell">Bots</th><th className="text-right p-4 text-xs text-slate-500 font-medium">Depots</th></tr></thead><tbody>{users.map(u => (<tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50"><td className="p-4"><div><p className="font-medium text-slate-900">{u.username}</p><p className="text-xs text-slate-400">{u.email}</p></div></td><td className="p-4 hidden sm:table-cell"><code className="text-xs bg-slate-100 px-2 py-1 rounded">{u.referralCode}</code></td><td className="p-4 text-center"><Badge className={`rounded-full ${u.isVerified1Win ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.isVerified1Win ? 'Oui' : 'Non'}</Badge></td><td className="p-4 text-center hidden md:table-cell">{u.verifiedRefCount}/{u.totalReferrals}</td><td className="p-4 text-center hidden md:table-cell">{u.botsUnlocked}</td><td className="p-4 text-right">${u.totalDeposits.toFixed(2)}</td></tr>))}</tbody></table></div></CardContent></Card>
            )}
          </motion.div>
        )}

        {/* ── Games ── */}
        {activeTab === 'games' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loading ? (
              <div className="space-y-3">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-3">
                {games.map((game) => (
                  <Card key={game.id} className={`border-0 shadow-sm ${!game.isActive ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="shrink-0"><div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-900"><Image src={game.image} alt={game.name} width={64} height={40} className="w-full h-full object-cover" unoptimized /></div></div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
                          <div className="space-y-2"><div className="flex items-center justify-between"><Label className="text-xs text-slate-500">Nom</Label><div className="flex items-center gap-2"><span className="text-xs text-slate-400">Actif</span><Switch checked={game.isActive} onCheckedChange={(checked) => updateGameField(game.id, 'isActive', checked)} /></div></div><Input value={game.name} onChange={e => updateGameField(game.id, 'name', e.target.value)} className="rounded-lg h-8 text-sm" /></div>
                          <div className="space-y-2"><div className="flex items-center justify-between"><Label className="text-xs text-slate-500">Debloquage</Label></div><div className="flex gap-2"><select value={game.unlockType} onChange={e => updateGameField(game.id, 'unlockType', e.target.value)} className="flex-1 h-8 rounded-lg border border-slate-200 text-xs px-2 bg-white"><option value="free">Gratuit</option><option value="deposit">Depot</option><option value="referral">Parrainage</option></select>{game.unlockType !== 'free' && <Input type="number" value={game.unlockValue} onChange={e => updateGameField(game.id, 'unlockValue', Number(e.target.value))} className="w-20 rounded-lg h-8 text-xs" placeholder={game.unlockType === 'deposit' ? '$' : 'Nb'} />}</div></div>
                          <div className="space-y-2"><div className="flex items-center justify-between"><Label className="text-xs text-slate-500">Landing</Label><Switch checked={game.showOnLanding} onCheckedChange={(checked) => updateGameField(game.id, 'showOnLanding', checked)} /></div></div>
                          <div className="flex items-end"><Button onClick={() => handleSaveGame(game)} disabled={savingGame === game.id} className="w-full rounded-lg h-8 text-xs bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700">{savingGame === game.id ? 'Sauvegarde...' : 'Sauvegarder'}</Button></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Postback ── */}
        {activeTab === 'postback' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Liens Postback</CardTitle><CardDescription>Copiez ces liens et configurez-les dans votre tableau de bord 1win partenaire.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <PostbackLinkItem label="Inscription (registration)" goal="reg" desc="Declenche quand un utilisateur s'inscrit sur 1win" />
                  <PostbackLinkItem label="Premier depot (first_deposit)" goal="first_deposit" desc="Declenche au premier depot de l'utilisateur" />
                  <PostbackLinkItem label="Depot (deposit)" goal="deposit" desc="Declenche a chaque depot de l'utilisateur" />
                  <PostbackLinkItem label="Revenu (revenue)" goal="revenue" desc="Declenche quand 1win genere des revenus" />
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="p-3 rounded-xl bg-amber-50 space-y-2">
                    <div className="flex items-start gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                      <div><p className="text-xs font-medium text-amber-800">Comment configurer</p><ol className="text-xs text-amber-700 mt-1 space-y-1 list-decimal list-inside"><li>Connectez-vous a votre tableau de bord 1win partenaire</li><li>Allez dans la section Postback / API</li><li>Ajoutez chaque lien ci-dessus avec le goal correspondant</li><li>Les macros {'{sub1}'}, {'{event_id}'} et {'{amount}'} seront remplacees automatiquement par 1win</li></ol></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Notifications ── */}
        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Send notification form */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-amber-500"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  Envoyer une notification
                </CardTitle>
                <CardDescription>Envoyez un message a tous les utilisateurs. Il apparaitra sur le bouton de support.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Titre</Label>
                  <Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="rounded-xl" placeholder="Ex : Mise a jour importante" maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Message</Label>
                  <textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none h-24 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all" placeholder="Ecrivez votre message..." maxLength={2000} />
                  <p className="text-right text-xs text-slate-400">{notifMessage.length}/2000</p>
                </div>
                <Button onClick={handleSendNotification} disabled={sendingNotif || !notifTitle.trim() || !notifMessage.trim()} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                  {sendingNotif ? 'Envoi en cours...' : 'Envoyer a tous les utilisateurs'}
                </Button>
              </CardContent>
            </Card>

            {/* Sent notifications list */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Notifications envoyees</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingNotifs ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
                ) : sentNotifications.length === 0 ? (
                  <div className="text-center py-8"><p className="text-sm text-slate-400">Aucune notification envoyee</p></div>
                ) : (
                  <div className="space-y-3">
                    {sentNotifications.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-900">{n.title}</h4>
                          <span className="text-xs text-slate-400">{n.readCount}/{n.totalUsers} lus</span>
                        </div>
                        <p className="text-sm text-slate-600">{n.message}</p>
                        <p className="text-xs text-slate-400">{new Date(n.sentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Suggestions ── */}
        {activeTab === 'suggestions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loadingSuggestions ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : suggestions.length === 0 ? (
              <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center"><p className="text-sm text-slate-400">Aucune suggestion recue pour le moment</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s) => (
                  <SuggestionItem key={s.id} suggestion={s} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Config ── */}
        {activeTab === 'config' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle>Configuration de la plateforme</CardTitle><CardDescription>Modifiez les parametres de la plateforme. Les changements sont effectifs immediatement.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-slate-700 font-medium">Nom de la plateforme</Label><Input value={formConfig.platform_name} onChange={e => setFormConfig(p => ({ ...p, platform_name: e.target.value }))} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label className="text-slate-700 font-medium">Code promo 1win</Label><Input value={formConfig.promo_code} onChange={e => setFormConfig(p => ({ ...p, promo_code: e.target.value }))} className="rounded-xl" /></div>
                  <div className="space-y-2 sm:col-span-2"><Label className="text-slate-700 font-medium">Lien d&apos;affiliation 1win</Label><Input value={formConfig.affiliate_link} onChange={e => setFormConfig(p => ({ ...p, affiliate_link: e.target.value }))} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label className="text-slate-700 font-medium">Lien WhatsApp</Label><Input value={formConfig.whatsapp_link} onChange={e => setFormConfig(p => ({ ...p, whatsapp_link: e.target.value }))} className="rounded-xl" placeholder="https://chat.whatsapp.com/..." /></div>
                  <div className="space-y-2"><Label className="text-slate-700 font-medium">Lien Telegram</Label><Input value={formConfig.telegram_link} onChange={e => setFormConfig(p => ({ ...p, telegram_link: e.target.value }))} className="rounded-xl" placeholder="https://t.me/..." /></div>
                </div>
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Recompenses mensuelles des parrains</h3>
                  <div className="grid sm:grid-cols-4 gap-4">
                    <div className="space-y-2"><Label className="text-slate-700 font-medium">Budget total ($)</Label><Input type="number" value={formConfig.reward_total} onChange={e => setFormConfig(p => ({ ...p, reward_total: e.target.value }))} className="rounded-xl" /></div>
                    <div className="space-y-2"><Label className="text-slate-700 font-medium">1er place ($)</Label><Input type="number" value={formConfig.reward_first} onChange={e => setFormConfig(p => ({ ...p, reward_first: e.target.value }))} className="rounded-xl" /></div>
                    <div className="space-y-2"><Label className="text-slate-700 font-medium">2e place ($)</Label><Input type="number" value={formConfig.reward_second} onChange={e => setFormConfig(p => ({ ...p, reward_second: e.target.value }))} className="rounded-xl" /></div>
                    <div className="space-y-2"><Label className="text-slate-700 font-medium">3e place ($)</Label><Input type="number" value={formConfig.reward_third} onChange={e => setFormConfig(p => ({ ...p, reward_third: e.target.value }))} className="rounded-xl" /></div>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-6">
                  <div className="space-y-2"><Label className="text-slate-700 font-medium">Description de la plateforme</Label><textarea value={formConfig.platform_description} onChange={e => setFormConfig(p => ({ ...p, platform_description: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none h-20 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" /></div>
                </div>
                <Button onClick={handleSaveConfig} disabled={savingConfig} className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold">
                  {savingConfig ? 'Enregistrement...' : 'Sauvegarder la configuration'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
