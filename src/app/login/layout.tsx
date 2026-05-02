import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | KasRT Admin",
  description: "Masuk ke sistem manajemen Kas RT",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

