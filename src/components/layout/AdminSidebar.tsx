"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCog,
  UserCircle,
  CircleDollarSign,
  FileText,
  PieChart,
  ClipboardList,
  HelpCircle,
  PiggyBank,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export function AdminSidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, user } = useAuth();

  const menuUtama = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  const menuKeuangan = [
    { name: "Jimpitan", href: "/jimpitan", icon: Wallet },
    { name: "Tabungan", href: "/tabungan", icon: PiggyBank },
    ...(user?.jabatan !== "Penarik Jimpitan"
      ? [{ name: "Buku Kas", href: "/kas", icon: CircleDollarSign }]
      : []),
  ];

  const menuData = [
    { name: "Data Warga", href: "/warga", icon: Users },
    ...(user?.jabatan !== "Penarik Jimpitan"
      ? [{ name: "Data Petugas", href: "/petugas", icon: UserCog }]
      : []),
  ];

  const laporanItems = [
    { name: "Lap. Jimpitan", href: "/laporan/jimpitan", icon: FileText },
    ...(user?.jabatan !== "Penarik Jimpitan" ? [
      { name: "Lap. Kas", href: "/laporan/kas", icon: PieChart },
      { name: "Audit Log", href: "/laporan/log", icon: ClipboardList },
    ] : []),
  ];

  const renderLink = (item: { name: string; href: string; icon: React.ElementType }) => {
    const isLaporan = item.href.startsWith("/laporan");
    const isActive = isLaporan 
      ? pathname.startsWith(item.href)
      : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium group relative overflow-hidden min-h-[44px]
          ${isActive ? activeClass : inactiveClass}`}
        onClick={() => setIsOpen(false)}
        title={isCollapsed ? item.name : undefined}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-full bg-gradient-to-r from-indigo-500/20 to-transparent" />
        )}
        <item.icon
          className={`w-5 h-5 flex-shrink-0 ${isActive
              ? "text-indigo-400"
              : "text-slate-400 group-hover:text-indigo-300 group-hover:scale-110 transition-transform duration-300"
            }`}
        />
        {!isCollapsed && (
          <span className="whitespace-nowrap tracking-wide text-sm">
            {item.name}
          </span>
        )}
      </Link>
    );
  };

  const activeClass =
    "bg-indigo-600/10 text-indigo-400 border-r-4 border-indigo-500 shadow-[inset_0_0_20px_rgba(79,70,229,0.15)]";
  const inactiveClass =
    "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all duration-300";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-[70] h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 lg:static ${isCollapsed ? "w-20" : "w-64"}
          shadow-2xl shadow-indigo-900/20 pb-20 lg:pb-0`}
      >
        {/* Logo Area */}
        <div className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-5 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="block text-base sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white tracking-tight truncate">
                  KasRT Admin
                </span>
                <span className="block text-xs text-slate-500 truncate">
                  Sistem Kas Rukun Tetangga
                </span>
              </div>
            )}
          </div>

          {/* Collapse Button (Desktop Only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex-shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1 custom-scrollbar">
          {/* Menu Utama */}
          {menuUtama.map((item) => renderLink(item))}

          {/* Menu Keuangan */}
          {!isCollapsed && (
            <p className="px-4 pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Keuangan RT
            </p>
          )}
          {menuKeuangan.map((item) => renderLink(item))}

          {/* Menu Data */}
          {!isCollapsed && (
            <p className="px-4 pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Data & Sistem
            </p>
          )}
          {menuData.map((item) => renderLink(item))}

          {laporanItems.length > 0 && (
            <>
              {!isCollapsed && (
                <p className="px-4 pt-6 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Laporan & Log
                </p>
              )}
              {laporanItems.map((item) => renderLink(item))}
            </>
          )}

          {/* FAQ Link */}
          <div className="pt-4">
            {renderLink({ name: "FAQ / Bantuan", href: "/faq", icon: HelpCircle })}
          </div>
        </nav>

        {/* Bottom: User Info + Logout */}
        <div className="border-t border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex-shrink-0">
          {/* User info chip */}
          {!isCollapsed && user && (
            <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-800/50">
              <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-9 h-9 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate leading-tight">
                  {user.nama_lengkap}
                </p>
                <p className="text-xs text-indigo-400 mt-0.5 truncate">
                  {user.jabatan}
                </p>
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="p-3">
            <button
              id="btn-logout"
              onClick={logout}
              className={`flex items-center gap-4 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 min-h-[44px] ${isCollapsed ? "justify-center" : ""}`}
              title="Keluar"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium text-sm">Keluar</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
