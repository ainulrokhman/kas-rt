"use client";

import React from "react";
import { Menu, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { usePathname } from "next/navigation";

interface HeaderProps {
  setIsOpen: (val: boolean) => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/warga": "Data Warga",
  "/jimpitan": "Jimpitan",
  "/petugas": "Manajemen Petugas",
  "/petugas/tambah": "Tambah Petugas",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Prefix match
  const match = Object.keys(PAGE_TITLES)
    .filter((k) => pathname.startsWith(k) && k !== "/")
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : "Admin";
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function formatTanggal(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AdminHeader({ setIsOpen }: HeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  const pageTitle = getPageTitle(pathname);
  const firstName = user?.nama_lengkap?.split(" ")[0] ?? "Petugas";

  return (
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left section: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Page info */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">
            {pageTitle}
          </h2>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
            {formatTanggal()}
          </p>
        </div>
      </div>

      {/* Right section: Greeting + Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Greeting text — hidden on very small screens */}
        <div className="hidden md:flex flex-col items-end leading-none">
          <span className="text-xs text-slate-400">{getGreeting()},</span>
          <span className="text-sm font-semibold text-slate-200 mt-0.5">
            {firstName}
          </span>
        </div>


        {/* Divider */}
        <div className="h-8 border-l border-slate-700/50 hidden sm:block" />

        {/* Profile Chip */}
        <div className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700/50 min-h-[44px]">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center overflow-hidden flex-shrink-0">
            <UserCircle className="w-8 h-8" />
          </div>
          {/* Show first name on mobile, full detail on sm+ */}
          <div className="flex flex-col items-start leading-none">
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              {firstName}
            </span>
            <span className="text-xs text-indigo-400 mt-0.5">
              {user?.jabatan ?? "RT"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
