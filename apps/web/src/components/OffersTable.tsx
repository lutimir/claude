import { getTranslations } from "next-intl/server";
import { formatPrice } from "@/lib/format";

interface OfferRow {
  id: number;
  price: string;
  currency: "EUR" | "CZK";
  url: string;
  availability: string | null;
  shop: { name: string };
}

export async function OffersTable({ offers }: { offers: OfferRow[] }) {
  const t = await getTranslations("product");
  const tCommon = await getTranslations("common");

  function availabilityLabel(raw: string | null): string {
    if (raw === null || raw === "") return "—";
    if (raw === "0") return t("availabilityInStock");
    const days = Number(raw);
    return Number.isInteger(days) && days > 0 ? t("availabilityDays", { days }) : raw;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-100 text-left dark:border-neutral-800 dark:bg-neutral-900">
            <th className="px-4 py-2 font-medium">{t("shop")}</th>
            <th className="px-4 py-2 font-medium">{t("availability")}</th>
            <th className="px-4 py-2 text-right font-medium">{t("price")}</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {offers.map((offer, index) => (
            <tr
              key={offer.id}
              className="border-b border-neutral-200 last:border-0 dark:border-neutral-800"
            >
              <td className="px-4 py-3">{offer.shop.name}</td>
              <td className="px-4 py-3 text-neutral-500">{availabilityLabel(offer.availability)}</td>
              <td
                className={`px-4 py-3 text-right font-semibold ${
                  index === 0 ? "text-emerald-700 dark:text-emerald-400" : ""
                }`}
              >
                {formatPrice(offer.price, offer.currency)}
              </td>
              <td className="px-4 py-3 text-right">
                <a
                  href={offer.url}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="inline-block rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                >
                  {tCommon("toShop")}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
