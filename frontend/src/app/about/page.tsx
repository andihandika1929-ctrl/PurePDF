import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BentoCard } from '@/components/ui/BentoCard';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Cpu, Globe2, Sparkles, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About PurePDF — Privacy-First Document Architecture',
  description: 'Learn about PurePDF’s mission to provide fast, zero-file retention PDF manipulation online.'
};

export default function AboutPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-12 space-y-12">
      
      {/* Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 text-xs font-mono font-semibold">
          <Globe2 className="w-3.5 h-3.5 text-[#ff3700]" />
          <span>OUR PHILOSOPHY</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-black dark:text-white">
          Reinventing the <span className="font-editorial text-[#ff3700] font-normal">PDF experience</span> for modern privacy.
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
          Traditional online PDF tools upload your sensitive contracts, tax returns, and bank statements to remote servers. PurePDF was built to end that.
        </p>
      </div>

      {/* Grid of Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <BentoCard padding="lg" rounded="xl" className="space-y-3">
          <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">100% Client-Side Free Tools</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            By compiling high-performance PDF manipulation engines directly into WebAssembly, 21 common PDF operations execute locally inside your browser memory.
          </p>
        </BentoCard>

        <BentoCard padding="lg" rounded="xl" className="space-y-3">
          <div className="p-3 w-fit rounded-xl bg-[#ff3700]/10 text-[#ff3700]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Ephemeral Neural Processing</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            When heavy AI models are required (OCR, translation, summarization), documents pass through encrypted memory buffers that auto-purge the instant export completes.
          </p>
        </BentoCard>

        <BentoCard padding="lg" rounded="xl" className="space-y-3">
          <div className="p-3 w-fit rounded-xl bg-neutral-100 dark:bg-zinc-800 text-black dark:text-white">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Tactile Bento UI System</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Engineered with a high-fidelity visual system featuring physical depth, multi-stop layered drop shadows, and responsive interaction physics.
          </p>
        </BentoCard>

        <BentoCard padding="lg" rounded="xl" className="space-y-3">
          <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-500">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Independent & Sustainable</h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Monetized sustainably through non-intrusive Google AdSense and optional VVIP memberships without selling user data or tracking identities.
          </p>
        </BentoCard>

      </div>

      <div className="text-center pt-6">
        <Link href="/">
          <Button size="lg" variant="accent">
            Explore 26 Tools
          </Button>
        </Link>
      </div>

    </div>
  );
}
