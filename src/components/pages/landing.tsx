'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from '@/components/router';
import { useSiteConfig } from '@/components/config-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

// 1win Logo SVG component
const Win1Logo = ({ className = "h-8" }: { className?: string }) => (
  <svg viewBox="0 0 120 32" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="winGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7C3AED"/>
        <stop offset="100%" stopColor="#4F46E5"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="32" height="32" rx="8" fill="url(#winGrad)"/>
    <text x="16" y="23" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial">1</text>
    <text x="40" y="23" fill="#1e293b" fontSize="20" fontWeight="800" fontFamily="Arial">1win</text>
  </svg>
);

// Checkmark icon
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-500 shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
);

// Zap icon
const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
);

// Chart icon
const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
);

// Shield icon
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
);

interface LandingGame {
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
  showOnLanding: boolean;
}

export default function LandingPage() {
  const { navigate } = useRouter();
  const { config } = useSiteConfig();
  const [games, setGames] = useState<LandingGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch('/api/games?landing=true');
        if (res.ok) {
          const data = await res.json();
          setGames(data.games || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setGamesLoading(false);
      }
    }
    fetchGames();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Mobile first */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="WinBots" width={36} height={36} className="rounded-xl" />
            <span className="text-lg font-bold text-slate-900 tracking-tight">WinBots</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('login')} className="text-slate-600 hover:text-slate-900 font-medium text-sm px-3">
              Connexion
            </Button>
            <Button onClick={() => navigate('register')} className="rounded-full px-5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium text-sm shadow-lg shadow-sky-500/20">
              S&apos;inscrire
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        <div className="absolute inset-0">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo + 1win partnership badge */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Image src="/logo.png" alt="WinBots" width={72} height={72} className="rounded-2xl shadow-2xl shadow-sky-500/20" />
              </motion.div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                <Win1Logo className="h-5" />
                <span className="text-white/60 text-xs font-medium">Partenaire Officiel</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Bots de Prediction
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Jeux Casino
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
              Accedez a des algorithmes de prediction pour vos jeux casino preferes.
              Inscrivez-vous gratuitement et debloquez votre premier bot immediatement.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate('register')}
                className="w-full sm:w-auto rounded-full px-8 py-6 text-base bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold shadow-xl shadow-sky-500/30"
              >
                Commencer gratuitement
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('login')}
                className="w-full sm:w-auto rounded-full px-8 py-6 text-base border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                J&apos;ai deja un compte
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckIcon />
                <span>Inscription gratuite</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckIcon />
                <span>1er bot gratuit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckIcon />
                <span>Code promo: {config.promo_code}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Games Showcase - Horizontal scroll, original image dimensions, no names overlay */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Jeux Disponibles</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
              Des bots de prediction pour les jeux casino les plus populaires.
            </p>
          </motion.div>

          {gamesLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-1">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="shrink-0 w-[130px] h-[170px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-1">
              {games.slice(0, 12).map((game, i) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="shrink-0 snap-start"
                >
                  <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-slate-100">
                    {/* Natural aspect ratio - no forced dimensions */}
                    <img
                      src={game.image}
                      alt={game.name}
                      className="w-[130px] sm:w-[140px] h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Comment ca marche</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
              Trois etapes simples pour commencer a utiliser les bots de prediction.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                step: '01',
                title: 'Inscrivez-vous',
                description: 'Creez votre compte gratuitement en 30 secondes. Un pseudo, un email et c\'est parti.',
                icon: <ZapIcon />,
                color: 'from-sky-500 to-blue-600',
              },
              {
                step: '02',
                title: 'Debloquez vos bots',
                description: 'Votre premier bot (Aviator) est debloque automatiquement. Effectuez des depots pour debloquer les autres bots progressivement.',
                icon: <ChartIcon />,
                color: 'from-violet-500 to-purple-600',
              },
              {
                step: '03',
                title: 'Utilisez les predictions',
                description: 'Accedez aux algorithmes de prediction et utilisez-les pour optimiser votre jeu sur la plateforme.',
                icon: <CheckIcon />,
                color: 'from-emerald-500 to-green-600',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 h-full bg-white">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
                        {item.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-300 tracking-widest">ETAPE {item.step}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Only Algorithmes Avances + Mises a Jour Regulieres */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Pourquoi WinBots</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
              Une plateforme conque pour maximiser votre experience de jeu.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                title: 'Algorithmes Avances',
                description: 'Des bots entraines sur des millions de donnees pour fournir des predictions precises et en temps reel.',
                gradient: 'from-sky-500/10 to-blue-500/10',
                iconColor: 'text-sky-600',
                icon: <ChartIcon />,
              },
              {
                title: 'Mises a Jour Regulieres',
                description: 'Les algorithmes sont mis a jour en permanence pour s\'adapter aux dernieres tendances des jeux.',
                gradient: 'from-emerald-500/10 to-green-500/10',
                iconColor: 'text-emerald-600',
                icon: <ShieldIcon />,
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 h-full">
                  <CardContent className="p-5 sm:p-6">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 ${feature.iconColor}`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 py-14 sm:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-violet-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Image src="/logo.png" alt="WinBots" width={56} height={56} className="rounded-2xl mx-auto mb-6 shadow-xl" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Pret a commencer ?
            </h2>
            <p className="text-base text-sky-100 mb-8 max-w-md mx-auto">
              Inscrivez-vous gratuitement et debloquez votre premier bot de prediction en quelques secondes.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('register')}
              className="rounded-full px-10 py-6 text-base bg-white text-sky-700 hover:bg-sky-50 font-semibold shadow-xl"
            >
              Creer mon compte gratuitement
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <Image src="/logo.png" alt="WinBots" width={28} height={28} className="rounded-lg" />
            <span className="text-white font-semibold text-sm">WinBots</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Win1Logo className="h-5" />
            <span className="text-slate-500 text-xs">Partenaire Officiel</span>
          </div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Plateforme de prediction de jeux casino. Jouez de maniere responsable. 18+ uniquement.
          </p>
        </div>
      </footer>
    </div>
  );
}
