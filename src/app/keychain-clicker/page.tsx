import type { Metadata } from "next";
import KeychainClickerGen from "@/components/generators/KeychainClickerGen";

export const metadata: Metadata = {
  title: "Gantungan Clicker Nama",
  description: "Pilih 1–10 tombol dan isi dengan huruf, angka, ikon, atau gambar.",
};

export default function Page() {
  return <KeychainClickerGen />;
}
