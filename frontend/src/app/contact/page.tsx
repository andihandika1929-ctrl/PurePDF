'use client';

import React, { useState } from 'react';
import { BentoCard } from '@/components/ui/BentoCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-12 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 text-xs font-mono font-semibold">
          <Mail className="w-3.5 h-3.5 text-[#ff3700]" />
          <span>GLOBAL SUPPORT</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-black dark:text-white">
          Get in Touch with <span className="font-editorial text-[#ff3700] font-normal">PurePDF</span>
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Have a question about our zero-file-storage policy, partnership inquiry, or technical feature request?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Contact Information (Span 5) */}
        <div className="md:col-span-5 space-y-6">
          <BentoCard padding="lg" rounded="xl" className="space-y-4">
            <h3 className="text-lg font-bold">Direct Channels</h3>
            <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400">
              <div>
                <span className="font-mono text-neutral-400 block uppercase text-[10px]">General Support</span>
                <a href="mailto:support@purepdf.app" className="text-black dark:text-white font-semibold hover:text-[#ff3700]">
                  support@purepdf.app
                </a>
              </div>

              <div>
                <span className="font-mono text-neutral-400 block uppercase text-[10px]">Security Audits</span>
                <a href="mailto:security@purepdf.app" className="text-black dark:text-white font-semibold hover:text-[#ff3700]">
                  security@purepdf.app
                </a>
              </div>

              <div>
                <span className="font-mono text-neutral-400 block uppercase text-[10px]">Response Time</span>
                <span className="text-black dark:text-white font-medium">Under 24 hours (Monday – Friday)</span>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Contact Form (Span 7) */}
        <div className="md:col-span-7">
          <BentoCard padding="lg" rounded="xl" className="space-y-6">
            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-in zoom-in-75 duration-200" />
                <h3 className="text-xl font-bold">Message Sent Successfully!</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Thank you for contacting PurePDF. Our team will review your message and reply to <strong>{formData.email}</strong> shortly.
                </p>
                <Button size="sm" variant="secondary" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
                    YOUR NAME
                  </label>
                  <Input
                    required
                    type="text"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
                    EMAIL ADDRESS
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
                    MESSAGE / INQUIRY
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us how we can help..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-2xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 p-4 text-sm text-black dark:text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"
                  />
                </div>

                <Button size="md" variant="primary" type="submit" className="w-full">
                  <Send className="w-4 h-4 mr-1.5" />
                  <span>Send Inquiry</span>
                </Button>
              </form>
            )}
          </BentoCard>
        </div>

      </div>

    </div>
  );
}
