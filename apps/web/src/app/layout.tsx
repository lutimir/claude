import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CompareBar } from "@/components/CompareBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { appName } from "@/lib/config";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: { default: `${appName()} — ${t("tagline")}`, template: `%s · ${appName()}` },
    description: t("tagline"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <html lang="sk">
      <body className="flex min-h-screen flex-col bg-neutral-50 font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
        <Footer />
        <Suspense fallback={null}>
          <CompareBar ctaLabel={t("compareCta")} clearLabel={t("clearCompare")} />
        </Suspense>
      </body>
    </html>
  );
}
