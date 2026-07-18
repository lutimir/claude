import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { schema } from "@app0/db";
import { eq } from "drizzle-orm";
import { cancelAlert, confirmAlert, rearmAlert } from "../actions";
import { getDb } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

interface AlertPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ akcia?: string; stav?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("alert");
  return { title: t("title"), robots: { index: false } };
}

export default async function AlertPage({ params, searchParams }: AlertPageProps) {
  const t = await getTranslations("alert");
  const tCommon = await getTranslations("common");
  const { token } = await params;
  const { akcia, stav } = await searchParams;

  const db = getDb();

  if (stav === "zruseny") {
    return (
      <Card>
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">{t("cancelled")}</p>
        <BackHome label={tCommon("backHome")} />
      </Card>
    );
  }

  let alert = await db.query.priceAlerts.findFirst({
    where: eq(schema.priceAlerts.token, token),
    with: { product: true },
  });

  // Potvrdenie kliknutím na odkaz z e-mailu (idempotentné)
  if (alert && akcia === "potvrdit" && !alert.confirmedAt) {
    await db
      .update(schema.priceAlerts)
      .set({ confirmedAt: new Date() })
      .where(eq(schema.priceAlerts.id, alert.id));
    alert = { ...alert, confirmedAt: new Date() };
  }

  if (!alert) {
    return (
      <Card>
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">{t("missing")}</p>
        <BackHome label={tCommon("backHome")} />
      </Card>
    );
  }

  const status = !alert.confirmedAt
    ? { label: t("statusPending"), tone: "text-amber-700 dark:text-amber-400" }
    : alert.notifiedAt
      ? { label: t("statusNotified"), tone: "text-blue-700 dark:text-blue-400" }
      : { label: t("statusActive"), tone: "text-emerald-700 dark:text-emerald-400" };

  const buttonClass =
    "rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50";

  return (
    <Card>
      <h1 className="text-xl font-bold">{t("title")}</h1>
      {akcia === "potvrdit" && alert.confirmedAt ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {t("confirmedMessage")}
        </p>
      ) : null}

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">{t("product")}</dt>
          <dd className="font-medium">
            <Link
              href={`/produkt/${alert.product.slug}`}
              className="text-emerald-700 hover:underline dark:text-emerald-400"
            >
              {alert.product.name}
            </Link>
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">{t("targetPrice")}</dt>
          <dd className="font-medium">{formatPrice(alert.targetPrice, alert.currency)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">{t("statusLabel")}</dt>
          <dd className={`font-medium ${status.tone}`}>{status.label}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {!alert.confirmedAt ? (
          <form action={confirmAlert}>
            <input type="hidden" name="token" value={alert.token} />
            <button
              type="submit"
              className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              {t("confirm")}
            </button>
          </form>
        ) : null}
        {alert.confirmedAt && alert.notifiedAt ? (
          <form action={rearmAlert}>
            <input type="hidden" name="token" value={alert.token} />
            <button
              type="submit"
              className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              {t("rearm")}
            </button>
          </form>
        ) : null}
        <form action={cancelAlert}>
          <input type="hidden" name="token" value={alert.token} />
          <button
            type="submit"
            className={`${buttonClass} border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950`}
          >
            {t("cancel")}
          </button>
        </form>
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      {children}
    </div>
  );
}

function BackHome({ label }: { label: string }) {
  return (
    <Link
      href="/"
      className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
    >
      {label}
    </Link>
  );
}
