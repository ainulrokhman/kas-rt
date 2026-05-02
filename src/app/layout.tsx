import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

import InstallPWA from "@/components/layout/InstallPWA";

export const metadata: Metadata = {
  title: "Kas RT - Transparansi Keuangan Warga",
  description: "Aplikasi manajemen kas RT untuk transparansi dan kemudahan warga.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kas RT",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <InstallPWA />
      </body>
    </html>
  );
}

