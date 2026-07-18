import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ShopForm } from "@/components/admin/ShopForm";
import { createShop } from "../actions";

export const dynamic = "force-dynamic";

interface NewShopPageProps {
  searchParams: Promise<{ chyba?: string }>;
}

export default async function NewShopPage({ searchParams }: NewShopPageProps) {
  const t = await getTranslations("admin");
  const { chyba } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin/obchody" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          {t("backToShops")}
        </Link>
        <h2 className="mt-1 text-lg font-semibold">{t("addShop")}</h2>
      </div>
      <ShopForm action={createShop} error={chyba} />
    </div>
  );
}
