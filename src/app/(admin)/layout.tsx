"use client";

import React, { useState } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Sidebar (Desktop static, Mobile Drawer) */}
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0B1120] to-[#0B1120]">
        
        {/* Top Header Navigation */}
        <AdminHeader setIsOpen={setSidebarOpen} />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar">
          {/* Subtle geometric background decoration */}
          <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
               style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #4f46e5 1px, #1e293b 1px)', backgroundSize: '40px 40px' }} 
          />
          
          <div className="container mx-auto p-4 sm:p-6 lg:p-8 relative z-10 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
