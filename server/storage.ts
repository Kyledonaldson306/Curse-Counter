import { db } from "./db";
import {
  curseLogs,
  type CreateCurseLogRequest,
  type UpdateCurseLogRequest,
  type CurseLog,
  type CurseStats
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  getCurseLogs(userId: string): Promise<CurseLog[]>;
  getCurseStats(userId: string): Promise<CurseStats>;
  createCurseLog(userId: string, word: string, punishment: string): Promise<CurseLog>;
  updateCurseLog(id: number, userId: string, updates: UpdateCurseLogRequest): Promise<CurseLog | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getCurseLogs(userId: string): Promise<CurseLog[]> {
    return await db.select().from(curseLogs).where(eq(curseLogs.userId, userId)).orderBy(desc(curseLogs.createdAt));
  }

  async getCurseStats(userId: string): Promise<CurseStats> {
    const allLogs = await this.getCurseLogs(userId);
    const uncompletedPunishments = allLogs.filter(log => !log.isCompleted).length;
    
    // Calculate top words
    const wordCounts = allLogs.reduce((acc, log) => {
      acc[log.word] = (acc[log.word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topWords = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCurses: allLogs.length,
      uncompletedPunishments,
      topWords
    };
  }

  async createCurseLog(userId: string, word: string, punishment: string): Promise<CurseLog> {
    const [log] = await db.insert(curseLogs).values({
      userId,
      word,
      punishment
    }).returning();
    return log;
  }

  async updateCurseLog(id: number, userId: string, updates: UpdateCurseLogRequest): Promise<CurseLog | undefined> {
    const [updated] = await db.update(curseLogs)
      .set(updates)
      .where(and(eq(curseLogs.id, id), eq(curseLogs.userId, userId)))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
