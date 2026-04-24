'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from '@/components/router';
import { useAuth } from '@/components/auth-provider';
import { useSiteConfig } from '@/components/config-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { navigate } = useRouter();
  const { register, login } = useAuth();
  const { config } = useSiteConfig();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill referral code from URL
  const [referralCode, setReferralCode] = useState(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) return ref.toUpperCase();
    const stored = sessionStorage.getItem('referralCode');
    if (stored) {
      sessionStorage.removeItem('referralCode');
      return stored.toUpperCase();
    }
    return '';
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register(username, email, password, referralCode || undefined);
    if (result.success) {
      const loginResult = await login(email, password);
      if (loginResult.success) {
        navigate('dashboard');
      } else {
        navigate('login');
      }
    } else {
      setError(result.error || "Erreur d'inscription");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo.png" alt="WinBots" width={64} height={64} className="rounded-2xl shadow-lg shadow-sky-500/20 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Creer un compte</h1>
          <p className="text-sm text-slate-500 mt-1">Rejoignez {config.platform_name} et debloquez vos premiers bots</p>
        </div>

        <Card className="border-0 shadow-sm bg-slate-50/50">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-medium text-sm">Nom d&apos;utilisateur</Label>
                <Input id="username" type="text" placeholder="Choisissez un pseudo" value={username} onChange={e => setUsername(e.target.value)} required minLength={3} className="rounded-xl h-12 border-slate-200 focus:border-sky-500 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium text-sm">Email</Label>
                <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="rounded-xl h-12 border-slate-200 focus:border-sky-500 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Mot de passe</Label>
                <Input id="password" type="password" placeholder="Minimum 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="rounded-xl h-12 border-slate-200 focus:border-sky-500 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referral" className="text-slate-700 font-medium text-sm">
                  Code d&apos;invitation <span className="text-slate-400 font-normal">(optionnel)</span>
                </Label>
                <Input id="referral" type="text" placeholder="Entrez le code d'invitation" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} className="rounded-xl h-12 border-slate-200 focus:border-sky-500 text-base" />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-xl h-12 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-sky-500/25 text-base">
                {loading ? 'Inscription en cours...' : 'Creer mon compte'}
              </Button>
            </form>
            <div className="mt-5 text-center">
              <p className="text-sm text-slate-500">Deja un compte ?</p>
              <Button variant="link" onClick={() => navigate('login')} className="text-sky-600 font-medium text-sm p-0 h-auto mt-1">
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
