import { describe, expect, it } from "vitest";
import {
  createMovedFinanceItemPayload,
  mapFinanceBoard,
  mapFinanceCard,
  mapFinanceFixedTemplate,
  mapFinanceItem,
} from "./schema";
import type { FirestoreDocumentLike } from "@/lib/firestore/schema";
import type { FinanceItem } from "@/types/finance";

function doc(id: string, data: Record<string, unknown>): FirestoreDocumentLike {
  return { id, data: () => data };
}

describe("finance firestore schema", () => {
  it("normaliza lancamentos legados e enums invalidos", () => {
    const item = mapFinanceItem(
      doc("item-1", {
        userId: "user-1",
        title: "Conta",
        amount: "120.50",
        date: "2026-07-10",
        type: "unknown",
        status: "invalid",
        createdAt: { toDate: () => new Date("2026-07-01T10:00:00.000Z") },
      }),
    );

    expect(item).toMatchObject({
      id: "item-1",
      userId: "user-1",
      title: "Conta",
      amount: 120.5,
      type: "expense",
      status: "pending",
      category: "Outros",
      createdAt: "2026-07-01T10:00:00.000Z",
    });
  });

  it("mapeia board, cartao e template fixo com defaults seguros", () => {
    expect(mapFinanceBoard(doc("board-1", { name: "Casa", memberIds: [1, "u1"] }))).toMatchObject({
      id: "board-1",
      name: "Casa",
      ownerId: "",
      memberIds: ["u1"],
      isPersonal: false,
    });

    expect(mapFinanceCard(doc("card-1", { name: "Nubank", mode: "other", limit: "900" }))).toMatchObject({
      id: "card-1",
      name: "Nubank",
      mode: "credit",
      limit: 900,
    });

    expect(mapFinanceFixedTemplate(doc("tpl-1", { title: "Aluguel", day: "5", type: "income" }))).toMatchObject({
      id: "tpl-1",
      title: "Aluguel",
      day: 5,
      type: "income",
      category: "Fixos",
      active: false,
    });
  });

  it("cria payload de lancamento movido sem reaproveitar campos instaveis", () => {
    const existing: FinanceItem = {
      id: "item-1",
      userId: "user-1",
      boardId: "board-1",
      title: "Parcela",
      amount: 80,
      date: "2026-07-20",
      type: "expense",
      status: "pending",
      category: "Cartao",
      createdAt: "2026-07-01T00:00:00.000Z",
      fixedTemplateId: "tpl-1",
      installmentGroupId: "group-1",
      installmentIndex: 1,
      installmentTotal: 3,
      cardName: "Nubank",
    };

    const payload = createMovedFinanceItemPayload(
      existing,
      "2026-08-20",
      "2026-07-30T12:00:00.000Z",
    );

    expect(payload).toMatchObject({
      userId: "user-1",
      boardId: "board-1",
      title: "Parcela",
      amount: 80,
      date: "2026-08-20",
      status: "pending",
      carriedFromMonth: "2026-07",
      carriedFromItemId: "item-1",
      installmentGroupId: "group-1",
      cardName: "Nubank",
    });
    expect(payload).not.toHaveProperty("fixedTemplateId");
  });
});
