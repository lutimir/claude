import { getTranslations } from "next-intl/server";
import { createPriceAlert } from "@/app/produkt/[slug]/actions";

interface AlertFormProps {
  productId: number;
  slug: string;
  status?: string;
}

export async function AlertForm({ productId, slug, status }: AlertFormProps) {
  const t = await getTranslations("product");
  const inputClass =
    "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="font-semibold">{t("alertTitle")}</h2>
      <p className="mt-1 text-sm text-neutral-500">{t("alertDescription")}</p>
      {status === "skontroluj" ? (
        <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {t("alertCheckEmail")}
        </p>
      ) : null}
      {status === "aktualizovane" ? (
        <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {t("alertUpdated")}
        </p>
      ) : null}
      {status === "limit" ? (
        <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-400">
          {t("alertLimit")}
        </p>
      ) : null}
      {status === "chyba" ? (
        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{t("alertError")}</p>
      ) : null}
      <form action={createPriceAlert} className="mt-3 flex flex-wrap gap-2">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="slug" value={slug} />
        <input
          type="email"
          name="email"
          required
          placeholder={t("alertEmail")}
          className={`${inputClass} min-w-52 flex-1`}
        />
        <input
          type="text"
          inputMode="decimal"
          name="targetPrice"
          required
          placeholder={t("alertTargetPrice")}
          className={`${inputClass} w-36`}
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {t("alertSubmit")}
        </button>
      </form>
    </section>
  );
}
