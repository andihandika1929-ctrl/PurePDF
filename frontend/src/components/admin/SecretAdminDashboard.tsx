// frontend/src/components/admin/SecretAdminDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  UserProfile,
  getAdminStats,
  getAdminUsersList,
  adminUpdateUserProfile,
} from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldAlert,
  Users,
  Activity,
  CreditCard,
  Crown,
  Search,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Zap,
  Lock,
  User as UserIcon,
  X,
  Infinity as InfinityIcon,
  Calendar,
  Save,
  Check,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';

export const SecretAdminDashboard: React.FC<{ secretParam?: string }> = ({
  secretParam = '6664dm1n',
}) => {
  const router = useRouter();
  const { user, loginWithGoogle, openAuthModal, logout, authLoading, isInternalMode } = useApp();

  const expectedAdminEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'andihandika1929@gmail.com';

  // In internal mode, admin dashboard is disabled completely
  if (isInternalMode) {
    notFound();
  }

  // 1. Loading state while session resolves
  if (authLoading) {
    return (
      <div className="w-full max-w-md mx-auto my-32 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-2xl text-center space-y-4">
        <div className="w-8 h-8 mx-auto border-2 border-[#ff3700] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-neutral-500">Memverifikasi Sesi Administrator PurePDF...</p>
      </div>
    );
  }

  // 2. If user is not logged in, prompt sign in
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto my-20 p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-2xl text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-red-500/10 text-red-500">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="pro" size="sm">ADMIN COMMAND CENTER</Badge>
          <h2 className="text-xl font-bold text-black dark:text-white">
            Autentikasi Admin Diperlukan
          </h2>
          <p className="text-xs text-neutral-500">
            Halaman ini khusus untuk administrator terdaftar (<strong>{expectedAdminEmail}</strong>). Silakan masuk ke akun Anda.
          </p>
        </div>
        <Button
          onClick={() => openAuthModal('login')}
          className="w-full !h-12 !rounded-full !font-bold text-xs"
        >
          Masuk sebagai Admin
        </Button>
      </div>
    );
  }

  // 3. Strict Email & Role verification gate
  const isAuthorizedAdmin =
    user.email.toLowerCase() === expectedAdminEmail.toLowerCase() ||
    user.role === 'admin' ||
    user.is_admin === true;

  if (!isAuthorizedAdmin) {
    notFound();
  }

  // Dashboard state
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeVvipUsers: 0,
    totalCreditsCirculating: 0,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'free' | 'vvip' | 'unlimited'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Slide-over Drawer State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [drawerCredits, setDrawerCredits] = useState<number>(0);
  const [drawerIsUnlimited, setDrawerIsUnlimited] = useState<boolean>(false);
  const [drawerIsVvip, setDrawerIsVvip] = useState<boolean>(false);
  const [drawerVvipExpiresAt, setDrawerVvipExpiresAt] = useState<string | null>(null);
  const [savingDrawer, setSavingDrawer] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, userList] = await Promise.all([
        getAdminStats(),
        getAdminUsersList(searchQuery, statusFilter),
      ]);
      setStats(statsData);
      setUsers(userList);
    } catch (e) {
      console.error('Failed loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Drawer for a specific user
  const handleOpenDrawer = (u: UserProfile) => {
    setSelectedUser(u);
    setDrawerCredits(u.credits || 0);
    setDrawerIsUnlimited(!!u.is_unlimited);
    setDrawerIsVvip(!!u.is_vvip);
    setDrawerVvipExpiresAt(u.vvip_expires_at || null);
  };

  // Quick Expiry Button Actions
  const handleQuickExpiry = (days: number | null) => {
    if (days === null) {
      // Reset
      setDrawerIsVvip(false);
      setDrawerVvipExpiresAt(null);
    } else {
      setDrawerIsVvip(true);
      const baseDate = drawerVvipExpiresAt && new Date(drawerVvipExpiresAt) > new Date()
        ? new Date(drawerVvipExpiresAt)
        : new Date();
      const newDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      setDrawerVvipExpiresAt(newDate.toISOString());
    }
  };

  // Save Drawer Changes
  const handleSaveDrawerChanges = async () => {
    if (!selectedUser) return;
    setSavingDrawer(true);
    try {
      const targetRole =
        selectedUser.role === 'admin'
          ? 'admin'
          : drawerIsUnlimited
          ? 'unlimited'
          : selectedUser.role === 'unlimited'
          ? 'user'
          : selectedUser.role || 'user';

      await adminUpdateUserProfile(selectedUser.id, {
        credits: Number(drawerCredits),
        is_unlimited: drawerIsUnlimited,
        is_vvip: drawerIsVvip,
        vvip_expires_at: drawerVvipExpiresAt,
        role: targetRole,
      });

      // Optimistically update table user in local state immediately
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                credits: Number(drawerCredits),
                is_unlimited: drawerIsUnlimited,
                is_vvip: drawerIsVvip,
                vvip_expires_at: drawerVvipExpiresAt,
                role: targetRole,
              }
            : u
        )
      );

      showToast(`Perubahan untuk ${selectedUser.full_name || selectedUser.email} berhasil disimpan!`);
      setSelectedUser(null);
      await loadData();
    } catch (err: any) {
      showToast(`Gagal menyimpan: ${err?.message || 'Error database'}`);
    } finally {
      setSavingDrawer(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-10 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-mono text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-500/10 text-red-500">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <Badge variant="pro" size="sm">ADMIN COMMAND CENTER</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white">
            PurePDF Mission Control
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            Kelola pengguna, lisensi VVIP, kuota kredit, dan operasional Zero-Storage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-mono font-bold text-black dark:text-white">{user.email}</p>
            <p className="text-[10px] font-mono text-emerald-500 font-bold uppercase">Role: Super Admin</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            className="gap-2 text-xs font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={logout}
            className="text-xs font-mono text-red-500 hover:text-red-600"
          >
            Keluar
          </Button>
        </div>
      </div>

      {/* Section 1: 3 Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Total User */}
        <div className="bento-card p-6 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 font-bold">Total Pengguna</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold font-mono text-black dark:text-white">
            {stats.totalUsers.toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-500 font-mono">Akun terdaftar di database Supabase</p>
        </div>

        {/* Card 2: Total Member VVIP Aktif */}
        <div className="bento-card p-6 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-amber-500 font-bold">Member VVIP Aktif</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Crown className="w-5 h-5 fill-amber-500" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-500">
            {stats.activeVvipUsers.toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-500 font-mono">Akses tanpa batas aktif saat ini</p>
        </div>

        {/* Card 3: Total Kredit Beredar */}
        <div className="bento-card p-6 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#ff3700] font-bold">Total Kredit Beredar</span>
            <div className="p-2.5 rounded-xl bg-[#ff3700]/10 text-[#ff3700]">
              <Zap className="w-5 h-5 fill-[#ff3700]" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold font-mono text-[#ff3700]">
            {stats.totalCreditsCirculating.toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-500 font-mono">Akumulasi saldo kredit seluruh user</p>
        </div>
      </div>

      {/* Section 2: Tabel Pengguna dengan Pencarian & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ff3700]" />
              <span>Daftar Pengguna & Kendali Saldo</span>
            </h2>
            <p className="text-xs text-neutral-500 font-mono">
              Klik pada baris user untuk membuka slide drawer dan mengelola akun.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full pl-9 pr-4 py-2 text-xs font-mono rounded-full bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#ff3700]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center p-1 rounded-full bg-neutral-100 dark:bg-zinc-800 text-xs font-mono">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full transition-all ${
                  statusFilter === 'all'
                    ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('free')}
                className={`px-3 py-1 rounded-full transition-all ${
                  statusFilter === 'free'
                    ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setStatusFilter('vvip')}
                className={`px-3 py-1 rounded-full transition-all ${
                  statusFilter === 'vvip'
                    ? 'bg-amber-500 text-white font-bold'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                VVIP
              </button>
              <button
                onClick={() => setStatusFilter('unlimited')}
                className={`px-3 py-1 rounded-full transition-all ${
                  statusFilter === 'unlimited'
                    ? 'bg-[#ff3700] text-white font-bold'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                Unlimited
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-50 dark:bg-zinc-800/60 border-b border-black/5 dark:border-white/5 text-neutral-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Nama & Email</th>
                  <th className="py-3.5 px-6">Saldo Kredit</th>
                  <th className="py-3.5 px-6">Status Akun</th>
                  <th className="py-3.5 px-6">Kedaluwarsa VVIP</th>
                  <th className="py-3.5 px-6">Terdaftar</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400">
                      Tidak ada pengguna yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => handleOpenDrawer(u)}
                      className="hover:bg-neutral-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-black dark:text-white group-hover:text-[#ff3700] transition-colors">
                          {u.full_name || 'Tanpa Nama'}
                        </div>
                        <div className="text-[11px] text-neutral-400">{u.email}</div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-black dark:text-white">{u.credits}</span>
                        <span className="text-neutral-400 ml-1">pts</span>
                      </td>

                      <td className="py-4 px-6">
                        {u.is_unlimited ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[10px]">
                            <InfinityIcon className="w-3 h-3" /> UNLIMITED
                          </span>
                        ) : u.is_vvip ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                            <Crown className="w-3 h-3 fill-amber-500" /> VVIP
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">Free Tier</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-neutral-500 text-[11px]">
                        {u.is_unlimited
                          ? 'Permanen'
                          : u.vvip_expires_at
                          ? new Date(u.vvip_expires_at).toLocaleDateString()
                          : '-'}
                      </td>

                      <td className="py-4 px-6 text-neutral-400 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-[11px] font-bold text-black dark:text-white group-hover:bg-[#ff3700] group-hover:text-white transition-colors">
                          <SlidersHorizontal className="w-3 h-3" /> Kelola
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer (Sisi Kanan) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-900 border-l border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#ff3700]/10 text-[#ff3700]">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-black dark:text-white">Kelola Akun User</h3>
                    <p className="text-[11px] text-neutral-400 font-mono">ID: {selectedUser.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-400 hover:text-black dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Identity Card */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-zinc-800/60 border border-black/5 dark:border-white/5 space-y-1">
                <p className="text-sm font-bold text-black dark:text-white">
                  {selectedUser.full_name || 'Tanpa Nama'}
                </p>
                <p className="text-xs text-neutral-500 font-mono">{selectedUser.email}</p>
                <div className="pt-2 flex items-center gap-2">
                  <Badge variant={selectedUser.is_vvip ? 'pro' : 'default'} size="sm">
                    {selectedUser.is_unlimited
                      ? 'UNLIMITED ACCESS'
                      : selectedUser.is_vvip
                      ? 'VVIP MEMBER'
                      : 'FREE TIER'}
                  </Badge>
                  {selectedUser.role === 'admin' && (
                    <Badge variant="pro" size="sm">SUPER ADMIN</Badge>
                  )}
                </div>
              </div>

              {/* Form 1: Ubah / Tambah Kredit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold font-mono uppercase text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#ff3700]" />
                    <span>Saldo Kredit AI</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-[#ff3700]">
                    {drawerCredits} Pts
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={drawerCredits}
                  onChange={(e) => setDrawerCredits(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff3700]"
                />
                {/* Quick Add Chips */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <button
                    onClick={() => setDrawerCredits((prev) => prev + 10)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => setDrawerCredits((prev) => prev + 50)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700"
                  >
                    +50
                  </button>
                  <button
                    onClick={() => setDrawerCredits((prev) => prev + 100)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => setDrawerCredits((prev) => prev + 1000)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-[#ff3700] font-bold"
                  >
                    +1000
                  </button>
                </div>
              </div>

              {/* Form 2: Toggle Switch is_unlimited */}
              <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-zinc-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                      <InfinityIcon className="w-4 h-4 text-red-500" />
                      <span>Akses Unlimited (Tanpa Batas)</span>
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Bypass pemotongan kredit & masa kedaluwarsa VVIP.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerIsUnlimited(!drawerIsUnlimited)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      drawerIsUnlimited ? 'bg-red-500' : 'bg-neutral-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        drawerIsUnlimited ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Form 3: Status VVIP & Tanggal Kedaluwarsa */}
              <div className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-zinc-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 fill-amber-500" />
                      <span>Status Member VVIP</span>
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Beri akses premium PRO AI tanpa batas waktu aktif.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !drawerIsVvip;
                      setDrawerIsVvip(next);
                      if (next && !drawerVvipExpiresAt) {
                        handleQuickExpiry(30);
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      drawerIsVvip ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        drawerIsVvip ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Expiry display / date input */}
                {drawerIsVvip && (
                  <div className="pt-2 space-y-2 border-t border-black/5 dark:border-white/5">
                    <label className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Kedaluwarsa VVIP:</span>
                    </label>
                    <input
                      type="text"
                      value={drawerVvipExpiresAt ? new Date(drawerVvipExpiresAt).toLocaleString() : 'Tidak Terbatas'}
                      readOnly
                      className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs text-neutral-600 dark:text-neutral-300"
                    />

                    {/* 4 Quick Action Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-[11px] font-mono">
                      <button
                        onClick={() => handleQuickExpiry(7)}
                        className="py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 hover:bg-neutral-100 font-bold text-neutral-700 dark:text-neutral-300"
                      >
                        +7 Hari
                      </button>
                      <button
                        onClick={() => handleQuickExpiry(30)}
                        className="py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 hover:bg-neutral-100 font-bold text-[#ff3700]"
                      >
                        +30 Hari
                      </button>
                      <button
                        onClick={() => handleQuickExpiry(365)}
                        className="py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 hover:bg-neutral-100 font-bold text-amber-500"
                      >
                        +1 Tahun
                      </button>
                      <button
                        onClick={() => handleQuickExpiry(null)}
                        className="py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer: Action Buttons */}
            <div className="pt-6 border-t border-black/10 dark:border-white/10 flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedUser(null)}
                className="w-1/2 text-xs"
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={savingDrawer}
                onClick={handleSaveDrawerChanges}
                className="w-1/2 text-xs !font-bold gap-1.5 bg-[#ff3700] hover:bg-[#e03000] text-white"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingDrawer ? 'Menyimpan...' : 'Simpan'}</span>
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
