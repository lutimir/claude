import { describe, expect, it } from "vitest";
import { normalizeWhitespace, slugify, stripDiacritics } from "../src/text/normalize";

describe("stripDiacritics", () => {
  it("odstráni slovenskú a českú diakritiku", () => {
    expect(stripDiacritics("Slúchadlá čierne")).toBe("Sluchadla cierne");
    expect(stripDiacritics("Příliš žluťoučký kůň")).toBe("Prilis zlutoucky kun");
  });
});

describe("slugify", () => {
  it("vytvorí čistý URL slug", () => {
    expect(slugify("Mobilné telefóny")).toBe("mobilne-telefony");
    expect(slugify("Samsung Galaxy S24 (128 GB) — čierny")).toBe(
      "samsung-galaxy-s24-128-gb-cierny",
    );
  });

  it("oreže pomlčky na krajoch", () => {
    expect(slugify("  -- Notebooky -- ")).toBe("notebooky");
  });
});

describe("normalizeWhitespace", () => {
  it("zjednotí viacnásobné medzery", () => {
    expect(normalizeWhitespace("  Sony   WH-1000XM5 \n slúchadlá ")).toBe(
      "Sony WH-1000XM5 slúchadlá",
    );
  });
});
