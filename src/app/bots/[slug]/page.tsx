'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { SLUG_TO_FOLDER, getBotIframeSrc } from '@/lib/bot-games';

type AccessReason = 'not_authenticated' | 'not_found' | 'locked';

interface AccessResponse {
  access: boolean;
  reason?: AccessReason;
  game?: {
    name: string;
    slug?: string;
    unlockType?: string;
    unlockValue?: number;
  };
}

interface LockedInfo {
  name: string;
  unlockType: string;
  unlockValue: number;
  currentUserValue: number;
}

// Navigate back to the SPA home page with bots tab
function goBackToBots() {
  if (typeof window !== 'undefined') {
    window.location.href = '/#bots';
  }
}

// Arrow left SVG icon
function ArrowLeftIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

// Lock SVG icon
function LockIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Spinner component
function Spinner() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-slate-600 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Chargement...</p>
      </div>
    </div>
  );
}

// Locked state page
function LockedPage({ info }: { info: LockedInfo }) {
  const progressPercent = info.unlockValue > 0
    ? Math.min(100, (info.currentUserValue / info.unlockValue) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Back button */}
        <button
          onClick={goBackToBots}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Retour aux bots
        </button>

        {/* Locked card */}
        <div className="rounded-2xl bg-[#12121a] border border-slate-800 p-6 text-center">
          {/* Lock icon */}
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-5">
            <LockIcon className="w-8 h-8 text-slate-500" />
          </div>

          {/* Game name */}
          <h2 className="text-lg font-semibold text-white mb-2">{info.name}</h2>
          <p className="text-slate-400 text-sm mb-6">Ce bot est actuellement verrouille</p>

          {/* Requirement */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 mb-5">
            <div className="flex items-start gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 mt-0.5">
                {info.unlockType === 'deposit' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-sky-400">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-sky-400">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">
                  {info.unlockType === 'deposit'
                    ? `Depot minimum de ${info.unlockValue}$`
                    : `Parrainez ${info.unlockValue} personne${info.unlockValue > 1 ? 's' : ''} verifiee${info.unlockValue > 1 ? 's' : ''}`}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {info.unlockType === 'deposit'
                    ? `Depot actuel : ${info.currentUserValue.toFixed(2)}$ sur ${info.unlockValue}$`
                    : `Filleuls verifies : ${info.currentUserValue} sur ${info.unlockValue}`}
                </p>
                {/* Progress bar */}
                <div className="mt-2.5 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-1">{progressPercent.toFixed(0)}% complete</p>
              </div>
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={goBackToBots}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 transition-colors border border-slate-700"
          >
            Retour aux bots
          </button>
        </div>
      </div>
    </div>
  );
}

// Not found page
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-slate-500">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Jeu non trouve</h2>
        <p className="text-slate-400 text-sm mb-6">Ce bot n&apos;existe pas ou n&apos;est plus disponible.</p>
        <button
          onClick={goBackToBots}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mx-auto"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Retour aux bots
        </button>
      </div>
    </div>
  );
}

// Coming soon page
function ComingSoonPage({ gameName }: { gameName: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-slate-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">{gameName}</h2>
        <p className="text-slate-400 text-sm mb-6">Jeu bientot disponible</p>
        <button
          onClick={goBackToBots}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mx-auto"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Retour aux bots
        </button>
      </div>
    </div>
  );
}

export default function BotPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessData, setAccessData] = useState<AccessResponse | null>(null);
  const [lockedInfo, setLockedInfo] = useState<LockedInfo | null>(null);

  // Resolve params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Check access
  const checkAccess = useCallback(async () => {
    if (!slug) return;

    try {
      const res = await fetch(`/api/bots/${slug}/access`);
      const data: AccessResponse = await res.json();
      setAccessData(data);

      if (!data.access && data.reason === 'not_authenticated') {
        goBackToBots();
        return;
      }

      if (!data.access && data.reason === 'locked' && data.game) {
        // Fetch current user stats for progress display
        const statsRes = await fetch('/api/user/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          const currentValue = data.game.unlockType === 'deposit'
            ? statsData.user?.totalDeposits ?? 0
            : statsData.user?.verifiedRefCount ?? 0;
          setLockedInfo({
            name: data.game.name,
            unlockType: data.game.unlockType ?? 'deposit',
            unlockValue: data.game.unlockValue ?? 0,
            currentUserValue: currentValue,
          });
        }
      }
    } catch (error) {
      console.error('Access check error:', error);
      setAccessData({ access: false, reason: 'not_found' });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Block keyboard shortcuts and right-click
  useEffect(() => {
    if (loading || !accessData?.access) return;

    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const blockKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'u') e.preventDefault();
      if (e.ctrlKey && e.key === 's') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && e.key === 'I') e.preventDefault();
      if (e.key === 'F12') e.preventDefault();
    };

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockKeydown);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockKeydown);
    };
  }, [loading, accessData]);

  // Loading state
  if (loading || !slug) {
    return <Spinner />;
  }

  // Access denied states
  if (!accessData || !accessData.access) {
    if (accessData?.reason === 'not_found') {
      return <NotFoundPage />;
    }
    if (accessData?.reason === 'locked' && lockedInfo) {
      return <LockedPage info={lockedInfo />;
    }
    return <Spinner />;
  }

  // Access granted
  const iframeSrc = getBotIframeSrc(slug);
  if (!iframeSrc) {
    return <ComingSoonPage gameName={accessData.game?.name ?? slug} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      {/* Sticky back button */}
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center h-11 px-3">
          <button
            onClick={goBackToBots}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm py-1.5 px-2 rounded-lg hover:bg-slate-800/50"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Retour</span>
          </button>
          <div className="flex-1" />
          <span className="text-xs text-slate-600 font-medium">{accessData.game?.name}</span>
        </div>
      </div>

      {/* Iframe fills remaining space */}
      <iframe
        src={iframeSrc}
        className="flex-1 w-full border-0 bg-black"
        title={accessData.game?.name ?? 'Bot'}
        sandbox="allow-scripts allow-same-origin"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
