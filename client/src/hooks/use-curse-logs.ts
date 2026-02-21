import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// --- Types derived from API schema ---
type CurseLog = z.infer<typeof api.curseLogs.list.responses[200]>[number];
type Stats = z.infer<typeof api.curseLogs.stats.responses[200]>;
type CreateCurseInput = z.infer<typeof api.curseLogs.create.input>;
type UpdateCurseInput = z.infer<typeof api.curseLogs.update.input>;

export function useCurseLogs() {
  return useQuery({
    queryKey: [api.curseLogs.list.path],
    queryFn: async () => {
      const res = await fetch(api.curseLogs.list.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch curse logs");
      return api.curseLogs.list.responses[200].parse(await res.json());
    },
  });
}

export function useCurseStats() {
  return useQuery({
    queryKey: [api.curseLogs.stats.path],
    queryFn: async () => {
      const res = await fetch(api.curseLogs.stats.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.curseLogs.stats.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCurseLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCurseInput) => {
      const validated = api.curseLogs.create.input.parse(data);
      const res = await fetch(api.curseLogs.create.path, {
        method: api.curseLogs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
           const error = api.curseLogs.create.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to log curse");
      }
      return api.curseLogs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.curseLogs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.curseLogs.stats.path] });
    },
  });
}

export function useUpdateCurseLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateCurseInput) => {
      const validated = api.curseLogs.update.input.parse(data);
      const url = buildUrl(api.curseLogs.update.path, { id });
      
      const res = await fetch(url, {
        method: api.curseLogs.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update curse log");
      return api.curseLogs.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.curseLogs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.curseLogs.stats.path] });
    },
  });
}
