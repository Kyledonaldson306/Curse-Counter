import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./auth";
import { setupPushRoutes, sendPushToUser } from "./push";
import { isCurseWord } from "@shared/curse-detection";

const PUNISHMENTS = [
  "Do 10 pushups",
  "Donate $1 to charity",
  "No social media for 1 hour",
  "Write an apology letter",
  "Drink a glass of water",
  "Take a 5 minute walk",
  "Give someone a compliment",
  "Clean your desk",
  "Do 20 jumping jacks"
];

function getRandomPunishment() {
  return PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  setupPushRoutes(app);

  app.get(api.curseLogs.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.userId;
    const logs = await storage.getCurseLogs(userId);
    res.json(logs);
  });

  app.get(api.curseLogs.stats.path, isAuthenticated, async (req: any, res) => {
    const userId = req.userId;
    const stats = await storage.getCurseStats(userId);
    res.json(stats);
  });

  app.post(api.curseLogs.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.curseLogs.create.input.parse(req.body);

      if (!isCurseWord(input.word)) {
        return res.status(400).json({
          message: "Please only enter curse words",
          field: "word",
        });
      }

      const userId = req.userId;
      const punishment = getRandomPunishment();
      const log = await storage.createCurseLog(userId, input.word, punishment);

      sendPushToUser(userId, input.word).catch(() => {});

      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.curseLogs.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid log ID" });
      }
      const input = api.curseLogs.update.input.parse(req.body);
      const userId = req.userId;
      const updated = await storage.updateCurseLog(id, userId, input);
      if (!updated) {
        return res.status(404).json({ message: "Curse log not found" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  return httpServer;
}
