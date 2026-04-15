import React from "react";
import WargaList from "@/components/warga/WargaList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Warga | KasRT Admin",
  description: "Manajemen data warga untuk RT",
};

export default function WargaPage() {
  return (
    <div className="w-full">
      <WargaList />
    </div>
  );
}
