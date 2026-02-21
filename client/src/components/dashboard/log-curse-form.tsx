import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Send, Loader2, Sparkles } from "lucide-react";
import { useCreateCurseLog } from "@/hooks/use-curse-logs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  word: z.string().min(1, "You must enter a word").max(50, "Word is too long"),
});

type FormData = z.infer<typeof schema>;

export function LogCurseForm() {
  const { mutate: createLog, isPending } = useCreateCurseLog();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    createLog(data, {
      onSuccess: (result) => {
        reset();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        
        toast({
          title: "Curse Logged",
          description: `Punishment assigned: ${result.punishment}`,
          variant: "destructive",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary/80 to-secondary/30 p-8 border border-white/5 shadow-2xl">
      <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="relative z-10 max-w-xl mx-auto text-center">
        <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold font-display mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          Slip up? Log it.
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          Accountability is the first step. Enter the word you used and accept your fate.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg transition-opacity opacity-0 group-focus-within:opacity-100" />
            <div className="relative flex gap-2">
              <Input
                {...register("word")}
                placeholder="What did you say?"
                className="h-14 px-6 text-lg bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
              />
              <Button 
                type="submit" 
                disabled={isPending}
                size="lg"
                className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Log It <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
          <AnimatePresence>
            {errors.word && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm text-destructive font-medium text-left px-2"
              >
                {errors.word.message}
              </motion.p>
            )}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Punishment assigned below!
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
