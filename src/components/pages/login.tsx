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

export default function LoginPage() {
  const { navigate } = useRouter();
  const { login } = useAuth();
  const { config } = useSiteConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('dashboard');
    } else {
      setError(result.error || 'Erreur de connexion');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Mobile-optimized header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo.png" alt="WinBots" width={64} height={64} className="rounded-2xl shadow-lg shadow-sky-500/20 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Bon retour</h1>
          <p className="text-sm text-slate-500 mt-1">Connectez-vous a votre compte {config.platform_name}</p>
        </div>

        <Card className="border-0 shadow-sm bg-slate-50/50">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium text-sm">Email</Label>
                <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="rounded-xl h-12 border-slate-200 focus:border-sky-500 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Mot de passe</Label>
                <Input id="password" type="password" placeholder="Votre mot de passe" value={password} onChange={e => setPassword(e.target.value)} required className="rounded-xl h-12 border-slate-200 focus:border-sky-500 text-base" />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-xl h-12 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-sky-500/25 text-base">
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </form>
            <div className="mt-5 text-center">
              <p className="text-sm text-slate-500">Pas encore de compte ?</p>
              <Button variant="link" onClick={() => navigate('register')} className="text-sky-600 font-medium text-sm p-0 h-auto mt-1">
                Creer un compte
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
