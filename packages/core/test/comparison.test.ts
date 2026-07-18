import { describe, expect, it } from "vitest";
import { mergeComparisonParams, normalizeParamKey } from "../src/comparison/params";

describe("normalizeParamKey", () => {
  it("zjednotí veľkosť písmen, diakritiku a medzery", () => {
    expect(normalizeParamKey("Pamäť")).toBe("pamat");
    expect(normalizeParamKey("  Výdrž   batérie ")).toBe("vydrz baterie");
  });
});

describe("mergeComparisonParams", () => {
  const aliasMap = new Map([
    ["ulozisko", "Pamäť"],
    ["obrazovka", "Displej"],
  ]);

  it("zlúči aliasy do jedného riadku a zvýrazní rozdiely", () => {
    const rows = mergeComparisonParams(
      [
        { id: 1, params: { "Pamäť": "128 GB", Farba: "čierna", Displej: "6,2\"" } },
        { id: 2, params: { "Úložisko": "512 GB SSD", Farba: "čierna", Obrazovka: "16\"" } },
      ],
      aliasMap,
    );

    const memory = rows.find((row) => row.name === "Pamäť")!;
    expect(memory.values).toEqual(["128 GB", "512 GB SSD"]);
    expect(memory.identical).toBe(false);
    expect(rows.find((row) => row.name === "Úložisko")).toBeUndefined();

    const display = rows.find((row) => row.name === "Displej")!;
    expect(display.values).toEqual(["6,2\"", "16\""]);

    const color = rows.find((row) => row.name === "Farba")!;
    expect(color.identical).toBe(true);
  });

  it("chýbajúce hodnoty sú null a riadky sa radia podľa vyplnenosti", () => {
    const rows = mergeComparisonParams(
      [
        { id: 1, params: { ANC: "áno", Farba: "biela" } },
        { id: 2, params: { Farba: "čierna" } },
      ],
      new Map(),
    );
    expect(rows[0]!.name).toBe("Farba");
    const anc = rows.find((row) => row.name === "ANC")!;
    expect(anc.values).toEqual(["áno", null]);
    expect(anc.identical).toBe(false);
  });

  it("kľúče líšiace sa len diakritikou/veľkosťou splynú", () => {
    const rows = mergeComparisonParams(
      [
        { id: 1, params: { "Pamäť": "8 GB" } },
        { id: 2, params: { pamat: "16 GB" } },
      ],
      new Map(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.values).toEqual(["8 GB", "16 GB"]);
  });
});
