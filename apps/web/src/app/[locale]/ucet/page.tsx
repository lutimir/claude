import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { schema } from "@app0/db";
import { desc, eq } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { logout, sendMagicLink } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title"), robots: { index: false } };
}

interface AccountPageProps {
  searchParams: Promise<{ stav?: string }>;
}

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-900";
const buttonClass =
  "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700";

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const t = await getTranslations("account");
  const { stav } = await searchParams;
  const user = await getSessionUser();

  if (!user) {
    const messages: Record<string, string> = {
      skontroluj: t("checkEmail"),
      neplatny: t("invalidLink"),
      limit: t("limit"),
      chyba: t("error"),
    };
    return (
      <div className="mx-auto max-w-md rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-bold">{t("loginTitle")}</h1>
        <p className="mt-2 text-sm text-neutral-500">{t("loginDescription")}</p>
        {stav && messages[stav] ? (
          <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium dark:bg-neutral-800">
            {messages[stav]}
          </p>
        ) : null}
        <form action={sendMagicLink} className="mt-4 flex gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder={t("email")}
            className={`${inputClass} flex-1`}
          />
          <button type="submit" className={buttonClass}>
            {t("loginSubmit")}
          </button>
        </form>
      </div>
    );
  }

  const db = getDb();
  const [favorites, alerts] = await Promise.all([
    db.query.favorites.findMany({
      where: eq(schema.favorites.userId, user.id),
      with: { product: { columns: { name: true, slug: true } } },
      orderBy: [desc(schema.favorites.createdAt)],
    }),
    // prepojenie podľa e-mailu — vidí aj alarmy vytvorené pred registráciou
    db.query.priceAlerts.findMany({
      where: eq(schema.priceAlerts.email, user.email),
      with: { product: { columns: { name: true, slug: true } } },
      orderBy: [desc(schema.priceAlerts.createdAt)],
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-500">{user.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-neutral-300 px-3 py-1.5 transition hover:border-red-400 hover:text-red-600 dark:border-neutral-700"
            >
              {t("logout")}
            </button>
          </form>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("favorites")}</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-neutral-500">{t("favoritesEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {favorites.map((favorite) => (
              <li key={favorite.id}>
                <Link
                  href={`/produkt/${favorite.product.slug}`}
                  className="text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  ♥ {favorite.product.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("alerts")}</h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-neutral-500">{t("alertsEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
              >
                <Link
                  href={`/produkt/${alert.product.slug}`}
                  className="font-medium hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  {alert.product.name}
                </Link>
                <span className="text-neutral-500">
                  ≤ {formatPrice(alert.targetPrice, alert.currency)}
                </span>
                <Link
                  href={`/alarm/${alert.token}`}
                  className="text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {t("manageAlert")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
