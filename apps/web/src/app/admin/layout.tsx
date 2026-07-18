import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("admin");
  // Klientske komponenty adminu (FeedForm) potrebujú preklady aj na klientovi
  const messages = await getMessages();
  const tabs = [
    { href: "/admin", label: t("overview") },
    { href: "/admin/obchody", label: t("shops") },
    { href: "/admin/importy", label: t("imports") },
  ];
  return (
    <NextIntlClientProvider messages={messages}>
      <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <nav className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 text-sm dark:border-neutral-800 dark:bg-neutral-900">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="rounded-md px-3 py-1.5 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
