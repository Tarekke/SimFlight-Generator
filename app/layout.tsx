import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimFlight Generator",
  description: "Lokale Wetter- und X-Plane-12-App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
