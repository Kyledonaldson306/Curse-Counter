import { useState, useEffect, useCallback, useRef } from "react";
import { useCreateCurseLog } from "./use-curse-logs";
import { useToast } from "@/hooks/use-toast";

const CURSE_WORDS = [
  "damn", "hell", "crap", "piss", "bastard", "bloody", 
  "shit", "fuck", "ass", "bitch", "penis", "wiener", "asshole"
];

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
      try {
        const registration = (window as any).navigator.serviceWorker?.controller;
        if (registration) {
          // Try to use service worker for background notifications if available
          registration.postMessage({
            type: 'CURSE_DETECTED',
            word
          });
        } else {
          new Notification("Curse Detected!", {
            body: `You said "${word}". A punishment has been assigned.`,
            icon: "/favicon.png",
            tag: 'curse-detection',
          } as any);
        }
      } catch (e) {
        // Fallback to standard notification
        new Notification("Curse Detected!", {
          body: `You said "${word}". A punishment has been assigned.`,
          icon: "/favicon.png",
        });
      }
    }
    toast({
      title: "Curse Detected!",
      description: `You said "${word}". Punishment assigned.`,
      variant: "destructive",
    });
  }, [toast]);

  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        console.log("Wake Lock active");
      } catch (err) {
        console.error("Wake Lock failed:", err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    releaseWakeLock();
    setIsListening(false);
    setRemainingTime(null);
  }, [releaseWakeLock]);

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
      
      const words = transcript.split(/\s+/);
      for (const heardWord of words) {
        const cleanWord = heardWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        if (CURSE_WORDS.includes(cleanWord)) {
          console.log("Detected curse word:", cleanWord);
          logCurse({ word: cleanWord });
          notifyUser(cleanWord);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        stopListening();
      }
    };

    recognition.onend = () => {
      if (isListening) {
        console.log("Recognition ended, restarting...");
        setTimeout(() => {
          if (isListening && !recognitionRef.current?.active) {
            try {
              recognition.start();
            } catch (e) {
              console.error("Restart failed", e);
            }
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setRemainingTime(3600); // 1 hour in seconds
    requestNotificationPermission();
    requestWakeLock();

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev !== null && prev <= 1) {
          stopListening();
          toast({
            title: "Session Ended",
            description: "Your 1-hour listening session has finished.",
          });
          return null;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
  }, [isListening, logCurse, notifyUser, requestNotificationPermission, requestWakeLock, stopListening, toast]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return { isListening, startListening, stopListening, remainingTime };
}
