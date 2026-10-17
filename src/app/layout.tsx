import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
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
    <html
      lang="id-ID"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <SiteHeader />
        <main className="site-main">{children}</main>
        <SiteFooter />
        <WhatsAppFloatingButton />
      </body>
    </html>
  );
}
