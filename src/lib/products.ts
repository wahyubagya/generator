export type Product = {
  slug: string;
  route: string;
  title: string;
  desc: string;
  icon: string;
  category: "clicker" | "keychain" | "organizer" | "display" | "accessories";
  badge?: string;
  startingPrice: string;
  features: string[];
};

export const PRODUCTS: Product[] = [
  {
    slug: "character-clicker",
    route: "/bikin-clicker",
    title: "Clicker Karakter",
    desc: "Unggah gambar atau logo, rapikan desain, pilih warna filamen, dan lihat bentuk clicker pada preview 3D.",
    icon: "🎭",
    category: "clicker",
    badge: "Paling Populer",
    startingPrice: "Rp 35.000",
    features: [
      "Upload gambar / logo custom",
      "Relief timbul 3D otomatis",
      "Switch mekanikal tactile & clicky",
      "Pilihan ring gantungan kunci",
    ],
  },
  {
    slug: "keychain-clicker",
    route: "/generator/gantungan-keycap",
    title: "Gantungan Clicker Nama",
    desc: "Menyusun hingga 10 tombol switch mekanikal, mengisi huruf, angka, ikon, lalu melihat preview 3D.",
    icon: "🔑",
    category: "clicker",
    badge: "Best Seller",
    startingPrice: "Rp 25.000",
    features: [
      "1 hingga 10 slot switch mekanikal",
      "Pilihan huruf, angka, atau simbol",
      "Kombinasi warna base & keycap bebas",
      "Tali rantai atau ring carabiner",
    ],
  },
  {
    slug: "modular-clicker",
    route: "/generator/modular-clicker",
    title: "Clicker Nama Susun (Modular)",
    desc: "Menggabungkan huruf dan ikon menjadi clicker modular; jumlah modul dan warna dapat dibongkar-pasang.",
    icon: "🧩",
    category: "clicker",
    startingPrice: "Rp 30.000",
    features: [
      "Sistem interlock snap-fit presisi",
      "Tambah atau kurangi modul semaunya",
      "Variasi warna per modul",
      "Anti-stres & fidget friendly",
    ],
  },
  {
    slug: "name-tag",
    route: "/generator/gantungan-nama",
    title: "Gantungan Nama & Logo",
    desc: "Membuat gantungan dari nama atau gambar/logo, dengan bentuk outline, kotak, atau kapsul plus preview 3D.",
    icon: "🏷️",
    category: "keychain",
    startingPrice: "Rp 20.000",
    features: [
      "Pilihan font modern & playful",
      "Style outline, plat kotak, atau kapsul",
      "Kombinasi 2 warna dual-tone",
      "Kuat, ringan, & tidak mudah patah",
    ],
  },
  {
    slug: "keycap",
    route: "/generator/keycap",
    title: "Keycap Custom",
    desc: "Membuat tombol keyboard personal dengan profil Cherry/OEM, legenda teks, atau ikon pilihan.",
    icon: "⌨️",
    category: "accessories",
    startingPrice: "Rp 25.000",
    features: [
      "Kompatibel stem MX Cherry Switch",
      "Profil standar OEM / Cherry R4 / R1",
      "Legenda teks timbul atau cekung",
      "Pilihan warna filamen matte & silk",
    ],
  },
  {
    slug: "pen-clip",
    route: "/generator/clip-nama-alat-tulis",
    title: "Klip Nama Alat Tulis",
    desc: "Membuat penanda pensil atau pulpen dengan nama dan warna pilihan; pas untuk hadiah dan merchandise.",
    icon: "🖊️",
    category: "accessories",
    startingPrice: "Rp 15.000",
    features: [
      "Pas untuk pulpen standar & pensil",
      "Tulisan nama timbul presisi",
      "Cocok untuk souvenir & kantor",
      "Pencegah alat tulis tertukar",
    ],
  },
  {
    slug: "gridfinity",
    route: "/generator/gridfinity",
    title: "Organizer Gridfinity",
    desc: "Mengatur base dan bin modular sistem Gridfinity dengan ukuran kolom, baris, dan sekat kustom.",
    icon: "🗄️",
    category: "organizer",
    badge: "Sistem Modular",
    startingPrice: "Rp 35.000",
    features: [
      "Standar sistem Gridfinity (42mm grid)",
      "Kustom baris (X), kolom (Y), tinggi (Z)",
      "Opsi slot magnet atau baut di base",
      "Sekat kompartemen dinamis",
    ],
  },
  {
    slug: "lithophane",
    route: "/generator/lithophane",
    title: "Foto Timbul Transparan (Lithophane)",
    desc: "Mengubah foto kenangan menjadi relief 3D yang menampilkan detail gambar ketika disorot cahaya.",
    icon: "🖼️",
    category: "display",
    badge: "Kado Unik",
    startingPrice: "Rp 50.000",
    features: [
      "Gradasi ketebalan presisi sub-milimeter",
      "Opsi bentuk datar, melengkung, atau silinder",
      "Bahan putih high-density khusus cahaya",
      "Pilihan dudukan lampu LED",
    ],
  },
  {
    slug: "piagam-lari",
    route: "/generator/piagam-lari",
    title: "Pajangan Medali Lari",
    desc: "Mengabadikan rute lari, catatan waktu, jarak maraton, dan foto menjadi display piagam 3D eksklusif.",
    icon: "🏅",
    category: "display",
    badge: "Eksklusif",
    startingPrice: "Rp 85.000",
    features: [
      "Visualisasi peta rute GPS (GPX/manual)",
      "Slot gantung medali maraton",
      "Plat teks nama pelari & waktu tempuh",
      "Desain berdiri di meja atau tempel dinding",
    ],
  },
];
