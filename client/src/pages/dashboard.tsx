import { useAuth } from "@/hooks/use-auth";
import { useCurseStats } from "@/hooks/use-curse-logs";
import { LogCurseForm } from "@/components/dashboard/log-curse-form";
import { PunishmentList } from "@/components/dashboard/punishment-list";
import { StatsChart } from "@/components/dashboard/stats-chart";
import { StatCard } from "@/components/ui/stat-card";
import { Flame, Gavel, Skull, LogOut, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveListening } from "@/hooks/use-active-listening";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: stats } = useCurseStats();
  const { isListening, startListening, stopListening } = useActiveListening();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">CurseControl</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant={isListening ? "destructive" : "secondary"} 
              size="sm" 
              onClick={isListening ? stopListening : startListening}
              className="gap-2"
            >
              {isListening ? (
                <>
                  <Mic className="w-4 h-4 animate-pulse" />
                  Listening...
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4" />
                  Start Listening
                </>
              )}
            </Button>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">{user?.firstName || 'User'}</span>
              <span className="text-xs text-muted-foreground">Level 1 Penitent</span>
            </div>
            {user?.profileImageUrl && (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-9 h-9 rounded-full ring-2 ring-white/10"
              />
            )}
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Form Section */}
        <section className="max-w-4xl mx-auto">
          <LogCurseForm />
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Curses"
            value={stats?.totalCurses || 0}
            icon={Skull}
            color="default"
            trend="+12% this week"
          />
          <StatCard
            label="Pending Punishments"
            value={stats?.uncompletedPunishments || 0}
            icon={Gavel}
            color={stats?.uncompletedPunishments ? "primary" : "success"}
            className="border-primary/20"
          />
          <StatCard
            label="Most Used Word"
            value={stats?.topWords?.[0]?.word || "None"}
            icon={Flame}
            color="danger"
            trend={stats?.topWords?.[0] ? `${stats.topWords[0].count} times` : undefined}
          />
        </section>

        {/* Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Punishments List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold font-display">Punishment Ledger</h3>
              <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                {stats?.uncompletedPunishments || 0} active
              </span>
            </div>
            <PunishmentList />
          </div>

          {/* Detailed Analytics */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold font-display">Curse Frequency</h3>
            <div className="p-6 rounded-3xl bg-secondary/30 border border-white/5 h-[500px] flex flex-col justify-center">
              <StatsChart />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
