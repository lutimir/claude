import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getMessages, getTranslations } from "next-intl/server";
import { CompareBar } from "@/components/CompareBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { routing } from "@/i18n/routing";
import { appName } from "@/lib/config";
import "./globals.css";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("common");
  return {
    metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
    title: { default: `${appName()} — ${t("tagline")}`, template: `%s · ${appName()}` },
    description: t("tagline"),
    alternates: {
      canonical: locale === "sk" ? "/" : `/${locale}`,
      languages: { sk: "/", cs: "/cs" },
    },
    openGraph: {
      siteName: appName(),
      type: "website",
      locale: locale === "cs" ? "cs_CZ" : "sk_SK",
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("common");
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col bg-neutral-50 font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <Footer />
          <Suspense fallback={null}>
            <CompareBar ctaLabel={t("compareCta")} clearLabel={t("clearCompare")} />
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
