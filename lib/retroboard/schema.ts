import {
  getDocumentData,
  readBoolean,
  readEnum,
  readNumber,
  readString,
  removeUndefinedValues,
  type FirestoreDocumentLike,
} from "@/lib/firestore/schema";
import { CATEGORIES, type Card } from "@/types/card";

export type RoomData = {
  requireName: boolean;
  roomName: string;
};

export type RoomPayloadInput = {
  roomName: string;
  requireName: boolean;
  createdAt: unknown;
  expiresAt: Date;
};

export type RetroCardPayloadInput = {
  category: Card["category"];
  text: string;
  author: string;
  createdAt: Date;
};

export function mapRoom(doc: FirestoreDocumentLike): RoomData {
  const data = getDocumentData(doc);

  return {
    requireName: readBoolean(data, "requireName", true),
    roomName: readString(data, "roomName", "RetroBoard"),
  };
}

export function mapRetroCard(doc: FirestoreDocumentLike): Card {
  const data = getDocumentData(doc);

  return removeUndefinedValues({
    id: doc.id,
    text: readString(data, "text"),
    category: readEnum(data, "category", CATEGORIES, "melhorar"),
    likes: readNumber(data, "likes"),
    dislikes: readNumber(data, "dislikes"),
    author: readString(data, "author") || undefined,
  });
}

export function createRoomPayload(input: RoomPayloadInput) {
  return {
    roomName: input.roomName.trim() || "RetroBoard",
    requireName: input.requireName,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
  };
}

export function createRetroCardPayload(input: RetroCardPayloadInput) {
  return {
    category: input.category,
    text: input.text.trim(),
    likes: 0,
    dislikes: 0,
    author: input.author.trim() || "Anônimo",
    createdAt: input.createdAt,
  };
}
