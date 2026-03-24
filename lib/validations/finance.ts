import { z } from "zod";

export const addFinanceItemSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive().max(999_999_999),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1).max(100),
  status: z.enum(["paid", "pending", "partial", "moved"]).optional(),
  isFixed: z.boolean().optional(),
  boardId: z.string().optional(),
  installments: z.number().int().min(1).max(60).optional(),
  cardName: z.string().max(100).optional(),
  cardMode: z.enum(["credit", "debit"]).optional(),
  interestType: z.enum(["percentage", "fixed", "both"]).optional(),
  interestRate: z.number().min(0).max(100).optional(),
  interestFixed: z.number().min(0).optional(),
  investmentCategory: z.enum(["emergency", "fixed-income", "variable-income"]).optional(),
});

export const updateFinanceItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  amount: z.number().positive().max(999_999_999),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1).max(100),
  paidAmount: z.number().min(0).optional(),
  cardName: z.string().max(100).optional(),
  cardMode: z.enum(["credit", "debit"]).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  boardId: z.string().optional(),
});

export const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
});

export const adminUpdateUserSchema = z.object({
  userId: z.string().min(1),
  plan: z.enum(["free", "pro", "team"]).optional(),
  role: z.enum(["user", "admin"]).optional(),
  subscriptionExpiresAt: z.string().optional(),
});
