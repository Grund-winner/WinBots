'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from '@/components/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  position: number;
  userId: string;
  username: string;
  referralCode: string;
  verifiedReferrals: number;
  totalDeposits: number;
  rank: string;
  monthlyReward: number;
  monthlyRank: number | null;
}

export default function LeaderboardPage() {
  const { navigate, goBack } = useRouter();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/referrals/leaderboard')
      .then(r => r.json())
      .then(d => { setData(d.leaderboard || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goBack} className="rounded-full h-8 w-8 p-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <h1 className="text-base font-bold text-slate-900">Classement mensuel</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5">
        {/* Top 3 Podium - Mobile Optimized */}
        {!loading && data.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 0, 2].map((podiumIndex) => {
              const entry = data[podiumIndex];
              if (!entry) return null;
              const isFirst = podiumIndex === 0;
              return (
                <motion.div key={entry.userId} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: podiumIndex * 0.1 }}>
                  <Card className={`border-0 shadow-sm text-center ${isFirst ? 'ring-2 ring-amber-300 bg-white' : 'bg-white'}`}>
                    <CardContent className="p-3">
                      <div className={`w-10 h-10 rounded-full mx-auto mb-1.5 flex items-center justify-center font-bold text-sm ${podiumIndex === 0 ? 'bg-amber-500 text-white' : podiumIndex === 1 ? 'bg-slate-400 text-white' : 'bg-orange-500 text-white'}`}>
                        {entry.position}
                      </div>
                      <p className="font-semibold text-slate-900 text-xs truncate">{entry.username}</p>
                      <p className="text-xs text-slate-500">{entry.verifiedReferrals} actifs</p>
                      <Badge className={`mt-1.5 rounded-full text-xs ${entry.monthlyReward > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {entry.monthlyReward > 0 ? `+$${entry.monthlyReward}` : '--'}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full List */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm">Tous les participants</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {loading ? (
              <div className="space-y-2">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : data.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-10">Aucun classement pour le moment</p>
            ) : (
              <div className="space-y-1.5">
                {data.map((entry) => (
                  <div key={entry.userId} className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-slate-50 ${entry.position <= 3 ? 'bg-gradient-to-r from-slate-50 to-transparent' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${entry.position === 1 ? 'bg-amber-500 text-white' : entry.position === 2 ? 'bg-slate-400 text-white' : entry.position === 3 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {entry.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{entry.username}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-700">{entry.verifiedReferrals}</p>
                      <p className="text-xs text-slate-400">actifs</p>
                    </div>
                    {entry.monthlyReward > 0 && (
                      <Badge className="bg-emerald-100 text-emerald-700 rounded-full text-xs shrink-0">+${entry.monthlyReward}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
