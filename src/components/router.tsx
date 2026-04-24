'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Page = 'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'dashboard' | 'bots' | 'referrals' | 'leaderboard' | 'admin';

interface RouterContextType {
  currentPage: Page;
  navigate: (page: Page) => void;
  pageHistory: Page[];
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType>({
  currentPage: 'landing',
  navigate: () => {},
  pageHistory: [],
  goBack: () => {},
});

const HASH_TO_PAGE: Record<string, Page> = {
  bots: 'bots',
  referrals: 'referrals',
  leaderboard: 'leaderboard',
  admin: 'admin',
  dashboard: 'dashboard',
};

export function RouterProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [pageHistory, setPageHistory] = useState<Page[]>(['landing']);
  const [initialized, setInitialized] = useState(false);

  // Handle hash-based navigation (e.g. /#bots from bot game back button)
  useEffect(() => {
    if (initialized) return;
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash && hash in HASH_TO_PAGE) {
      setCurrentPage(HASH_TO_PAGE[hash]);
      // Clean the hash so it doesn't interfere on refresh
      window.history.replaceState({}, '', window.location.pathname);
    }
    setInitialized(true);
  }, [initialized]);

  const navigate = (page: Page) => {
    setPageHistory(prev => [...prev, currentPage]);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    setPageHistory(prev => {
      const newHistory = [...prev];
      const previousPage = newHistory.pop() || 'landing';
      setCurrentPage(previousPage);
      return newHistory;
    });
  };

  return (
    <RouterContext.Provider value={{ currentPage, navigate, pageHistory, goBack }}>
      {children}
    </RouterContext.Provider>
  );
}

export const useRouter = () => useContext(RouterContext);
