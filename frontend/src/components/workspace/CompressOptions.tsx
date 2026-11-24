'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Minimize2,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Sliders,
  Settings2,
  Image as ImageIcon
} from 'lucide-react';

export interface AdvancedCompressSettings {
  mode: 'preset' | 'advanced';
  level?: 'low' | 'medium' | 'high';
  dpi: number;
  quality: number; // 0.1 to 1.0
  grayscale: boolean;
  removeMetadata: boolean;
}

interface CompressOptionsProps {
  file: File;
  onCompress: (settings: AdvancedCompressSettings) => void;
  isProcessing: boolean;
  language?: 'en' | 'id';
}

export const CompressOptions: React.FC<CompressOptionsProps> = ({
  file,
  onCompress,
  isProcessing,
  language = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'advanced'>('preset');
  const [selectedLevel, setSelectedLevel] = useState<'low' | 'medium' | 'high'>('medium');

  // Advanced PDF24-style controls
  const [dpi, setDpi] = useState<number>(144);
  const [qualityPercent, setQualityPercent] = useState<number>(65);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [removeMetadata, setRemoveMetadata] = useState<boolean>(true);

  const isId = language === 'id';

  const origSizeMb = file.size / (1024 * 1024);
  const origSizeFormatted =
    origSizeMb >= 1
      ? `${origSizeMb.toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

  const presetLevels = [
    {
      id: 'low' as const,
      nameEn: 'Low Compression',
      nameId: 'Kompresi Rendah',
      badgeEn: 'High Quality (200 DPI, 85%)',
      badgeId: 'Kualitas Tinggi (200 DPI, 85%)',
      descEn: 'High image quality. Ideal for printing, portfolios, and official presentations.',
      descId: 'Kualitas gambar tinggi. Cocok untuk cetak, portofolio, dan presentasi resmi.',
      estimatedRatio: 0.75,
      dpi: 200,
      quality: 0.85,
    },
    {
      id: 'medium' as const,
      nameEn: 'Recommended',
      nameId: 'Direkomendasikan',
      badgeEn: 'Balanced (144 DPI, 65%)',
      badgeId: 'Seimbang (144 DPI, 65%)',
      descEn: 'Optimal balance between crisp readability and light file size.',
      descId: 'Keseimbangan terbaik antara teks tajam dan ukuran hemat.',
      recommended: true,
      estimatedRatio: 0.48,
      dpi: 144,
      quality: 0.65,
    },
    {
      id: 'high' as const,
      nameEn: 'Extreme Compression',
      nameId: 'Kompresi Ekstrem',
      badgeEn: 'Smallest Size (72 DPI, 40%)',
      badgeId: 'Ukuran Terkecil (72 DPI, 40%)',
      descEn: 'Maximum size reduction for strict email attachments and portal upload limits.',
      descId: 'Ukuran terkecil untuk syarat upload email & formulir berkas.',
      estimatedRatio: 0.22,
      dpi: 72,
      quality: 0.40,
    },
  ];

  // Dynamic live size estimation formula for Advanced mode
  const advancedEstimatedRatio = Math.max(
    0.15,
    Math.min(
      0.95,
      (dpi / 220) * 0.6 * (qualityPercent / 100) * (grayscale ? 0.75 : 1.0)
    )
  );

  const advancedEstimatedSizeFormatted =
    file.size * advancedEstimatedRatio >= 1024 * 1024
      ? `${((file.size * advancedEstimatedRatio) / (1024 * 1024)).toFixed(2)} MB`
      : `${((file.size * advancedEstimatedRatio) / 1024).toFixed(0)} KB`;

  const handleStart = () => {
    if (activeTab === 'preset') {
      const selected = presetLevels.find((p) => p.id === selectedLevel) || presetLevels[1];
      onCompress({
        mode: 'preset',
        level: selectedLevel,
        dpi: selected.dpi,
        quality: selected.quality,
        grayscale: false,
        removeMetadata: true,
      });
    } else {
      onCompress({
        mode: 'advanced',
        dpi,
        quality: qualityPercent / 100,
        grayscale,
        removeMetadata,
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* File summary header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-100/70 dark:bg-zinc-800/70 border border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 shadow-sm text-[#ff3700]">
            <Minimize2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-black dark:text-white truncate max-w-xs sm:max-w-md">
              {file.name}
            </h4>
            <p className="text-xs text-neutral-500 font-mono">
              {isId ? 'Ukuran Awal:' : 'Original Size:'}{' '}
              <span className="font-bold text-neutral-800 dark:text-neutral-200">
                {origSizeFormatted}
              </span>
            </p>
          </div>
        </div>

        {/* Tab switcher: Quick Preset vs Advanced Parameters */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'preset'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            {isId ? 'Pilihan Cepat' : 'Quick Presets'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'advanced'
                ? 'bg-[#ff3700] text-white shadow-sm'
                : 'text-neutral-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{isId ? 'Pengaturan Lanjutan' : 'Advanced (DPI & %)'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: QUICK PRESETS */}
      {activeTab === 'preset' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presetLevels.map((lvl) => {
            const isSelected = selectedLevel === lvl.id;
            const estimatedSize =
              file.size * lvl.estimatedRatio >= 1024 * 1024
                ? `${((file.size * lvl.estimatedRatio) / (1024 * 1024)).toFixed(2)} MB`
                : `${((file.size * lvl.estimatedRatio) / 1024).toFixed(0)} KB`;

            return (
              <div
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`relative cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#ff3700] bg-[#ff3700]/5 shadow-[0px_4px_20px_rgba(255,55,0,0.12)] scale-[1.01]'
                    : 'border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-black/30 dark:hover:border-white/30'
                }`}
              >
                {lvl.recommended && (
                  <div className="absolute -top-3 left-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ff3700] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {isId ? 'Paling Populer' : 'Best Choice'}
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-black dark:text-white">
                      {isId ? lvl.nameId : lvl.nameEn}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#ff3700] bg-[#ff3700]'
                          : 'border-neutral-300 dark:border-zinc-700'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {isId ? lvl.descId : lvl.descEn}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">{isId ? 'Perkiraan:' : 'Estimated:'}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ~{estimatedSize}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: ADVANCED PARAMETER CONTROLS (PDF24 Style) */}
      {activeTab === 'advanced' && (
        <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. DPI Setting: Free Slider (50 to 300 DPI) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono">
                  {isId ? 'Resolusi DPI' : 'Resolution DPI'}
                </label>
                <span className="text-xs font-mono font-bold text-[#ff3700] px-2.5 py-0.5 rounded-full bg-[#ff3700]/10 border border-[#ff3700]/20">
                  {dpi} DPI
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="5"
                value={dpi}
                onChange={(e) => setDpi(parseInt(e.target.value, 10))}
                className="w-full accent-[#ff3700]"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>50 DPI (Kecil)</span>
                <span>110 DPI</span>
                <span>144 DPI (Standar)</span>
                <span>200 DPI</span>
                <span>300 DPI (Cetak)</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                {isId
                  ? 'Geser bebas untuk menentukan tingkat ketajaman gambar (50 DPI untuk file sangat kecil, 300 DPI untuk kualitas cetak).'
                  : 'Freely slide to balance embedded image sharpness and size (50 DPI for smallest size, 300 DPI for print quality).'}
              </p>
            </div>

            {/* 2. Image Quality % Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono">
                  {isId ? 'Kualitas Gambar' : 'Image Quality'}
                </label>
                <span className="text-xs font-mono font-bold text-[#ff3700]">
                  {qualityPercent}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={qualityPercent}
                onChange={(e) => setQualityPercent(parseInt(e.target.value, 10))}
                className="w-full accent-[#ff3700]"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>10% (Kecil)</span>
                <span>50% (Sedang)</span>
                <span>85% (Tinggi)</span>
                <span>100% (Maksimal)</span>
              </div>
            </div>

          </div>

          {/* 3. Checkbox toggles (Grayscale & Metadata) */}
          <div className="pt-4 border-t border-black/5 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
                className="rounded accent-[#ff3700] w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-black dark:text-white block">
                  {isId ? 'Ubah ke Skala Abu-Abu (Grayscale)' : 'Convert to Grayscale'}
                </span>
                <span className="text-[11px] text-neutral-500">
                  {isId ? 'Menghemat ~25% ukuran tambahan' : 'Save ~25% extra size'}
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={removeMetadata}
                onChange={(e) => setRemoveMetadata(e.target.checked)}
                className="rounded accent-[#ff3700] w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-black dark:text-white block">
                  {isId ? 'Hapus Metadata Dokumen' : 'Remove Document Metadata'}
                </span>
                <span className="text-[11px] text-neutral-500">
                  {isId ? 'Bersihkan nama penulis & riwayat' : 'Strip author, subject & tags'}
                </span>
              </div>
            </label>

          </div>

          {/* Live estimated output banner */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs">
            <span className="text-emerald-800 dark:text-emerald-300 font-medium">
              {isId ? 'Perkiraan Ukuran Hasil:' : 'Estimated Output File Size:'}
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
              ~{advancedEstimatedSizeFormatted} ({Math.round((1 - advancedEstimatedRatio) * 100)}% {isId ? 'lebih hemat' : 'smaller'})
            </span>
          </div>
        </div>
      )}

      {/* Vector Sharpness Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs">
        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-amber-900 dark:text-amber-200 block">
            {isId ? 'Ketajaman Teks Vektor 100% Terjaga' : '100% Vector Text Sharpness Preserved'}
          </span>
          <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px] leading-relaxed">
            {isId
              ? 'PurePDF tidak merender teks ke format gambar JPEG; seluruh font dan kurva vektor tetap tajam sempurna saat di-zoom. Kompresi hanya menyasar gambar tertanam dan metadata dokumen.'
              : 'PurePDF never rasterizes text to JPEG images; all fonts and vector curves remain pristine at any zoom level. Compression strictly targets embedded images and metadata.'}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 sm:p-6 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-black flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0px_4px_24px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-600">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>
            {isId
              ? 'Zero-storage: Kompresi berjalan di memori browser tanpa upload'
              : 'Zero server retention: Recompressed directly inside browser memory'}
          </span>
        </div>

        <Button
          size="lg"
          onClick={handleStart}
          disabled={isProcessing}
          className="w-full sm:w-auto bg-[#ff3700] hover:bg-[#e03000] text-white font-bold h-12 px-8 rounded-full shadow-[0px_2px_12px_rgba(255,55,0,0.35)]"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isId ? 'Mengompres...' : 'Compressing...'}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {isId ? 'Kompres PDF Sekarang' : 'Compress PDF Now'}
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </div>

    </div>
  );
};
