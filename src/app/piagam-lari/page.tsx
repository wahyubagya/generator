import type { Metadata } from "next";
import PiagamLariGen from "@/components/generators/PiagamLariGen";

export const metadata: Metadata = {
  title: "Pajangan Medali Lari (Race Frame) | Aureate Craft",
  description: "Abadikan momen maraton, nama pelari, catatan waktu, dan gantung medali kebanggaanmu dalam frame 3D eksklusif.",
};

export default function Page() {
  return <PiagamLariGen />;
}
