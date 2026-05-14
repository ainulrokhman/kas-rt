"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AuthProvider } from "@/lib/context/AuthContext";
import { AuthService } from "@/lib/services/authService";
import SyncIndicator from "@/components/jimpitan/SyncIndicator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Auth guard: redirect ke /login jika session tidak ada
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  // Mencegah dan menghapus stale Service Worker (sw.js) dari cache localhost lama 
  // yang memblokir request Firebase akibat Content Security Policy lawas.
  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (const registration of registrations) {
          registration.unregister();
          console.log("Stale Service Worker unregistered to prevent CSP block.");
        }
      });
    }
  }, []);

  return (
    <AuthProvider>
      <div className="flex h-screen bg-[#0B1120] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
        {/* Sidebar (Desktop static, Mobile Drawer) */}
        <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main Content Wrapper */}
        <div className="flex-1 flex flex-col h-screen min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B1120] to-[#0B1120]">
          
          {/* Top Header Navigation */}
          <AdminHeader setIsOpen={setSidebarOpen} />

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar pb-16 md:pb-0">
            {/* Subtle geometric background decoration */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
                 style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, #1e293b 1px)', backgroundSize: '40px 40px' }} 
            />
            
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative z-10 max-w-7xl">
              <SyncIndicator />
              {children}
            </div>
          </main>

          {/* Bottom Nav for Mobile */}
          <MobileBottomNav />
        </div>
      </div>
    </AuthProvider>
  );
}
