"use client";

import React, { useEffect, useState } from 'react';
import { Faq } from '@/types/faq';
import { FaqService } from '@/lib/services/faqService';
import { FaqAccordion } from '@/components/faq/FaqAccordion';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export default function PublicFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Public user has no jabatan, so it will only fetch 'umum' category
    const fetchFaqs = async () => {
      try {
        const data = await FaqService.getRelevantFaqs();
        setFaqs(data);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg border-b border-slate-800/60 bg-[#0B1120]/80">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 hover:bg-slate-800/60 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-slate-100">Bantuan & FAQ</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <MessageCircle className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Punya Pertanyaan?</h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Temukan jawaban atas pertanyaan umum seputar penggunaan aplikasi Kas RT.
          </p>
        </div>

        {/* FAQ Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800/40 animate-pulse rounded-2xl border border-slate-800/60" />
            ))}
          </div>
        ) : (
          <FaqAccordion items={faqs} />
        )}

        {/* Footer Support */}
        <div className="mt-12 p-6 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 text-center">
          <p className="text-sm text-slate-300 mb-4">
            Masih butuh bantuan atau punya kendala lain?
          </p>
          <a 
            href="https://wa.me/your-number" // Replace with actual support number if available
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
          >
            Hubungi Pengurus RT
          </a>
        </div>
      </main>
    </div>
  );
}
