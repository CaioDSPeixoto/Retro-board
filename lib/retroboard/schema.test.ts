import { describe, expect, it } from "vitest";
import { createRetroCardPayload, createRoomPayload, mapRetroCard, mapRoom } from "./schema";
import type { FirestoreDocumentLike } from "@/lib/firestore/schema";

function doc(id: string, data: Record<string, unknown>): FirestoreDocumentLike {
  return { id, data: () => data };
}

describe("retroboard firestore schema", () => {
  it("normaliza sala e cards com valores seguros", () => {
    expect(mapRoom(doc("room-1", { roomName: "Sprint", requireName: false }))).toEqual({
      roomName: "Sprint",
      requireName: false,
    });

    expect(mapRetroCard(doc("card-1", { text: "Melhorar deploy", category: "x", likes: "2" }))).toEqual({
      id: "card-1",
      text: "Melhorar deploy",
      category: "melhorar",
      likes: 2,
      dislikes: 0,
    });
  });

  it("cria payloads de escrita sem espacos sobrando", () => {
    const createdAt = new Date("2026-07-01T00:00:00.000Z");

    expect(
      createRoomPayload({
        roomName: "  Retro semanal  ",
        requireName: true,
        createdAt,
        expiresAt: createdAt,
      }),
    ).toMatchObject({
      roomName: "Retro semanal",
      requireName: true,
    });

    expect(
      createRetroCardPayload({
        category: "bom",
        text: "  Funcionou  ",
        author: "  Caio  ",
        createdAt,
      }),
    ).toMatchObject({
      category: "bom",
      text: "Funcionou",
      author: "Caio",
      likes: 0,
      dislikes: 0,
    });
  });
});
