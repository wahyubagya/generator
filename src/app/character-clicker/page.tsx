import type { Metadata } from "next";
import CharacterClickerGen from "@/components/generators/CharacterClickerGen";

export const metadata: Metadata = {
  title: "Clicker Karakter",
  description: "Upload gambar atau logo dan lihat versi clicker timbulnya dalam 3D.",
};

export default function Page() {
  return <CharacterClickerGen />;
}
