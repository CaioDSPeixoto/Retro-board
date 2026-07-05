import { describe, expect, it } from "vitest";
import { getMonthRange, getPreviousMonthKey, normalizeForSearch } from "./utils";

describe("finance utils", () => {
  it("calcula o intervalo de dias do mes", () => {
    expect(getMonthRange("2026-02")).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
  });

  it("calcula o mes anterior considerando troca de ano", () => {
    expect(getPreviousMonthKey("2026-07")).toBe("2026-06");
    expect(getPreviousMonthKey("2026-01")).toBe("2025-12");
  });

  it("normaliza texto para busca", () => {
    expect(normalizeForSearch("  Cartao de Credito  ")).toBe("cartao de credito");
    expect(normalizeForSearch("Água")).toBe("agua");
  });
});
