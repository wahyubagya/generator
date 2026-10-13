import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS } from "@/lib/products";
import CharacterClickerGen from "@/components/generators/CharacterClickerGen";
import KeychainClickerGen from "@/components/generators/KeychainClickerGen";
import ModularClickerGen from "@/components/generators/ModularClickerGen";
import NameTagGen from "@/components/generators/NameTagGen";
import KeycapGen from "@/components/generators/KeycapGen";
import PenClipGen from "@/components/generators/PenClipGen";
import GridfinityGen from "@/components/generators/GridfinityGen";
import LithophaneGen from "@/components/generators/LithophaneGen";
import PiagamLariGen from "@/components/generators/PiagamLariGen";

// Map slugs (both Indonesian from PDF and standard slugs) to components
const SLUG_MAP: Record<string, {
  component: React.ComponentType;
  productSlug: string;
}> = {
  "gantungan-keycap": { component: KeychainClickerGen, productSlug: "keychain-clicker" },
  "keychain-clicker": { component: KeychainClickerGen, productSlug: "keychain-clicker" },
  "modular-clicker": { component: ModularClickerGen, productSlug: "modular-clicker" },
  "gantungan-nama": { component: NameTagGen, productSlug: "name-tag" },
  "name-tag": { component: NameTagGen, productSlug: "name-tag" },
  "keycap": { component: KeycapGen, productSlug: "keycap" },
  "clip-nama-alat-tulis": { component: PenClipGen, productSlug: "pen-clip" },
  "pen-clip": { component: PenClipGen, productSlug: "pen-clip" },
  "gridfinity": { component: GridfinityGen, productSlug: "gridfinity" },
  "lithophane": { component: LithophaneGen, productSlug: "lithophane" },
  "piagam-lari": { component: PiagamLariGen, productSlug: "piagam-lari" },
  "bikin-clicker": { component: CharacterClickerGen, productSlug: "character-clicker" },
  "character-clicker": { component: CharacterClickerGen, productSlug: "character-clicker" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const match = SLUG_MAP[slug];
  if (!match) return { title: "Generator Tidak Ditemukan" };

  const prod = PRODUCTS.find((p) => p.slug === match.productSlug);
  return {
    title: prod ? `${prod.title} 3D Generator | Aureate Craft` : "Generator 3D | Aureate Craft",
    description: prod?.desc || "Desain dan kustomisasi produk 3D langsung dari browser dengan preview realtime.",
  };
}

export default async function GeneratorDynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = SLUG_MAP[slug];

  if (!match) {
    notFound();
  }

  const Component = match.component;
  return <Component />;
}
