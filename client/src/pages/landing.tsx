import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Flame, Shield, TrendingDown, ArrowRight, Skull } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground overflow-hidden">
      <div className="lg:w-1/2 relative flex flex-col justify-center p-8 lg:p-20 border-b lg:border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8 w-fit">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Break the habit</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold font-display leading-[0.95] tracking-tighter mb-6">
            Watch your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">language.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            CurseControl gamifies your discipline. Log your slip-ups, receive randomly generated punishments, and track your journey to cleaner speech.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-white/5">
              <div className="p-2 rounded-lg bg-background text-primary">
                <Skull className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Log Incidents</h3>
                <p className="text-sm text-muted-foreground">Track every bad word instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-white/5">
              <div className="p-2 rounded-lg bg-background text-green-500">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Track Trends</h3>
                <p className="text-sm text-muted-foreground">Visualize your progress over time.</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-8 lg:left-20 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} CurseControl Inc. All rights reserved.
        </div>
      </div>

      <div className="lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-20 bg-secondary/20 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-primary to-rose-500 rounded-3xl mx-auto mb-6 shadow-2xl shadow-primary/30 flex items-center justify-center rotate-3">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold font-display mb-3">Ready to start?</h2>
            <p className="text-muted-foreground">Create an account or sign in to access your dashboard and active penalties.</p>
          </div>

          <div className="space-y-4">
            <Button 
              data-testid="button-get-started"
              onClick={() => setLocation("/auth")}
              className="w-full h-16 text-lg rounded-xl bg-foreground text-background hover:bg-white/90 shadow-xl shadow-white/5 transition-all hover:scale-[1.02]"
            >
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <p className="text-center text-xs text-muted-foreground mt-6">
              By continuing, you agree to accept all punishments assigned by the system.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
