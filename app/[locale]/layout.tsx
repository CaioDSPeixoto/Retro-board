import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Locale, routing } from "@/i18n/routing";
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Script from "next/script";
import AdBanner from "@/components/AdBanner";
import NavigationProgress from "@/components/NavigationProgress";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Caio Peixoto",
  description: "Portfólio e sistema de ferramentas",
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
  const t = await getTranslations("Common");

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* {process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT && (
          <Script
            id="google-adsense"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT}`}
          />
        )} */}
      </head>
      <body className="flex flex-col min-h-screen bg-blue-100 text-gray-900">
        <NextIntlClientProvider messages={messages}>
          <Suspense>
            <NavigationProgress label={t("loading")} />
          </Suspense>
          <Navbar locale={locale} />
          <main className="flex-1 w-full flex flex-col">
            {children}
            <div className="mt-auto">
              {/* <AdBanner /> */}
            </div>
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
