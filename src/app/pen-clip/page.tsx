import type { Metadata } from "next";
import PenClipGen from "@/components/generators/PenClipGen";

export const metadata: Metadata = {
  title: "Pen Clip",
  description: "Klip pulpen bernama untuk hadiah dan merchandise.",
};

export default function Page() {
  return <PenClipGen />;
}
