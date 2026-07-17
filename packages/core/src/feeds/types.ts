/**
 * Jedna položka (ponuka) z produktového feedu obchodu,
 * už znormalizovaná do interného tvaru nezávislého od formátu feedu.
 */
export interface FeedItem {
  /** ID položky v rámci feedu obchodu (ITEM_ID) */
  externalId: string;
  /** Názov produktu tak, ako ho uvádza obchod */
  name: string;
  description?: string;
  /** Deep-link do obchodu */
  url: string;
  imageUrl?: string;
  /** Cena s DPH v hlavných jednotkách meny (napr. 799.90) */
  price: number;
  manufacturer?: string;
  /** Cesta kategórie od koreňa, napr. ["Elektronika", "Mobilné telefóny"] */
  categoryPath: string[];
  /** EAN/GTIN presne ako vo feede (validácia sa robí až pri párovaní) */
  ean?: string;
  /** Doplnkové parametre produktu (PARAM_NAME → VAL) */
  params: Record<string, string>;
  /** Dostupnosť — surová hodnota DELIVERY_DATE z feedu */
  availability?: string;
}

export interface ParsedFeed {
  items: FeedItem[];
  /** Popisy položiek, ktoré boli preskočené a prečo */
  warnings: string[];
}

export type FeedFormat = "heureka_xml";
