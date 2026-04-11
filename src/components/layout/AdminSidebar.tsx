"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export function AdminSidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Warga", href: "/residents", icon: Users },
    { name: "Kas & Iuran", href: "/transactions", icon: Wallet },
    { name: "Laporan", href: "/reports", icon: FileText },
    { name: "Pengaturan", href: "/settings", icon: Settings },
  ];

  const activeClass = "bg-indigo-600/10 text-indigo-400 border-r-4 border-indigo-500 shadow-[inset_0_0_20px_rgba(79,70,229,0.15)]";
  const inactiveClass = "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all duration-300";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 lg:static ${isCollapsed ? "w-20" : "w-72"}
          shadow-2xl shadow-indigo-900/20`}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white tracking-tight">
                KasRT Admin
              </span>
            )}
          </div>
          
          {/* Collapse Button (Desktop Only) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium group relative overflow-hidden min-h-[44px]
                  ${isActive ? activeClass : inactiveClass}`}
                onClick={() => setIsOpen(false)} // close on mobile select
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-full bg-gradient-to-r from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-indigo-300 group-hover:scale-110 transition-transform duration-300"}`} />
                {!isCollapsed && (
                  <span className="whitespace-nowrap tracking-wide">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile / Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
          <button className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 min-h-[44px]">
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
