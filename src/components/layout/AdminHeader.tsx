"use client";

import React from "react";
import { Menu, Bell, Search, UserCircle } from "lucide-react";

interface HeaderProps {
  setIsOpen: (val: boolean) => void;
}

export function AdminHeader({ setIsOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left section: Hamburger menu for mobile */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Optional Search Bar - hide on very small screens */}
        <div className="hidden sm:flex items-center relative group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari warga, iuran..." 
            className="bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 rounded-full pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right section: Profile & Notifications */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification Bell */}
        <button className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900"></span>
        </button>

        {/* Profile Dropdown Trigger */}
        <div className="h-10 border-l border-slate-700/50 mx-1 hidden sm:block"></div>
        
        <button className="flex items-center gap-3 pl-2 sm:pl-0 p-1 pr-3 rounded-full hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700/50 min-h-[44px]">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center overflow-hidden">
            <UserCircle className="w-8 h-8" />
          </div>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span className="text-sm font-semibold text-slate-200">Admin</span>
            <span className="text-xs text-indigo-400 mt-1">Pengurus RT</span>
          </div>
        </button>
      </div>
    </header>
  );
}
