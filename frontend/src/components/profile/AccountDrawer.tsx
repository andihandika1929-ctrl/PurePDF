// frontend/src/components/profile/AccountDrawer.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { updateUserPassword } from '@/lib/supabaseClient';
import {
  X,
  Crown,
  Zap,
  Coins,
  KeyRound,
  ChevronDown,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Infinity as InfinityIcon,
} from 'lucide-react';

export const AccountDrawer: React.FC = () => {
  const {
    user,
    credits,
    isVvip,
    isUnlimited,
    dailyAiUsed,
    isAccountDrawerOpen,
    closeAccountDrawer,
    logout,
    language,
    isInternalMode,
  } = useApp();

  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (isInternalMode || !isAccountDrawerOpen || !user) return null;

  const isId = language === 'id';

  // Format VVIP duration countdown
  const getVvipDuration = () => {
    if (isUnlimited) return isId ? 'Akses Tanpa Batas (Lifetime)' : 'Unlimited Access (Lifetime)';
    if (!user.vvip_expires_at) return isId ? '80 Hari 22 Jam lagi' : '80 Days 22 Hours left';
    const diff = new Date(user.vvip_expires_at).getTime() - Date.now();
    if (diff <= 0) return isId ? 'Kedaluwarsa' : 'Expired';
    const days = Math.floor(diff / (24 * 3600 * 1000));
    const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
    if (days > 0) {
      return isId ? `${days} Hari ${hours} Jam lagi` : `${days} Days ${hours} Hours left`;
    }
    const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    return isId ? `${hours} Jam ${minutes} Menit lagi` : `${hours} Hours ${minutes} Mins left`;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError(isId ? 'Kata sandi baru minimal 6 karakter.' : 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isId ? 'Konfirmasi kata sandi tidak cocok.' : 'Password confirmation does not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await updateUserPassword(newPassword, user.id);
      setPasswordSuccess(isId ? 'Kata sandi berhasil diperbarui!' : 'Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || (isId ? 'Gagal memperbarui kata sandi.' : 'Failed to update password.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const dailyRemaining = Math.max(0, 15 - (dailyAiUsed || 0));
  const vvipActive = isVvip || isUnlimited;

  return (
    <div className="fixed inset-0 z-50 flex justify-end items-center p-3 sm:p-5 pointer-events-none select-none">
      
      {/* Dark Frosted Blur Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity animate-in fade-in duration-300"
        onClick={closeAccountDrawer}
      />

      {/* Luxury Obsidian Floating Glass Panel (Modeled exactly after Image 1) */}
      <div className="relative w-full max-w-[390px] rounded-[32px] bg-[#161618]/92 backdrop-blur-3xl border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden text-white pointer-events-auto z-10 animate-in slide-in-from-right-4 duration-300">
        
        {/* Ambient Warm Orange/Amber Mesh Glows */}
        <div className="absolute -top-16 -left-12 w-64 h-64 rounded-full bg-gradient-to-br from-[#ff5500]/35 via-amber-600/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-gradient-to-bl from-orange-500/25 via-amber-500/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-10 w-60 h-60 rounded-full bg-gradient-to-tr from-[#ff3700]/20 to-transparent blur-3xl pointer-events-none" />

        {/* Inner Padding & Layout */}
        <div className="p-5 sm:p-6 space-y-3.5 relative z-10 overflow-y-auto max-h-[92vh]">
          
          {/* 1. Header: My Account Title & Close Button */}
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isId ? 'Akun Saya' : 'My Account'}
            </h2>
            <button
              onClick={closeAccountDrawer}
              className="w-8 h-8 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* 2. User Profile Card */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              {/* Glowing Gradient Ring Avatar */}
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#ff4500] via-pink-500 to-amber-400 shadow-[0_0_14px_rgba(255,69,0,0.5)]">
                <div className="w-11 h-11 rounded-full bg-zinc-900 overflow-hidden flex items-center justify-center text-white font-bold text-sm ring-1 ring-black">
                  {(user.full_name || 'Andi')[0].toUpperCase()}
                </div>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white leading-tight">
                  {user.full_name || 'Andi'}
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono truncate max-w-[150px]">
                  {user.email || 'andihandika1929@gmail.com'}
                </p>
              </div>
            </div>

            {/* Glowing Pill Badge: VVIP ACTIVE */}
            <div>
              {isUnlimited ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold font-mono tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <InfinityIcon className="w-3 h-3 text-emerald-400" strokeWidth={1.75} />
                  UNLIMITED
                </span>
              ) : vvipActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-600/40 via-orange-500/40 to-amber-600/40 border border-amber-400/50 text-amber-200 text-[10px] font-bold font-mono tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.35)] relative overflow-hidden">
                  <Crown className="w-3 h-3 text-amber-300 fill-amber-300" strokeWidth={1.75} />
                  <span>VVIP ACTIVE</span>
                  <div className="absolute top-0 right-1 w-2.5 h-2.5 bg-white/40 rounded-full blur-[1px]" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] text-neutral-300 text-[10px] font-bold font-mono tracking-wider">
                  FREE MEMBER
                </span>
              )}
            </div>
          </div>

          {/* 3. Bento Card 1: VVIP Expiry */}
          {vvipActive && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md space-y-2.5 shadow-sm hover:border-white/[0.14] transition-all">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-amber-300 shrink-0">
                  <Crown className="w-4 h-4 fill-amber-300/30 text-amber-300" strokeWidth={1.75} />
                </div>
                <span className="text-xs font-semibold text-neutral-200">
                  {getVvipDuration()}
                </span>
              </div>
              {/* Thin Aesthetic Progress Bar */}
              <div className="w-full h-1 rounded-full bg-white/[0.1] overflow-hidden">
                <div className="h-full bg-neutral-300 w-3/4 rounded-full" />
              </div>
            </div>
          )}

          {/* 4. Bento Card 2: Daily AI Quota */}
          {vvipActive ? (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md space-y-2 shadow-sm hover:border-white/[0.14] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-200">
                  Daily AI Quota: {dailyRemaining} / 15 today
                </span>
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 fill-orange-400 text-orange-400" strokeWidth={1.75} />
                </div>
              </div>
              {/* Glowing Coral Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-white/[0.1] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-[#ff3700] rounded-full shadow-[0_0_10px_rgba(255,69,0,0.6)] transition-all duration-300"
                  style={{ width: `${(dailyRemaining / 15) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
                15 free operations daily for 3 PRO AI tools. Auto-resets at midnight.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-200">
                  {isId ? 'Saldo Kredit AI Tersisa' : 'Available AI Credits'}
                </span>
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 fill-orange-400 text-orange-400" strokeWidth={1.75} />
                </div>
              </div>
              <div className="text-base font-mono font-bold text-white">
                {credits} <span className="text-xs font-normal text-neutral-400">pts</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
                {isId
                  ? 'Kredit digunakan untuk 3 tool PRO AI (2 kredit / operasi).'
                  : 'Credits power 3 PRO AI tools (2 credits / op).'}
              </p>
            </div>
          )}

          {/* 5. Bento Card 3: Backup Credit Reserve */}
          {vvipActive && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md flex items-start gap-3 shadow-sm hover:border-white/[0.14] transition-all">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Coins className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">
                  Backup Credit Reserve: {credits} pts
                </h4>
                <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
                  Backup credits automatically kick in if your 15 daily operations are exhausted (2 credits / op).
                </p>
              </div>
            </div>
          )}

          {/* 6. Glowing Orange Button: Extend VVIP Duration */}
          <Link href="/pricing" onClick={closeAccountDrawer} className="block pt-0.5">
            <button className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#ff5a00] via-[#ff3b00] to-orange-500 hover:from-[#e64d00] hover:to-orange-600 text-white font-bold text-xs shadow-[0_4px_24px_rgba(255,55,0,0.55)] border border-orange-400/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span>{isId ? 'Tambah Durasi VVIP' : 'Extend VVIP Duration'}</span>
            </button>
          </Link>

          {/* 7. Collapsible Security Accordion (CHANGE PASSWORD) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md space-y-3 shadow-sm transition-all">
            <button
              onClick={() => setIsSecurityOpen(!isSecurityOpen)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-neutral-300" strokeWidth={1.75} />
                <span className="text-xs font-bold text-neutral-200 tracking-wider">
                  CHANGE PASSWORD
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${
                  isSecurityOpen ? 'rotate-180 text-white' : ''
                }`}
                strokeWidth={1.75}
              />
            </button>

            {/* Accordion Form Content */}
            {isSecurityOpen && (
              <div className="pt-1 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-2.5">
                  {/* New Password Field with Eye Toggle */}
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="New password (min, 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-10 px-3.5 pr-9 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                      ) : (
                        <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>

                  {/* Confirm Password Field with Eye Toggle */}
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-10 px-3.5 pr-9 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                      ) : (
                        <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-medium text-xs transition-all active:scale-98 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {passwordLoading ? (isId ? 'Menyimpan...' : 'Saving...') : 'Save New Password'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* 8. Footer: Frosted Dark Red Sign Out Button */}
          <div className="pt-1">
            <button
              onClick={async () => {
                closeAccountDrawer();
                await logout();
              }}
              className="w-full h-11 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/25 text-red-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-300" strokeWidth={1.75} />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
