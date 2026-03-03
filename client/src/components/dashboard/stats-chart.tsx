import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useCurseStats } from "@/hooks/use-curse-logs";
import { Loader2 } from "lucide-react";

export function StatsChart() {
  const { data: stats, isLoading } = useCurseStats();

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!stats?.topWords.length) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-white/10">
        <p>No data available yet</p>
      </div>
    );
  }

  // Take top 5 words
  const data = stats.topWords.slice(0, 5);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis 
            dataKey="word" 
            type="category" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'var(--font-mono)' }}
            width={80}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.4 }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))'
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32} label={{ position: 'right', fill: 'hsl(var(--foreground))', fontSize: 12 }}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === 0 ? 'hsl(var(--primary))' : index === 1 ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'} 
                fillOpacity={index === 0 ? 1 : 0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
