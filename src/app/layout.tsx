import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Финансы",
  description: "Личное приложение для учета доходов и расходов.",
  keywords: ["финансы", "учет", "доходы", "расходы", "бюджет"],
  authors: [{ name: "Nik" }],
  icons: {
    icon: "/app-icon.svg",
  },
  openGraph: {
    title: "Финансы",
    description: "Личное приложение для учета доходов и расходов.",
    siteName: "Финансы",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Финансы",
    description: "Личное приложение для учета доходов и расходов.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
