import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { AppProvider } from "@/components/shared/app-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Bankroll Sidekick",
  description: "A local-first poker bankroll and session tracking app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
