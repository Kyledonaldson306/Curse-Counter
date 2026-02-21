import { z } from 'zod';
import { insertCurseLogSchema, curseLogs } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  curseLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/curse-logs' as const,
      responses: {
        200: z.array(z.custom<typeof curseLogs.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/curse-logs/stats' as const,
      responses: {
        200: z.object({
          totalCurses: z.number(),
          uncompletedPunishments: z.number(),
          topWords: z.array(z.object({ word: z.string(), count: z.number() })),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/curse-logs' as const,
      input: z.object({ word: z.string() }),
      responses: {
        201: z.custom<typeof curseLogs.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/curse-logs/:id' as const,
      input: z.object({ isCompleted: z.boolean() }),
      responses: {
        200: z.custom<typeof curseLogs.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
