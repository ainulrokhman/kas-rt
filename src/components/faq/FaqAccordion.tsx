"use client";

import React, { useState } from 'react';
import { Faq } from '@/types/faq';
import { ChevronDown } from 'lucide-react';

interface FaqAccordionProps {
  items: Faq[];
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800/60">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-slate-400">FAQ belum tersedia untuk kategori ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isOpen = openId === item.id;
        
        return (
          <div 
            key={item.id}
            className={`group transition-all duration-300 rounded-2xl border ${
              isOpen 
                ? 'bg-slate-800/60 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700/80'
            }`}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="w-full flex items-center justify-between p-5 text-left transition-all"
            >
              <span className={`text-base font-semibold pr-4 transition-colors ${
                isOpen ? 'text-indigo-300' : 'text-slate-200 group-hover:text-white'
              }`}>
                {item.question}
              </span>
              <div className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-indigo-400' : 'text-slate-500'}`} />
              </div>
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="p-5 pt-0 text-slate-400 leading-relaxed text-sm sm:text-base border-t border-slate-700/30 mt-2">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
