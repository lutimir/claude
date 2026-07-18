import { getTranslations } from "next-intl/server";
import type { schema } from "@app0/db";

type Shop = typeof schema.shops.$inferSelect;

interface ShopFormProps {
  shop?: Shop;
  action: (formData: FormData) => Promise<void>;
  error?: string;
  saved?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-900";
const labelClass = "flex flex-col gap-1 text-sm font-medium";

export async function ShopForm({ shop, action, error, saved }: ShopFormProps) {
  const t = await getTranslations("admin");

  return (
    <form
      action={action}
      className="flex max-w-2xl flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      {shop ? <input type="hidden" name="id" value={shop.id} /> : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {t("saved")}
        </p>
      ) : null}

      <label className={labelClass}>
        {t("formName")}
        <input name="name" required minLength={2} defaultValue={shop?.name} className={inputClass} />
      </label>

      <label className={labelClass}>
        {t("formWebsite")}
        <input
          name="websiteUrl"
          type="url"
          required
          placeholder="https://"
          defaultValue={shop?.websiteUrl}
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {t("formCountry")}
          <select name="country" defaultValue={shop?.country ?? "sk"} className={inputClass}>
            <option value="sk">SK</option>
            <option value="cz">CZ</option>
          </select>
        </label>

        <label className={labelClass}>
          {t("formContactEmail")}
          <input
            name="contactEmail"
            type="email"
            defaultValue={shop?.contactEmail ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        {t("formLegalBasis")}
        <select name="legalBasis" defaultValue={shop?.legalBasis ?? "feed_consent"} className={inputClass}>
          <option value="feed_consent">{t("legalBasis_feed_consent")}</option>
          <option value="official_api">{t("legalBasis_official_api")}</option>
          <option value="written_permission">{t("legalBasis_written_permission")}</option>
        </select>
      </label>

      {shop ? (
        <label className={labelClass}>
          {t("formStatus")}
          <select name="status" defaultValue={shop.status} className={inputClass}>
            <option value="active">{t("statusActive")}</option>
            <option value="paused">{t("statusPaused")}</option>
          </select>
        </label>
      ) : null}

      <div>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {t("save")}
        </button>
      </div>
    </form>
  );
}
