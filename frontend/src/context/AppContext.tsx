'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TRANSLATIONS, Language } from '@/i18n/translations';
import {
  UserProfile,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPasswordForEmail,
  signOutUser,
  syncUserProfile,
  consumeAiQuota,
  QuotaCheckResult,
  getSupabase,
} from '@/lib/supabaseClient';

interface AppContextType {
  credits: number;
  isVvip: boolean;
  isUnlimited: boolean;
  isInternalMode: boolean;
  dailyAiUsed: number;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (typeof TRANSLATIONS)['en'];
  checkAndConsumeAiQuota: (cost?: number) => Promise<QuotaCheckResult>;
  isPaywallOpen: boolean;
  setPaywallOpen: (open: boolean) => void;
  activeProToolName: string;
  setActiveProToolName: (name: string) => void;
  user: UserProfile | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  isAccountDrawerOpen: boolean;
  setAccountDrawerOpen: (open: boolean) => void;
  openAccountDrawer: () => void;
  closeAccountDrawer: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isInternalMode = process.env.NEXT_PUBLIC_APP_MODE === 'internal';

  const [credits, setCredits] = useState<number>(0);
  const [isVvip, setIsVvip] = useState<boolean>(false);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(false);
  const [dailyAiUsed, setDailyAiUsed] = useState<number>(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguageState] = useState<Language>('en'); // Default is EN
  const [isPaywallOpen, setPaywallOpen] = useState(false);
  const [activeProToolName, setActiveProToolName] = useState('PRO AI Tool');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Auth modal state
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Account slide-over drawer state
  const [isAccountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const openAccountDrawer = () => setAccountDrawerOpen(true);
  const closeAccountDrawer = () => setAccountDrawerOpen(false);

  const channelRef = useRef<any>(null);

  // Sync profile data to state
  const applyProfile = (profile: UserProfile | null) => {
    setUser(profile);
    if (profile) {
      setCredits(profile.credits);
      setIsVvip(profile.is_vvip);
      const isUnl = Boolean(
        profile.is_unlimited ||
        profile.role === 'admin' ||
        profile.role === 'unlimited' ||
        profile.is_admin
      );
      setIsUnlimited(isUnl);
      setDailyAiUsed(profile.daily_ai_used || 0);
    } else {
      setCredits(0);
      setIsVvip(false);
      setIsUnlimited(false);
      setDailyAiUsed(0);
    }
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    if (isInternalMode) return; // Do not open auth modal in internal mode
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    // Theme restore
    const savedTheme = localStorage.getItem('purepdf_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }

    // Language restore
    const savedLang = localStorage.getItem('purepdf_lang') as Language | null;
    if (savedLang === 'id' || savedLang === 'en') {
      setLanguageState(savedLang);
    }

    // Check for auth_error in URL query
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlAuthErr = urlParams.get('auth_error');
      if (urlAuthErr) {
        setAuthError(decodeURIComponent(urlAuthErr));
      }
    }

    // If internal mode is enabled, skip external auth requirements
    if (isInternalMode) {
      setAuthLoading(false);
      return;
    }

    // Setup Supabase auth & profile sync
    const supabase = getSupabase();
    if (supabase) {
      // 1. Check current active session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.warn('Get session error:', error);
        }
        if (session?.user) {
          syncUserProfile({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
          }).then((prof) => {
            applyProfile(prof);
            subscribeToProfile(session.user.id);
          });
        } else {
          // Check localStorage for offline demo user
          const mockUser = localStorage.getItem('purepdf_mock_user');
          if (mockUser) {
            try {
              applyProfile(JSON.parse(mockUser));
            } catch { }
          }
        }
        setAuthLoading(false);
      });

      // 2. Listen to real-time auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            const profile = await syncUserProfile({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name,
            });
            applyProfile(profile);
            subscribeToProfile(session.user.id);
          } else {
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
            setUser(null);
            setCredits(0);
            setIsVvip(false);
            setIsUnlimited(false);
          }
        }
      );

      // Helper for Realtime subscription to profiles table
      const subscribeToProfile = (userId: string) => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
        try {
          channelRef.current = supabase
            .channel(`realtime-profile-${userId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${userId}`,
              },
              (payload: any) => {
                if (payload.new) {
                  applyProfile(payload.new as UserProfile);
                }
              }
            )
            .subscribe();
        } catch (e) {
          console.warn('Realtime subscription error:', e);
        }
      };

      return () => {
        authListener.subscription.unsubscribe();
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      };
    } else {
      // Local fallback if Supabase is not configured
      const mockUser = localStorage.getItem('purepdf_mock_user');
      if (mockUser) {
        try {
          applyProfile(JSON.parse(mockUser));
        } catch { }
      }
      setAuthLoading(false);
    }
  }, [isInternalMode]);

  const clearAuthError = () => {
    setAuthError(null);
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const res = await signInWithGoogle();
      if (res && 'simulated' in res && res.simulated) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'andihandika1929@gmail.com';
        const isAdm = res.user.email.toLowerCase() === adminEmail.toLowerCase();
        const mockProfile: UserProfile = {
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.full_name || 'Demo User',
          credits: isAdm ? 99999 : 10,
          is_vvip: isAdm,
          is_unlimited: isAdm,
          role: isAdm ? 'admin' : 'user',
          is_admin: isAdm,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('purepdf_mock_user', JSON.stringify(mockProfile));
        applyProfile(mockProfile);
        setAuthModalOpen(false);
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      const errMsg = err?.message || 'Failed to initialize Google Sign In. Please try again.';
      setAuthError(errMsg);
      alert(errMsg);
    }
  };

  const loginWithEmailHandler = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const res = await signInWithEmail(email, pass);
      if (res && 'simulated' in res && res.simulated) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'andihandika1929@gmail.com';
        const isAdm = email.toLowerCase() === adminEmail.toLowerCase();
        const mockProfile: UserProfile = {
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.full_name,
          credits: isAdm ? 99999 : 10,
          is_vvip: isAdm,
          is_unlimited: isAdm,
          role: isAdm ? 'admin' : 'user',
          is_admin: isAdm,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('purepdf_mock_user', JSON.stringify(mockProfile));
        applyProfile(mockProfile);
        setAuthModalOpen(false);
        return;
      }

      if (res.user) {
        const prof = await syncUserProfile({
          id: res.user.id,
          email: res.user.email,
        });
        applyProfile(prof);
        setAuthModalOpen(false);
      }
    } catch (err: any) {
      console.error('Email sign in error:', err);
      const msg = err?.message || 'Login failed';
      setAuthError(msg);
      throw err;
    }
  };

  const registerWithEmailHandler = async (name: string, email: string, pass: string) => {
    setAuthError(null);
    try {
      const res = await signUpWithEmail(email, pass, name);
      if (res && 'simulated' in res && res.simulated) {
        const mockProfile: UserProfile = {
          id: res.user.id,
          email: res.user.email,
          full_name: name,
          credits: 10, // 10 initial starter credits
          is_vvip: false,
          is_unlimited: false,
          role: 'user',
          is_admin: false,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('purepdf_mock_user', JSON.stringify(mockProfile));
        applyProfile(mockProfile);
        setAuthModalOpen(false);
        return;
      }

      if (res.user) {
        const prof = await syncUserProfile(
          {
            id: res.user.id,
            email: res.user.email,
            full_name: name,
          },
          10
        );
        applyProfile(prof);
        setAuthModalOpen(false);
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      const msg = err?.message || 'Registration failed';
      setAuthError(msg);
      throw err;
    }
  };

  const resetPasswordHandler = async (email: string) => {
    setAuthError(null);
    try {
      await resetPasswordForEmail(email);
    } catch (err: any) {
      console.error('Reset password error:', err);
      const msg = err?.message || 'Password reset request failed';
      setAuthError(msg);
      throw err;
    }
  };

  const logout = async () => {
    await signOutUser();
    localStorage.removeItem('purepdf_mock_user');
    setUser(null);
    setCredits(0);
    setIsVvip(false);
    setIsUnlimited(false);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('purepdf_theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('purepdf_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => {
      const next = prev === 'en' ? 'id' : 'en';
      localStorage.setItem('purepdf_lang', next);
      return next;
    });
  };

  const refreshUserProfile = async () => {
    if (!user) return;
    try {
      const prof = await syncUserProfile({
        id: user.id,
        email: user.email,
        full_name: user.full_name || undefined,
      });
      applyProfile(prof);
    } catch (e) {
      console.warn('Could not refresh profile:', e);
    }
  };

  const checkAndConsumeAiQuota = async (cost = 2): Promise<QuotaCheckResult> => {
    if (isInternalMode) {
      return { allowed: true, quotaType: 'unlimited', dailyUsed: 0, creditsRemaining: 99999 };
    }

    if (!user) {
      openAuthModal('login');
      return { allowed: false, errorReason: 'not_logged_in' };
    }

    const res = await consumeAiQuota(user, cost);
    if (!res.allowed) {
      setPaywallOpen(true);
      return res;
    }

    // Update state based on deduction
    if (res.dailyUsed !== undefined) {
      setDailyAiUsed(res.dailyUsed);
    }
    if (res.creditsRemaining !== undefined) {
      setCredits(res.creditsRemaining);
    }
    setUser((prev) =>
      prev
        ? {
          ...prev,
          daily_ai_used: res.dailyUsed ?? prev.daily_ai_used,
          credits: res.creditsRemaining ?? prev.credits,
        }
        : null
    );

    return res;
  };

  const currentTranslations = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <AppContext.Provider
      value={{
        credits,
        isVvip,
        isUnlimited,
        isInternalMode,
        dailyAiUsed,
        theme,
        toggleTheme,
        language,
        setLanguage,
        toggleLanguage,
        t: currentTranslations,
        checkAndConsumeAiQuota,
        isPaywallOpen: isInternalMode ? false : isPaywallOpen,
        setPaywallOpen,
        activeProToolName,
        setActiveProToolName,
        user,
        loginWithGoogle,
        loginWithEmail: loginWithEmailHandler,
        registerWithEmail: registerWithEmailHandler,
        resetPassword: resetPasswordHandler,
        refreshUserProfile,
        logout,
        authLoading,
        authError,
        clearAuthError,
        isAuthModalOpen,
        setAuthModalOpen,
        authModalTab,
        openAuthModal,
        isAccountDrawerOpen,
        setAccountDrawerOpen,
        openAccountDrawer,
        closeAccountDrawer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
