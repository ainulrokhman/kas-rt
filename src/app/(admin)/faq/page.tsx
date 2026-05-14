"use client";

import React, { useEffect, useState } from 'react';
import { Faq } from '@/types/faq';
import { FaqService } from '@/lib/services/faqService';
import { FaqAccordion } from '@/components/faq/FaqAccordion';
import { useAuth } from '@/lib/context/AuthContext';
import { HelpCircle, ShieldCheck } from 'lucide-react';

export default function AdminFaqPage() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.jabatan) return;

    // Use real-time observer for admin
    const unsub = FaqService.observeRelevantFaqs(user.jabatan, (data) => {
      setFaqs(data);
      setIsLoading(false);
    });

    return () => unsub();
  }, [user?.jabatan]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <HelpCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Pusat Bantuan Petugas</h1>
          </div>
          <p className="text-slate-400 text-sm max-w-md">
            Panduan penggunaan fitur sesuai jabatan Anda sebagai <span className="text-indigo-300 font-semibold">{user?.jabatan}</span>.
          </p>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Role Notice */}
      <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        <p className="text-xs text-emerald-200/70">
          FAQ di bawah mencakup informasi umum dan instruksi khusus untuk <span className="text-emerald-400 font-medium">{user?.jabatan}</span>.
        </p>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-900/40 animate-pulse rounded-2xl border border-slate-800/60" />
            ))}
          </div>
        ) : (
          <FaqAccordion items={faqs} />
        )}
      </div>

      {/* Bottom info */}
      <div className="text-center py-6">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">Butuh Bantuan Lain?</p>
        <p className="text-sm text-slate-400">Hubungi Ketua RT untuk koordinasi teknis lebih lanjut.</p>
      </div>
    </div>
  );
}
