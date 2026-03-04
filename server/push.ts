import webpush from "web-push";
import type { Express } from "express";
import { db } from "./db";
import { pushSubscriptions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "./auth";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@cursecontrol.app";

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

export async function sendPushToUser(userId: string, word: string) {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  const payload = JSON.stringify({
    title: "Hey! You CURSED!",
    body: `You said "${word}". A punishment has been assigned.`,
  });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription as any, payload);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        }
      }
    })
  );
}

export function setupPushRoutes(app: Express) {
  app.get("/api/push/vapid-public-key", (_req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const subscription = req.body;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ message: "Invalid subscription" });
      }

      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));

      const existingEndpoints = existing.map(
        (s: any) => (s.subscription as any).endpoint
      );
      if (existingEndpoints.includes(subscription.endpoint)) {
        return res.json({ message: "Already subscribed" });
      }

      await db.insert(pushSubscriptions).values({
        userId,
        subscription,
      });

      return res.status(201).json({ message: "Subscribed" });
    } catch (error) {
      console.error("Push subscribe error:", error);
      return res.status(500).json({ message: "Subscription failed" });
    }
  });

  app.post("/api/push/notify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { word } = req.body;

      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));

      const payload = JSON.stringify({
        title: "Hey! You CURSED!",
        body: `You said "${word || "a bad word"}". A punishment has been assigned.`,
      });

      const results = await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(sub.subscription as any, payload);
          } catch (error: any) {
            if (error.statusCode === 410 || error.statusCode === 404) {
              await db
                .delete(pushSubscriptions)
                .where(eq(pushSubscriptions.id, sub.id));
            }
            throw error;
          }
        })
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;
      return res.json({ sent, total: subs.length });
    } catch (error) {
      console.error("Push notify error:", error);
      return res.status(500).json({ message: "Notification failed" });
    }
  });
}
