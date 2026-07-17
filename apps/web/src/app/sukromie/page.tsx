import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { appName } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("privacyTitle") };
}

/**
 * Kostra GDPR textu — pred spustením do produkcie ju MUSÍ skontrolovať
 * a doplniť právnik (fáza 9 roadmapy).
 */
export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const name = appName();
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">{t("privacyTitle")}</h1>
      <div className="mt-6 space-y-4 text-neutral-700 dark:text-neutral-300">
        <p>
          {name} spracúva osobné údaje v minimálnom rozsahu. Pri nastavení cenového alarmu
          ukladáme tvoju e-mailovú adresu, sledovaný produkt a cieľovú cenu — výhradne na to,
          aby sme ti poslali upozornenie na pokles ceny. Každý alarm sa dá kedykoľvek zrušiť
          odkazom v e-maile.
        </p>
        <p>
          Nepredávame ani neposkytujeme osobné údaje tretím stranám. Prevádzkové logy sa
          uchovávajú len po dobu potrebnú na zabezpečenie a ladenie služby.
        </p>
        <p>
          Máš právo na prístup k svojim údajom, ich opravu a vymazanie. Kontaktuj nás na
          e-maile uvedenom v podmienkach používania.
        </p>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          ⚠️ Toto je pracovná kostra zásad ochrany súkromia. Pred spustením do produkcie ju
          musí skontrolovať a doplniť právnik (vrátane cookies a právnych základov podľa GDPR).
        </p>
      </div>
    </article>
  );
}
