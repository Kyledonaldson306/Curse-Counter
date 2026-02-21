import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

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
  // Setup auth
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get(api.curseLogs.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const logs = await storage.getCurseLogs(userId);
    res.json(logs);
  });

  app.get(api.curseLogs.stats.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const stats = await storage.getCurseStats(userId);
    res.json(stats);
  });

  app.post(api.curseLogs.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.curseLogs.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const punishment = getRandomPunishment();
      const log = await storage.createCurseLog(userId, input.word, punishment);
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
      const input = api.curseLogs.update.input.parse(req.body);
      const updated = await storage.updateCurseLog(id, input);
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
