import type { Metadata } from "next";
import CharacterClickerGen from "@/components/generators/CharacterClickerGen";

export const metadata: Metadata = {
  title: "Clicker Karakter | Aureate Craft",
  description: "Unggah gambar atau logo, rapikan desain, pilih warna filamen, dan lihat bentuk clicker pada preview 3D.",
};

export default function Page() {
  return <CharacterClickerGen />;
}
