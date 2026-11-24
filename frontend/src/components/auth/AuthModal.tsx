'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    authModalTab,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    language,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authModalTab || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password mode
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Sync tab with context when modal opens
  React.useEffect(() => {
    if (authModalTab) {
      setActiveTab(authModalTab);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsForgotMode(false);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const isId = language === 'id';

  const handleClose = () => {
    setAuthModalOpen(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsForgotMode(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(isId ? 'Mohon isi email dan kata sandi.' : 'Please enter email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithEmail(email, password);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err?.message || (isId ? 'Email atau kata sandi tidak valid.' : 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setErrorMsg(isId ? 'Mohon lengkapi seluruh kolom formulir.' : 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(isId ? 'Kata sandi minimal 6 karakter.' : 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await registerWithEmail(fullName, email, password);
      handleClose();
    } catch (err: any) {
      setErrorMsg(err?.message || (isId ? 'Pendaftaran gagal. Silakan coba lagi.' : 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(isId ? 'Masukkan alamat email Anda terlebih dahulu.' : 'Please enter your email address first.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await resetPassword(email);
      setSuccessMsg(
        isId
          ? 'Tautan atur ulang password telah dikirim ke email Anda! Silakan periksa inbox/spam.'
          : 'Password reset link sent to your email! Please check your inbox/spam folder.'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || (isId ? 'Gagal mengirim email reset password.' : 'Failed to send reset email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-[0px_25px_60px_rgba(0,0,0,0.3)] p-6 sm:p-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff3700]/10 text-[#ff3700] text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PurePDF Account</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            {isForgotMode
              ? isId
                ? 'Lupa Kata Sandi?'
                : 'Reset Password'
              : activeTab === 'login'
              ? isId
                ? 'Selamat Datang Kembali'
                : 'Welcome Back'
              : isId
              ? 'Daftar Akun Baru'
              : 'Create Free Account'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isForgotMode
              ? isId
                ? 'Masukkan email untuk menerima tautan pemulihan sandi.'
                : 'Enter your email to receive a recovery link.'
              : activeTab === 'login'
              ? isId
                ? 'Masuk untuk sinkronisasi kredit & riwayat dokumen Anda.'
                : 'Sign in to access your credits & preferences.'
              : isId
              ? 'Dapatkan saldo awal 10 AI Kredit gratis sekarang!'
              : 'Get 10 free starter AI credits upon sign-up!'}
          </p>
        </div>

        {/* Success Notice */}
        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Selector (Hidden in forgot password mode) */}
        {!isForgotMode && (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-neutral-100 dark:bg-zinc-800 text-xs font-bold">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              {isId ? 'Masuk' : 'Sign In'}
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeTab === 'register'
                  ? 'bg-[#ff3700] text-white shadow-sm'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <span>{isId ? 'Daftar Akun Baru' : 'Sign Up'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">+10</span>
            </button>
          </div>
        )}

        {/* Form Container */}
        {isForgotMode ? (
          /* Forgot Password Form */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {isId ? 'Alamat Email' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full !font-bold gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{isId ? 'Kirim Tautan Pemulihan' : 'Send Recovery Link'}</span>
            </Button>

            <button
              type="button"
              onClick={() => setIsForgotMode(false)}
              className="w-full text-center text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              {isId ? '← Kembali ke formulir masuk' : '← Back to sign in'}
            </button>
          </form>
        ) : (
          /* Login / Register Form */
          <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-3.5">
            {activeTab === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {isId ? 'Nama Lengkap' : 'Full Name'}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isId ? 'Contoh: Andi Handika' : 'e.g. John Doe'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {isId ? 'Alamat Email' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {isId ? 'Kata Sandi' : 'Password'}
                </label>
                {activeTab === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setErrorMsg(null);
                    }}
                    className="text-[11px] font-medium text-[#ff3700] hover:underline"
                  >
                    {isId ? 'Lupa password?' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
                />
              </div>
            </div>

            {activeTab === 'register' && (
              <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1.5 pt-1">
                <Sparkles className="w-3.5 h-3.5 text-[#ff3700]" />
                <span>{isId ? 'Saldo awal 10 AI Kredit otomatis terisi.' : '10 starter AI credits activated immediately.'}</span>
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full !font-bold gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {activeTab === 'login'
                      ? isId
                        ? 'Masuk ke Akun'
                        : 'Sign In to Account'
                      : isId
                      ? 'Daftar & Ambil 10 Kredit'
                      : 'Sign Up & Claim 10 Credits'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Divider */}
        {!isForgotMode && (
          <div className="relative flex items-center justify-center">
            <div className="border-t border-black/10 dark:border-white/10 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-3 text-[11px] text-neutral-400 uppercase font-mono">
              {isId ? 'atau' : 'or'}
            </span>
          </div>
        )}

        {/* Continue with Google */}
        {!isForgotMode && (
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-2xl bg-neutral-50 dark:bg-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-700 text-black dark:text-white font-semibold text-xs border border-black/10 dark:border-white/10 shadow-sm transition-all active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        )}

      </div>
    </div>
  );
};
