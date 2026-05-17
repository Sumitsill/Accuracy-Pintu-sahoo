import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Accuracy by Pintu Sahoo",
  description: "Master physics with a high-fidelity environment designed for high-achievers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-primary text-neutral min-h-screen font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
