import type { Metadata } from "next";
import KeycapGen from "@/components/generators/KeycapGen";

export const metadata: Metadata = {
  title: "Keycap Custom",
  description: "Keycap dengan legenda teks atau gambar pilihanmu.",
};

export default function Page() {
  return <KeycapGen />;
}
