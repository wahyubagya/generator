import type { Metadata } from "next";
import NameTagGen from "@/components/generators/NameTagGen";

export const metadata: Metadata = {
  title: "Name Tag",
  description: "Name tag nama dengan outline, kotak, atau kapsul plus ring gantungan.",
};

export default function Page() {
  return <NameTagGen />;
}
