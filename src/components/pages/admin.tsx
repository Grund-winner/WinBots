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
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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

export default function AdminPage() {
  const { navigate, goBack } = useRouter();
  const { user } = useAuth();
  const { config, refresh: refreshConfig } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'games' | 'config'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchUsers = useCallback(async (search = '') => {
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/games');
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchAdminConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        setFormConfig(prev => ({ ...prev, ...data.configs }));
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('landing');
      return;
    }
    const init = async () => {
      await Promise.all([fetchStats(), fetchUsers(), fetchGames(), fetchAdminConfig()]);
      setLoading(false);
    };
    init();
  }, [user, navigate, fetchStats, fetchUsers, fetchGames, fetchAdminConfig]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: formConfig }),
      });
      if (res.ok) {
        toast.success('Configuration mise a jour avec succes');
        refreshConfig();
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
    setSavingConfig(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  // Games management
  const [savingGame, setSavingGame] = useState<string | null>(null);

  const updateGameField = (gameId: string, field: string, value: any) => {
    setGames(prev => prev.map(g => g.id === gameId ? { ...g, [field]: value } : g));
  };

  const handleSaveGame = async (game: AdminGame) => {
    setSavingGame(game.id);
    try {
      const res = await fetch('/api/admin/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: game.id,
          name: game.name,
          description: game.description,
          isActive: game.isActive,
          showOnLanding: game.showOnLanding,
          unlockType: game.unlockType,
          unlockValue: game.unlockValue,
          tier: game.tier,
        }),
      });
      if (res.ok) {
        toast.success(`${game.name} mis a jour`);
      } else {
        toast.error('Erreur lors de la mise a jour');
      }
    } catch {
      toast.error('Erreur serveur');
    }
    setSavingGame(null);
  };

  if (!user || user.role !== 'admin') return null;

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
        <div className="flex gap-1 p-1 bg-slate-200/60 rounded-2xl mb-6 max-w-xl overflow-x-auto">
          {([
            { key: 'stats' as const, label: 'Statistiques' },
            { key: 'users' as const, label: 'Utilisateurs' },
            { key: 'games' as const, label: 'Jeux' },
            { key: 'config' as const, label: 'Configuration' },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
            ) : stats && (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Utilisateurs totaux', value: stats.totalUsers, sub: `${stats.recentUsers} ces 7 derniers jours` },
                    { label: 'Utilisateurs verifies', value: stats.verifiedUsers, sub: `Taux : ${stats.conversionRate}%` },
                    { label: 'Depots recus', value: stats.totalDeposits, sub: `${stats.recentDeposits} ces 7 derniers jours` },
                    { label: 'Bots debloques', value: stats.totalBotUnlocks, sub: `Total evenements: ${stats.totalPostbacks}` },
                  ].map((s, i) => (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                        <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500 mb-1">Revenus totaux</p>
                      <p className="text-2xl font-bold text-emerald-600">${stats.totalRevenue.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500 mb-1">Total parrainages</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.totalReferrals}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500 mb-1">Postbacks traites</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.totalPostbacks}</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <Input placeholder="Rechercher par nom, email ou code..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="rounded-xl flex-1" />
              <Button type="submit" variant="outline" className="rounded-xl">Rechercher</Button>
            </form>
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left p-4 text-xs text-slate-500 font-medium">Utilisateur</th>
                          <th className="text-left p-4 text-xs text-slate-500 font-medium hidden sm:table-cell">Code</th>
                          <th className="text-center p-4 text-xs text-slate-500 font-medium">Verifie</th>
                          <th className="text-center p-4 text-xs text-slate-500 font-medium hidden md:table-cell">Filleuls</th>
                          <th className="text-center p-4 text-xs text-slate-500 font-medium hidden md:table-cell">Bots</th>
                          <th className="text-right p-4 text-xs text-slate-500 font-medium">Depots</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-slate-900">{u.username}</p>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                            </td>
                            <td className="p-4 hidden sm:table-cell"><code className="text-xs bg-slate-100 px-2 py-1 rounded">{u.referralCode}</code></td>
                            <td className="p-4 text-center">
                              <Badge className={`rounded-full ${u.isVerified1Win ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {u.isVerified1Win ? 'Oui' : 'Non'}
                              </Badge>
                            </td>
                            <td className="p-4 text-center hidden md:table-cell">{u.verifiedRefCount}/{u.totalReferrals}</td>
                            <td className="p-4 text-center hidden md:table-cell">{u.botsUnlocked}</td>
                            <td className="p-4 text-right">${u.totalDeposits.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

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
                        {/* Game image thumbnail */}
                        <div className="shrink-0">
                          <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-900">
                            <Image src={game.image} alt={game.name} width={64} height={40} className="w-full h-full object-cover" unoptimized />
                          </div>
                        </div>

                        {/* Game settings */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
                          {/* Name + Active */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-slate-500">Nom</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Actif</span>
                                <Switch checked={game.isActive} onCheckedChange={(checked) => updateGameField(game.id, 'isActive', checked)} />
                              </div>
                            </div>
                            <Input value={game.name} onChange={e => updateGameField(game.id, 'name', e.target.value)} className="rounded-lg h-8 text-sm" />
                          </div>

                          {/* Unlock type + value */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-slate-500">Debloquage</Label>
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={game.unlockType}
                                onChange={e => updateGameField(game.id, 'unlockType', e.target.value)}
                                className="flex-1 h-8 rounded-lg border border-slate-200 text-xs px-2 bg-white"
                              >
                                <option value="free">Gratuit</option>
                                <option value="deposit">Depot</option>
                                <option value="referral">Parrainage</option>
                              </select>
                              {game.unlockType !== 'free' && (
                                <Input
                                  type="number"
                                  value={game.unlockValue}
                                  onChange={e => updateGameField(game.id, 'unlockValue', Number(e.target.value))}
                                  className="w-20 rounded-lg h-8 text-xs"
                                  placeholder={game.unlockType === 'deposit' ? '$' : 'Nb'}
                                />
                              )}
                            </div>
                          </div>

                          {/* Tier + Show on landing */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-slate-500">Niveau</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Landing</span>
                                <Switch checked={game.showOnLanding} onCheckedChange={(checked) => updateGameField(game.id, 'showOnLanding', checked)} />
                              </div>
                            </div>
                            <select
                              value={game.tier}
                              onChange={e => updateGameField(game.id, 'tier', Number(e.target.value))}
                              className="w-full h-8 rounded-lg border border-slate-200 text-xs px-2 bg-white"
                            >
                              {[1, 2, 3, 4, 5, 6].map(t => (
                                <option key={t} value={t}>Niveau {t}</option>
                              ))}
                            </select>
                          </div>

                          {/* Save button */}
                          <div className="flex items-end">
                            <Button
                              onClick={() => handleSaveGame(game)}
                              disabled={savingGame === game.id}
                              className="w-full rounded-lg h-8 text-xs bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700"
                            >
                              {savingGame === game.id ? 'Sauvegarde...' : 'Sauvegarder'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Configuration de la plateforme</CardTitle>
                <CardDescription>Modifiez les parametres de la plateforme. Les changements sont effectifs immediatement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Nom de la plateforme</Label>
                    <Input value={formConfig.platform_name} onChange={e => setFormConfig(p => ({ ...p, platform_name: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Code promo 1win</Label>
                    <Input value={formConfig.promo_code} onChange={e => setFormConfig(p => ({ ...p, promo_code: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-slate-700 font-medium">Lien d&apos;affiliation 1win</Label>
                    <Input value={formConfig.affiliate_link} onChange={e => setFormConfig(p => ({ ...p, affiliate_link: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Lien WhatsApp</Label>
                    <Input value={formConfig.whatsapp_link} onChange={e => setFormConfig(p => ({ ...p, whatsapp_link: e.target.value }))} className="rounded-xl" placeholder="https://chat.whatsapp.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Lien Telegram</Label>
                    <Input value={formConfig.telegram_link} onChange={e => setFormConfig(p => ({ ...p, telegram_link: e.target.value }))} className="rounded-xl" placeholder="https://t.me/..." />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Recompenses mensuelles des parrains</h3>
                  <div className="grid sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Budget total ($)</Label>
                      <Input type="number" value={formConfig.reward_total} onChange={e => setFormConfig(p => ({ ...p, reward_total: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">1er place ($)</Label>
                      <Input type="number" value={formConfig.reward_first} onChange={e => setFormConfig(p => ({ ...p, reward_first: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">2e place ($)</Label>
                      <Input type="number" value={formConfig.reward_second} onChange={e => setFormConfig(p => ({ ...p, reward_second: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">3e place ($)</Label>
                      <Input type="number" value={formConfig.reward_third} onChange={e => setFormConfig(p => ({ ...p, reward_third: e.target.value }))} className="rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Description de la plateforme</Label>
                    <textarea value={formConfig.platform_description} onChange={e => setFormConfig(p => ({ ...p, platform_description: e.target.value }))} className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none h-20 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                  </div>
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
