import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  subscription: jsonb("subscription").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export const curseLogs = pgTable("curse_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  word: text("word").notNull(),
  punishment: text("punishment").notNull(),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCurseLogSchema = createInsertSchema(curseLogs).omit({
  id: true,
  createdAt: true,
  punishment: true,
  isCompleted: true,
  userId: true
});

export type CurseLog = typeof curseLogs.$inferSelect;
export type InsertCurseLog = z.infer<typeof insertCurseLogSchema>;

export type CreateCurseLogRequest = InsertCurseLog;
export type UpdateCurseLogRequest = Partial<InsertCurseLog> & { isCompleted?: boolean };

export interface CurseStats {
  totalCurses: number;
  uncompletedPunishments: number;
  topWords: { word: string; count: number }[];
}
