import { describe, expect, it } from "vitest";
import type { FinanceItem } from "@/types/finance";
import type { FinanceFixedTemplateDocument } from "@/lib/finance/schema";
import { createProjectedFixedItems } from "./fixed-projection";

function template(overrides: Partial<FinanceFixedTemplateDocument>): FinanceFixedTemplateDocument {
  return {
    id: "tpl-1",
    userId: "user-1",
    title: "Aluguel",
    amount: 1200,
    day: 10,
    type: "expense",
    category: "Casa",
    active: true,
    ...overrides,
  };
}

function item(overrides: Partial<FinanceItem>): FinanceItem {
  return {
    id: "item-1",
    userId: "user-1",
    title: "Aluguel",
    amount: 1200,
    date: "2026-08-10",
    type: "expense",
    status: "pending",
    category: "Casa",
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("fixed projection", () => {
  it("cria lancamentos fixos projetados para meses futuros", () => {
    const projected = createProjectedFixedItems(
      [template({ id: "rent" })],
      ["2026-08", "2026-09"],
      [],
      "user-1",
    );

    expect(projected).toMatchObject([
      { id: "projected_fixed_rent_2026-08", date: "2026-08-10", amount: 1200, isFixed: true },
      { id: "projected_fixed_rent_2026-09", date: "2026-09-10", amount: 1200, isFixed: true },
    ]);
  });

  it("usa o ultimo dia do mes quando o dia configurado nao existe", () => {
    const projected = createProjectedFixedItems(
      [template({ id: "rent", day: 31 })],
      ["2026-02"],
      [],
      "user-1",
    );

    expect(projected[0].date).toBe("2026-02-28");
  });

  it("nao duplica fixo que ja existe no mes", () => {
    const projected = createProjectedFixedItems(
      [template({ id: "rent" })],
      ["2026-08", "2026-09"],
      [item({ fixedTemplateId: "rent", date: "2026-08-10" })],
      "user-1",
    );

    expect(projected).toHaveLength(1);
    expect(projected[0].date).toBe("2026-09-10");
  });

  it("ignora templates inativos", () => {
    const projected = createProjectedFixedItems(
      [template({ active: false })],
      ["2026-08"],
      [],
      "user-1",
    );

    expect(projected).toEqual([]);
  });
});
