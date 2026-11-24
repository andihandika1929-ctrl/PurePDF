'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { updateUserPassword } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KeyRound, Lock, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { language } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isId = language === 'id';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg(isId ? 'Mohon isi seluruh formulir kata sandi.' : 'Please enter and confirm your new password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(isId ? 'Kata sandi minimal 6 karakter.' : 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(isId ? 'Konfirmasi kata sandi tidak cocok.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await updateUserPassword(password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || (isId ? 'Gagal memperbarui kata sandi. Tautan mungkin telah kedaluwarsa.' : 'Failed to update password. Link may have expired.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-16 sm:my-24 px-4">
      <div className="bento-card p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-xl space-y-6">
        
        {/* Navigation link back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isId ? 'Kembali ke Beranda' : 'Back to Home'}</span>
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[#ff3700]/10 text-[#ff3700]">
            <KeyRound className="w-7 h-7" />
          </div>
          <Badge variant="pro" size="sm">ACCOUNT SECURITY</Badge>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            {isId ? 'Atur Ulang Kata Sandi' : 'Reset Your Password'}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isId
              ? 'Masukkan kata sandi baru untuk mengamankan akun PurePDF Anda.'
              : 'Enter a strong new password to protect your PurePDF account.'}
          </p>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2 animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {isId ? 'Kata sandi berhasil diperbarui!' : 'Password updated successfully!'}
            </p>
            <p className="text-[11px] text-neutral-500 font-mono">
              {isId ? 'Mengalihkan ke beranda dalam 2 detik...' : 'Redirecting to homepage in 2 seconds...'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {isId ? 'Kata Sandi Baru' : 'New Password'}
              </label>
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {isId ? 'Konfirmasi Kata Sandi Baru' : 'Confirm New Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
                />
              </div>
            </div>

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
                <span>{isId ? 'Simpan Kata Sandi Baru' : 'Save New Password'}</span>
              )}
            </Button>
          </form>
        )}

      </div>
    </div>
  );
}
