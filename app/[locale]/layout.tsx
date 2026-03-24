import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Locale, routing } from "@/i18n/routing";
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NavigationProgress from "@/components/NavigationProgress";
import ThemeProvider from "@/components/ThemeProvider";
import AdBanner from "@/components/AdBanner";
import { shouldShowAds } from "@/lib/auth/plan-check";
import { Suspense } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://caiopeixoto.dev";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    pt: "Caio Peixoto — Desenvolvedor Fullstack & Ferramentas",
    en: "Caio Peixoto — Fullstack Developer & Tools",
    es: "Caio Peixoto — Desarrollador Fullstack & Herramientas",
  };

  const descriptions: Record<string, string> = {
    pt: "Portfólio e plataforma de ferramentas pessoais: gestão financeira, retroboard, todo list, time tracker e mais.",
    en: "Portfolio and personal tools platform: financial management, retroboard, todo list, time tracker and more.",
    es: "Portafolio y plataforma de herramientas personales: gestión financiera, retroboard, lista de tareas, control de tiempo y más.",
  };

  const title = titles[locale] || titles.pt;
  const description = descriptions[locale] || descriptions.pt;

  return {
    title: {
      default: title,
      template: `%s | Caio Peixoto`,
    },
    description,
    metadataBase: new URL(BASE_URL),
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      siteName: "Caio Peixoto",
      locale: locale === "pt" ? "pt_BR" : locale === "es" ? "es_ES" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        pt: `${BASE_URL}/pt`,
        en: `${BASE_URL}/en`,
        es: `${BASE_URL}/es`,
      },
    },
  };
}

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
  const showAds = await shouldShowAds();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        {/* {process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT && (
          <Script
            id="google-adsense"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT}`}
          />
        )} */}
        {showAds && process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT && (
          <script
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT}`}
          />
        )}
      </head>
      <body className="flex flex-col min-h-screen bg-page text-text-primary">
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <Suspense>
              <NavigationProgress label={t("loading")} />
            </Suspense>
            <Navbar locale={locale} />
            <main className="flex-1 w-full flex flex-col">
              {children}
              <div className="mt-auto">
                {showAds && <AdBanner />}
              </div>
            </main>
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
