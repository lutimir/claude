import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { appName } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("termsTitle") };
}

/**
 * Kostra právneho textu — pred spustením do produkcie ju MUSÍ skontrolovať
 * a doplniť právnik (fáza 9 roadmapy).
 */
export default async function TermsPage() {
  const t = await getTranslations("legal");
  const name = appName();
  return (
    <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
      <h1 className="text-2xl font-bold">{t("termsTitle")}</h1>
      <div className="mt-6 space-y-4 text-neutral-700 dark:text-neutral-300">
        <p>
          {name} je porovnávač cien. Informácie o produktoch a cenách preberáme výhradne
          z oficiálnych produktových feedov a API, ktoré nám obchody poskytli alebo ku ktorým
          nám dali súhlas. Ceny majú informatívny charakter — pred nákupom si vždy over
          konečnú cenu priamo v obchode.
        </p>
        <p>
          {name} nie je predajcom ponúkaných produktov a nezodpovedá za obsah, dostupnosť ani
          ceny v internetových obchodoch, na ktoré odkazuje. Kúpna zmluva vzniká výlučne medzi
          zákazníkom a príslušným obchodom.
        </p>
        <p>
          Používanie služby je bezplatné. Automatizované sťahovanie obsahu tejto stránky bez
          nášho súhlasu nie je dovolené.
        </p>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          ⚠️ Toto je pracovná kostra podmienok. Pred spustením do produkcie ju musí
          skontrolovať a doplniť právnik.
        </p>
      </div>
    </article>
  );
}
