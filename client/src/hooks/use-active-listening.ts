import { useState, useCallback, useRef, useEffect } from "react";
import { useCreateCurseLog } from "./use-curse-logs";
import { useToast } from "@/hooks/use-toast";
import { detectCurseWords } from "@shared/curse-detection";
import {
  registerServiceWorker,
  subscribeToPush,
  sendLocalNotification,
  requestNotificationPermission,
} from "@/lib/push-notifications";

export function useActiveListening() {
  const isListeningRef = useRef(false);
  const [isListening, setIsListeningState] = useState(false);

  const setIsListening = useCallback((val: boolean) => {
    isListeningRef.current = val;
    setIsListeningState(val);
  }, []);

  const { mutate: logCurse } = useCreateCurseLog();
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const notifyUser = useCallback(
    (word: string) => {
      sendLocalNotification(word);

      toast({
        title: "Hey! You CURSED!",
        description: `You said "${word}". Punishment assigned.`,
        variant: "destructive",
      });
    },
    [toast]
  );

  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        console.log("Wake Lock active");

        wakeLockRef.current.addEventListener("release", () => {
          if (isListeningRef.current && "wakeLock" in navigator) {
            (navigator as any).wakeLock
              .request("screen")
              .then((lock: any) => {
                wakeLockRef.current = lock;
                console.log("Wake Lock re-acquired");
              })
              .catch(() => {});
          }
        });
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

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const abortRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        try {
          recognitionRef.current.stop();
        } catch (e2) {}
      }
      recognitionRef.current = null;
    }
    clearRestartTimeout();
  }, [clearRestartTimeout]);

  const stopListening = useCallback(() => {
    abortRecognition();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    releaseWakeLock();
    setIsListening(false);
    setRemainingTime(null);
  }, [releaseWakeLock, abortRecognition]);

  const createRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript;
      console.log("Heard:", transcript);

      const curses = detectCurseWords(transcript);
      for (const curse of curses) {
        console.log("Detected curse word:", curse);
        logCurse({ word: curse });
        notifyUser(curse);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        stopListening();
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        console.log("Recognition ended, scheduling restart...");
        clearRestartTimeout();
        restartTimeoutRef.current = setTimeout(() => {
          if (isListeningRef.current) {
            try {
              abortRecognition();
              const newRec = createRecognition();
              if (newRec) {
                recognitionRef.current = newRec;
                newRec.start();
                console.log("Recognition restarted successfully");
              }
            } catch (e) {
              console.error("Restart failed, retrying in 2s:", e);
              restartTimeoutRef.current = setTimeout(() => {
                if (isListeningRef.current) {
                  try {
                    const retryRec = createRecognition();
                    if (retryRec) {
                      recognitionRef.current = retryRec;
                      retryRec.start();
                    }
                  } catch (e2) {
                    console.error("Second restart failed:", e2);
                  }
                }
              }, 2000);
            }
          }
        }, 300);
      }
    };

    return recognition;
  }, [logCurse, notifyUser, stopListening, clearRestartTimeout, abortRecognition]);

  const startListening = useCallback(async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    const permResult = await requestNotificationPermission();
    if (permResult === "granted") {
      await subscribeToPush();
    }

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setRemainingTime(3600);
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
  }, [createRecognition, requestWakeLock, stopListening, toast]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isListeningRef.current) {
        console.log("Tab visible again, restarting recognition...");
        abortRecognition();

        setTimeout(() => {
          if (isListeningRef.current) {
            const newRec = createRecognition();
            if (newRec) {
              recognitionRef.current = newRec;
              try {
                newRec.start();
                console.log("Recognition restarted after tab focus");
              } catch (e) {
                console.error("Failed to restart on focus:", e);
              }
            }
          }
        }, 500);

        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [createRecognition, abortRecognition, requestWakeLock]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearRestartTimeout();
      releaseWakeLock();
    };
  }, [releaseWakeLock, clearRestartTimeout]);

  return { isListening, startListening, stopListening, remainingTime };
}
