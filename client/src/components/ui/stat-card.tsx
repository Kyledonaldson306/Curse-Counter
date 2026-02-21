import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "default" | "primary" | "danger" | "success";
  className?: string;
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  color = "default",
  className 
}: StatCardProps) {
  const colorStyles = {
    default: "bg-secondary/50 text-foreground border-white/5",
    primary: "bg-primary/10 text-primary border-primary/20",
    danger: "bg-destructive/10 text-destructive-foreground border-destructive/20",
    success: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border backdrop-blur-sm",
        colorStyles[color],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight font-display">{value}</h3>
          {trend && (
            <p className="mt-1 text-xs opacity-60 font-mono">
              {trend}
            </p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl bg-background/20", 
          color === 'primary' && "bg-primary/20",
          color === 'danger' && "bg-destructive/20"
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
        <Icon className="w-32 h-32" />
      </div>
    </motion.div>
  );
}
