"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  CircleDollarSign,
  PiggyBank
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Jimpitan", href: "/jimpitan", icon: Wallet },
    { label: "Tabung", href: "/tabungan", icon: PiggyBank },
    ...(user?.jabatan !== "Penarik Jimpitan"
      ? [{ label: "Kas", href: "/kas", icon: CircleDollarSign }]
      : []),
    { label: "Warga", href: "/warga", icon: Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/60 pb-safe-area-inset-bottom shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
                isActive ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                isActive ? "bg-indigo-500/15 scale-110" : ""
              }`}>
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? "opacity-100" : "opacity-70"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
