import { describe, expect, it } from "vitest";
import { parseCategoryPath, parseFeedPrice, parseHeurekaFeed } from "../src/feeds/heureka";

const FEED = `<?xml version="1.0" encoding="utf-8"?>
<SHOP>
  <SHOPITEM>
    <ITEM_ID>SKU-1</ITEM_ID>
    <PRODUCTNAME><![CDATA[Samsung Galaxy S24 128 GB čierny]]></PRODUCTNAME>
    <DESCRIPTION>Vlajková loď Samsungu.</DESCRIPTION>
    <URL>https://obchod.example/galaxy-s24</URL>
    <IMGURL>https://obchod.example/img/s24.jpg</IMGURL>
    <PRICE_VAT>1 299,90</PRICE_VAT>
    <MANUFACTURER>Samsung</MANUFACTURER>
    <CATEGORYTEXT>Elektronika | Mobilné telefóny</CATEGORYTEXT>
    <EAN>8806095302188</EAN>
    <DELIVERY_DATE>0</DELIVERY_DATE>
    <PARAM>
      <PARAM_NAME>Farba</PARAM_NAME>
      <VAL>čierna</VAL>
    </PARAM>
    <PARAM>
      <PARAM_NAME>Pamäť</PARAM_NAME>
      <VAL>128 GB</VAL>
    </PARAM>
  </SHOPITEM>
  <SHOPITEM>
    <ITEM_ID>SKU-2</ITEM_ID>
    <PRODUCTNAME>Sony WH-1000XM5</PRODUCTNAME>
    <URL>https://obchod.example/sony-xm5</URL>
    <PRICE_VAT>349.00</PRICE_VAT>
  </SHOPITEM>
  <SHOPITEM>
    <ITEM_ID>SKU-3</ITEM_ID>
    <PRODUCTNAME>Pokazená položka bez ceny</PRODUCTNAME>
    <URL>https://obchod.example/pokazena</URL>
  </SHOPITEM>
</SHOP>`;

describe("parseHeurekaFeed", () => {
  it("naparsuje platné položky vrátane CDATA, čiarkovej ceny a parametrov", () => {
    const { items, warnings } = parseHeurekaFeed(FEED);

    expect(items).toHaveLength(2);
    expect(warnings).toHaveLength(1);

    const first = items[0]!;
    expect(first.externalId).toBe("SKU-1");
    expect(first.name).toBe("Samsung Galaxy S24 128 GB čierny");
    expect(first.price).toBe(1299.9);
    expect(first.ean).toBe("8806095302188");
    expect(first.categoryPath).toEqual(["Elektronika", "Mobilné telefóny"]);
    expect(first.params).toEqual({ Farba: "čierna", "Pamäť": "128 GB" });

    const second = items[1]!;
    expect(second.price).toBe(349);
    expect(second.categoryPath).toEqual([]);
    expect(second.ean).toBeUndefined();
  });

  it("položku bez povinných polí preskočí s varovaním", () => {
    const { warnings } = parseHeurekaFeed(FEED);
    expect(warnings[0]).toContain("SKU-3");
  });

  it("odmietne XML bez koreňového SHOP elementu", () => {
    expect(() => parseHeurekaFeed("<HTML></HTML>")).toThrow(/SHOP/);
  });
});

describe("parseFeedPrice", () => {
  it("zvládne medzery, čiarky a menu", () => {
    expect(parseFeedPrice("1 299,90")).toBe(1299.9);
    expect(parseFeedPrice("349.00")).toBe(349);
    expect(parseFeedPrice("799,90 EUR")).toBe(799.9);
  });

  it("nevalidné hodnoty vráti ako null", () => {
    expect(parseFeedPrice(undefined)).toBeNull();
    expect(parseFeedPrice("zadarmo")).toBeNull();
    expect(parseFeedPrice("-5")).toBeNull();
    expect(parseFeedPrice("0")).toBeNull();
  });
});

describe("parseCategoryPath", () => {
  it("podporuje oddeľovače | aj >", () => {
    expect(parseCategoryPath("Elektronika | Mobilné telefóny")).toEqual([
      "Elektronika",
      "Mobilné telefóny",
    ]);
    expect(parseCategoryPath("Elektronika > Notebooky")).toEqual(["Elektronika", "Notebooky"]);
    expect(parseCategoryPath(undefined)).toEqual([]);
  });
});
