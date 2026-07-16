import "./globals.css";

export const metadata = {
  title: "GANAP — Gestión ganadera",
  description: "Sistema de administración de fincas ganaderas: pedigree, vacunación, veterinario y mercado.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
