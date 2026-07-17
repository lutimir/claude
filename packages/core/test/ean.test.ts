import { describe, expect, it } from "vitest";
import { eanCheckDigit, isValidEan, normalizeEan } from "../src/matching/ean";

describe("eanCheckDigit", () => {
  it("vypočíta správnu kontrolnú číslicu", () => {
    // 8806095302188 je reálny EAN-13 (Samsung) — telo 880609530218 → 8
    expect(eanCheckDigit("880609530218")).toBe(8);
    // 4548736141315 (Sony) — telo 454873614131 → 5
    expect(eanCheckDigit("454873614131")).toBe(5);
  });
});

describe("isValidEan", () => {
  it("prijme platné EAN-13 a EAN-8", () => {
    expect(isValidEan("8806095302188")).toBe(true);
    expect(isValidEan("4548736141315")).toBe(true);
    expect(isValidEan("96385074")).toBe(true); // ukážkový EAN-8
  });

  it("odmietne zlú kontrolnú číslicu, dĺžku a nečíselné znaky", () => {
    expect(isValidEan("8806095302189")).toBe(false);
    expect(isValidEan("12345")).toBe(false);
    expect(isValidEan("abcdefghijklm")).toBe(false);
    expect(isValidEan("")).toBe(false);
  });
});

describe("normalizeEan", () => {
  it("očistí medzery a pomlčky", () => {
    expect(normalizeEan("880 6095 302188")).toBe("8806095302188");
    expect(normalizeEan("8806095-302188")).toBe("8806095302188");
  });

  it("nevalidný vstup vráti ako null", () => {
    expect(normalizeEan(null)).toBeNull();
    expect(normalizeEan(undefined)).toBeNull();
    expect(normalizeEan("nie-je-ean")).toBeNull();
    expect(normalizeEan("8806095302189")).toBeNull();
  });
});
