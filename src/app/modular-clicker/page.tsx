import type { Metadata } from "next";
import ModularClickerGen from "@/components/generators/ModularClickerGen";

export const metadata: Metadata = {
  title: "Clicker Modular",
  description: "Susun modul clicker sesuai selera dengan warna dan isi sendiri.",
};

export default function Page() {
  return <ModularClickerGen />;
}
