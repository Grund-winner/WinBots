import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";
import { ConfigProvider } from "@/components/config-provider";
import { RouterProvider } from "@/components/router";
import AppRouter from "@/components/app-router";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "WinBots - Bots de Prediction Casino",
  description: "Accedez a des algorithmes de prediction avances pour Aviator, Crash, Dice, Mines et plus. Inscrivez-vous gratuitement.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>
          <ConfigProvider>
            <RouterProvider>
              {children}
            </RouterProvider>
          </ConfigProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
