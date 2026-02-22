import { useState, useEffect, useCallback, useRef } from "react";
import { useCreateCurseLog } from "./use-curse-logs";
import { useToast } from "@/hooks/use-toast";

const CURSE_WORDS = [
  "damn", "hell", "crap", "piss", "bastard", "bloody", 
  "shit", "fuck", "ass", "bitch"
]; // A more realistic list of curse words for demonstration

export function useActiveListening() {
  const [isListening, setIsListening] = useState(false);
  const { mutate: logCurse } = useCreateCurseLog();
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  const notifyUser = useCallback((word: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Curse Detected!", {
        body: `You said "${word}". A punishment has been assigned.`,
        icon: "/favicon.png",
      });
    }
    toast({
      title: "Curse Detected!",
      description: `You said "${word}". Punishment assigned.`,
      variant: "destructive",
    });
  }, [toast]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log("Heard:", transcript);
      
      for (const word of CURSE_WORDS) {
        if (transcript.includes(word)) {
          logCurse({ word });
          notifyUser(word);
          break;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === "not-allowed") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    requestNotificationPermission();
  }, [isListening, logCurse, notifyUser, requestNotificationPermission, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening };
}
