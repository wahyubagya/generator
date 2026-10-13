import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/gantungan-keycap", destination: "/generator/gantungan-keycap", permanent: false },
      { source: "/gantungan-nama", destination: "/generator/gantungan-nama", permanent: false },
      { source: "/clip-nama-alat-tulis", destination: "/generator/clip-nama-alat-tulis", permanent: false },
    ];
  },
};

export default nextConfig;
