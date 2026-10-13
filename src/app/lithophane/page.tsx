import type { Metadata } from "next";
import LithophaneGen from "@/components/generators/LithophaneGen";

export const metadata: Metadata = {
  title: "Foto Timbul Transparan (Lithophane) | Aureate Craft",
  description: "Ubah foto kenangan menjadi relief 3D yang menampilkan detail gambar ketika disorot cahaya.",
};

export default function Page() {
  return <LithophaneGen />;
}
