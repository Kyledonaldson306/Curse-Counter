import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto glass-card border-white/5">
        <CardContent className="pt-6 pb-6 text-center">
          <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2 font-display">404 Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            Did you get lost looking for a place to curse? This page doesn't exist.
          </p>

          <Link href="/" className="block">
            <Button className="w-full h-12 rounded-xl">
              Return to Safety
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
