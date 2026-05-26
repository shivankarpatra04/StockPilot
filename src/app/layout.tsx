// filepath: src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StockPilot — Data-Driven Stock Intelligence Platform",
  description:
    "Compare stocks, get data insights, and discover hidden opportunities. StockPilot is built for modern retail investors who want data-driven decisions.",
  keywords: [
    "stock analysis",
    "Smart investing",
    "stock comparison",
    "market insights",
    "retail investors",
    "Stock intelligence",
  ],
  authors: [{ name: "StockPilot" }],
  creator: "StockPilot",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://stockpilot.vercel.app",
    title: "StockPilot — Data-Driven Stock Intelligence",
    description:
      "Your data-driven stock intelligence platform. Compare stocks, spot opportunities, and get System-generated insights.",
    siteName: "StockPilot",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background text-text-primary min-h-screen antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
