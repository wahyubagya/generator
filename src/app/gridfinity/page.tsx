import type { Metadata } from "next";
import GridfinityGen from "@/components/generators/GridfinityGen";

export const metadata: Metadata = {
  title: "Organizer Gridfinity Custom | Aureate Craft",
  description: "Atur dimensi baris, kolom, dan sekat bin modular standar Gridfinity (42mm grid).",
};

export default function Page() {
  return <GridfinityGen />;
}
