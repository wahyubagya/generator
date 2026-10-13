import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jasa 3D Print Custom & Generator Desain | Aureate Craft",
    template: "%s | Aureate Craft",
  },
  description:
    "Buat produk 3D print custom langsung dari browser. Desain fidget clicker, keycap nama, gantungan, Gridfinity, dan hadiah custom dengan preview 3D real-time.",
  keywords: [
    "3D print custom",
    "jasa 3D print",
    "generator 3D print",
    "fidget clicker",
    "keycap custom",
    "gridfinity indonesia",
    "Aureate Craft",
  ],
  authors: [{ name: "Aureate Craft" }],
  openGraph: {
    title: "Jasa 3D Print Custom & Generator Desain | Aureate Craft",
    description:
      "Buat produk 3D print custom langsung dari browser. Desain fidget clicker, keycap nama, gantungan, Gridfinity, dan hadiah custom dengan preview 3D.",
    url: "https://aureatecraft.id",
    siteName: "Aureate Craft",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id-ID" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SiteHeader />
        <main className="site-main">{children}</main>
        <SiteFooter />
        <WhatsAppFloatingButton />
      </body>
    </html>
  );
}
