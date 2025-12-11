import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Locale, routing } from "@/i18n/routing";
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Retrospectiva",
  description: "Projeto colaborativo em tempo real",
};

export default async function RootLayout({
    children,
    params,
  }: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <>
      <Script
        id="google-adsense"
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9139888704774684"
      />
      <html lang={locale} suppressHydrationWarning>
        <body className="flex flex-col min-h-screen bg-blue-100 text-gray-900">
          <NextIntlClientProvider messages={messages}>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
          </NextIntlClientProvider>
        </body>
      </html>
    </>
  );
}