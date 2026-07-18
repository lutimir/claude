import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FeedForm } from "@/components/admin/FeedForm";
import { getDb } from "@/lib/db";
import { getShopWithFeeds } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface EditFeedPageProps {
  params: Promise<{ id: string; feedId: string }>;
}

export default async function EditFeedPage({ params }: EditFeedPageProps) {
  const t = await getTranslations("admin");
  const { id, feedId } = await params;

  const shopId = Number(id);
  const feedIdNumber = Number(feedId);
  if (!Number.isInteger(shopId) || !Number.isInteger(feedIdNumber)) notFound();

  const shop = await getShopWithFeeds(getDb(), shopId);
  if (!shop) notFound();
  const feed = shop.feeds.find((item) => item.id === feedIdNumber);
  if (!feed) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/admin/obchody/${shop.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          ← {shop.name}
        </Link>
        <h2 className="mt-1 text-lg font-semibold">{t("editFeed")}</h2>
      </div>
      <FeedForm shopId={shop.id} feed={feed} />
    </div>
  );
}
