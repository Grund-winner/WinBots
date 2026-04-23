'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from '@/components/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPasswordPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || 'Erreur');
      }
    } catch {
      setError('Erreur de connexion');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-sky-600">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Email envoye</h1>
          <p className="text-sm text-slate-500 mb-2">
            Si un compte existe avec <strong>{email}</strong>, vous recevrez un email avec un lien de reinitialisation.
          </p>
          <p className="text-xs text-slate-400 mb-6">Verifiez aussi vos spams. Le lien expire dans 1 heure.</p>
          <Button onClick={() => navigate('login')} className="rounded-xl h-12 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-sky-500/25 w-full max-w-[200px]">
            Retour a la connexion
          </Button>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-900">Mot de passe oublie</h1>
          <p className="text-sm text-slate-500 mt-1">Entrez votre email pour recevoir un lien de reinitialisation</p>
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
                <Label htmlFor="email" className="text-slate-700 font-medium text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="rounded-xl h-12 border-slate-200 focus:border-sky-500 text-base"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl h-12 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-sky-500/25 text-base"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
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
