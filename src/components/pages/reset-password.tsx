'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from '@/components/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordPage() {
  const { navigate } = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [validToken, setValidToken] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('token');
      if (t) {
        setToken(t);
      } else {
        setValidToken(false);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      setError('Token invalide');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erreur');
      }
    } catch {
      setError('Erreur de connexion');
    }
    setLoading(false);
  };

  // Invalid or missing token
  if (!validToken || !token) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm text-center"
        >
          <Image src="/logo.png" alt="WinBots" width={64} height={64} className="rounded-2xl shadow-lg shadow-sky-500/20 mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Lien invalide</h1>
          <p className="text-sm text-slate-500 mb-6">Ce lien de reinitialisation est invalide ou a expire. Veuillez demander un nouveau lien.</p>
          <Button onClick={() => navigate('login')} className="rounded-xl h-12 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-sky-500/25">
            Retour a la connexion
          </Button>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-emerald-600">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Mot de passe mis a jour</h1>
          <p className="text-sm text-slate-500 mb-6">Votre mot de passe a ete change avec succes. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          <Button onClick={() => navigate('login')} className="rounded-xl h-12 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-sky-500/25 w-full max-w-[200px]">
            Se connecter
          </Button>
        </motion.div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo.png" alt="WinBots" width={64} height={64} className="rounded-2xl shadow-lg shadow-sky-500/20 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
          <p className="text-sm text-slate-500 mt-1">Choisissez un mot de passe fort et securise</p>
        </div>

        <Card className="border-0 shadow-sm bg-slate-50/50">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium text-sm">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 caracteres + chiffre"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="rounded-xl h-12 border-slate-200 focus:border-sky-500 text-base"
                />
                <p className="text-xs text-slate-400">Au moins 8 caracteres avec une lettre et un chiffre</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-slate-700 font-medium text-sm">Confirmer le mot de passe</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Repetez le mot de passe"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-xl h-12 border-slate-200 focus:border-sky-500 text-base"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full rounded-xl h-12 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-sky-500/25 text-base"
              >
                {loading ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <Button
                variant="link"
                onClick={() => navigate('login')}
                className="text-slate-500 font-medium text-sm p-0 h-auto"
              >
                Retour a la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
