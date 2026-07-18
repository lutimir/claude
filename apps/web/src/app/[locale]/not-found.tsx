import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tCommon = await getTranslations("common");
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-neutral-500">{t("text")}</p>
      <Link
        href="/"
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        {tCommon("backHome")}
      </Link>
    </div>
  );
}
