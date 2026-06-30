import { describe, expect, it } from "vitest";
import { getCardStatementCycle, isDateInCycle } from "./card-cycle";

describe("card statement cycle", () => {
  it("monta o ciclo de fatura entre o fechamento anterior e o fechamento atual", () => {
    expect(getCardStatementCycle("2026-06", 20, 27)).toEqual({
      start: "2026-05-21",
      end: "2026-06-20",
    });
  });

  it("ajusta dias inexistentes em meses curtos", () => {
    expect(getCardStatementCycle("2026-03", 31, 10)).toEqual({
      start: "2026-03-01",
      end: "2026-03-31",
    });
  });

  it("identifica datas dentro e fora do ciclo", () => {
    const cycle = { start: "2026-05-21", end: "2026-06-20" };

    expect(isDateInCycle("2026-05-21", cycle)).toBe(true);
    expect(isDateInCycle("2026-06-20", cycle)).toBe(true);
    expect(isDateInCycle("2026-06-21", cycle)).toBe(false);
  });
});
