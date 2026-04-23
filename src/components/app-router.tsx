'use client';

import React from 'react';
import { useRouter } from '@/components/router';
import { useAuth } from '@/components/auth-provider';
import { useSiteConfig } from '@/components/config-provider';
import SupportWidget from '@/components/support-widget';
import LandingPage from '@/components/pages/landing';
import LoginPage from '@/components/pages/login';
import RegisterPage from '@/components/pages/register';
import DashboardPage from '@/components/pages/dashboard';
import LeaderboardPage from '@/components/pages/leaderboard';
import AdminPage from '@/components/pages/admin';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppRouter() {
  const { currentPage, navigate } = useRouter();
  const { user, loading } = useAuth();
  const { config } = useSiteConfig();

  // Handle referral code from URL on landing page
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        sessionStorage.setItem('referralCode', ref.toUpperCase());
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 animate-pulse" />
          <Skeleton className="h-6 w-32 rounded-lg" />
        </div>
      </div>
    );
  }

  // Route protection
  if (!loading && !user && (currentPage === 'dashboard' || currentPage === 'bots' || currentPage === 'referrals' || currentPage === 'admin')) {
    navigate('landing');
    return null;
  }

  return (
    <>
      <PageContent currentPage={currentPage} navigate={navigate} />
      <SupportWidget
        whatsappLink={config.whatsapp_link || ''}
        telegramLink={config.telegram_link || ''}
      />
    </>
  );
}

function PageContent({ currentPage, navigate }: { currentPage: string; navigate: (page: any) => void }) {
  switch (currentPage) {
    case 'landing':
      return <LandingPage />;
    case 'login':
      return <LoginPage />;
    case 'register':
      return <RegisterPage />;
    case 'dashboard':
    case 'bots':
    case 'referrals':
      return <DashboardPage />;
    case 'leaderboard':
      return <LeaderboardPage />;
    case 'admin':
      return <AdminPage />;
    default:
      return <LandingPage />;
  }
}
