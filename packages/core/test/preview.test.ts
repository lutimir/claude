import { describe, expect, it } from "vitest";
import { buildFeedPreview } from "../src/feeds/preview";
import type { ParsedFeed } from "../src/feeds/types";

function item(overrides: Partial<ParsedFeed["items"][number]>) {
  return {
    externalId: "X-1",
    name: "Produkt",
    url: "https://obchod.example/p",
    price: 10,
    categoryPath: ["Elektronika", "Mobilné telefóny"],
    params: {},
    ...overrides,
  };
}

describe("buildFeedPreview", () => {
  it("spočíta EAN štatistiky a pripraví ukážku", () => {
    const parsed: ParsedFeed = {
      items: [
        item({ externalId: "A", ean: "8806095302188" }), // platný
        item({ externalId: "B", ean: "8806095302189" }), // zlá kontrolná číslica
        item({ externalId: "C" }), // bez EAN
      ],
      warnings: ["varovanie 1"],
    };

    const preview = buildFeedPreview(parsed);
    expect(preview.totalItems).toBe(3);
    expect(preview.itemsWithValidEan).toBe(1);
    expect(preview.itemsWithInvalidEan).toBe(1);
    expect(preview.itemsWithoutEan).toBe(1);
    expect(preview.warningsCount).toBe(1);
    expect(preview.sample).toHaveLength(3);
    expect(preview.sample[0]).toMatchObject({ externalId: "A", eanValid: true });
    expect(preview.sample[1]).toMatchObject({ externalId: "B", eanValid: false });
    expect(preview.sample[2]?.category).toBe("Mobilné telefóny");
  });

  it("obmedzí ukážku a varovania", () => {
    const parsed: ParsedFeed = {
      items: Array.from({ length: 20 }, (_, i) => item({ externalId: `I-${i}` })),
      warnings: Array.from({ length: 12 }, (_, i) => `w${i}`),
    };
    const preview = buildFeedPreview(parsed);
    expect(preview.sample).toHaveLength(8);
    expect(preview.warnings).toHaveLength(5);
    expect(preview.warningsCount).toBe(12);
  });
});
