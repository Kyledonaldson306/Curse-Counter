import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { useCurseLogs, useUpdateCurseLog } from "@/hooks/use-curse-logs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export function PunishmentList() {
  const { data: logs, isLoading } = useCurseLogs();
  const { mutate: updateLog } = useUpdateCurseLog();

  // Filter for uncompleted punishments first
  const sortedLogs = logs?.sort((a, b) => {
    if (a.isCompleted === b.isCompleted) {
      return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    }
    return a.isCompleted ? 1 : -1;
  });

  const handleComplete = (id: number) => {
    updateLog({ id, isCompleted: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl bg-secondary/50" />
        <Skeleton className="h-24 w-full rounded-2xl bg-secondary/50" />
        <Skeleton className="h-24 w-full rounded-2xl bg-secondary/50" />
      </div>
    );
  }

  if (!sortedLogs?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-secondary/20 rounded-3xl border border-dashed border-white/10">
        <div className="p-4 rounded-full bg-secondary/50 mb-4">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Clean Slate</h3>
        <p className="text-muted-foreground mt-2 max-w-xs">
          No active punishments. Keep up the good language!
        </p>
      </div>
    );
  }

  return (
    <div className="h-[500px] flex flex-col">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {sortedLogs.map((log) => (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                  log.isCompleted 
                    ? "bg-secondary/20 border-white/5 opacity-60 hover:opacity-100" 
                    : "bg-gradient-to-r from-secondary to-secondary/80 border-primary/20 shadow-lg hover:border-primary/40 hover:shadow-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider",
                        log.isCompleted 
                          ? "bg-green-500/10 text-green-500" 
                          : "bg-primary/10 text-primary"
                      )}>
                        {log.isCompleted ? "Redeemed" : "Active Penalty"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(log.createdAt!), "MMM d, h:mm a")}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-bold font-display text-foreground">
                      {log.punishment}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      For saying: <span className="font-mono text-foreground bg-white/5 px-1.5 py-0.5 rounded">{log.word}</span>
                    </p>
                  </div>

                  <div className="flex items-center self-center pl-4">
                    {!log.isCompleted ? (
                      <Button
                        onClick={() => handleComplete(log.id)}
                        variant="outline"
                        className="h-12 w-12 rounded-full border-2 border-primary/20 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all p-0"
                        title="Mark as completed"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </Button>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
