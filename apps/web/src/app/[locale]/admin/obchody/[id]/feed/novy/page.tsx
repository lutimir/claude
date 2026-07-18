import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FeedForm } from "@/components/admin/FeedForm";
import { getDb } from "@/lib/db";
import { getShopWithFeeds } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface NewFeedPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewFeedPage({ params }: NewFeedPageProps) {
  const t = await getTranslations("admin");
  const { id } = await params;

  const shopId = Number(id);
  if (!Number.isInteger(shopId)) notFound();
  const shop = await getShopWithFeeds(getDb(), shopId);
  if (!shop) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/admin/obchody/${shop.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          ← {shop.name}
        </Link>
        <h2 className="mt-1 text-lg font-semibold">{t("addFeed")}</h2>
      </div>
      <FeedForm shopId={shop.id} />
    </div>
  );
}
