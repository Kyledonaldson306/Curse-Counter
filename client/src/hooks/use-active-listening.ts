import { useState, useCallback, useRef, useEffect } from "react";
import { useCreateCurseLog } from "./use-curse-logs";
import { useToast } from "@/hooks/use-toast";
import { detectCurseWords } from "@shared/curse-detection";
import {
  registerServiceWorker,
  subscribeToPush,
  requestNotificationPermission,
} from "@/lib/push-notifications";

const DEDUP_WINDOW_MS = 5000;

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
  const processedIndexRef = useRef(0);
  const recentlyLoggedRef = useRef<Map<string, number>>(new Map());

  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const isRecentlyLogged = useCallback((word: string): boolean => {
    const now = Date.now();
    const lastTime = recentlyLoggedRef.current.get(word);
    if (lastTime && now - lastTime < DEDUP_WINDOW_MS) {
      return true;
    }
    recentlyLoggedRef.current.set(word, now);
    for (const [key, time] of recentlyLoggedRef.current.entries()) {
      if (now - time > DEDUP_WINDOW_MS * 2) {
        recentlyLoggedRef.current.delete(key);
      }
    }
    return false;
  }, []);

  const notifyUser = useCallback(
    (word: string) => {
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

        wakeLockRef.current.addEventListener("release", () => {
          if (isListeningRef.current && "wakeLock" in navigator) {
            (navigator as any).wakeLock
              .request("screen")
              .then((lock: any) => {
                wakeLockRef.current = lock;
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
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
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
    processedIndexRef.current = 0;
    recentlyLoggedRef.current.clear();
  }, [releaseWakeLock, abortRecognition, setIsListening]);

  const startRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    processedIndexRef.current = 0;

    recognition.onresult = (event: any) => {
      for (let i = processedIndexRef.current; i < event.results.length; i++) {
        const result = event.results[i];

        if (!result.isFinal) continue;

        processedIndexRef.current = i + 1;

        const allTranscripts = new Set<string>();
        for (let alt = 0; alt < result.length; alt++) {
          allTranscripts.add(result[alt].transcript);
        }

        const allCurses = new Set<string>();
        for (const transcript of allTranscripts) {
          const curses = detectCurseWords(transcript);
          for (const curse of curses) {
            allCurses.add(curse);
          }
        }

        for (const curse of allCurses) {
          if (!isRecentlyLogged(curse)) {
            logCurse({ word: curse });
            notifyUser(curse);
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        stopListening();
        return;
      }
      if (event.error === "no-speech" || event.error === "audio-capture") {
        return;
      }
    };

    recognition.onend = () => {
      if (!isListeningRef.current) return;

      clearRestartTimeout();
      restartTimeoutRef.current = setTimeout(() => {
        if (!isListeningRef.current) return;
        abortRecognition();
        const newRec = startRecognition();
        if (newRec) {
          recognitionRef.current = newRec;
          try {
            newRec.start();
          } catch (e) {
            restartTimeoutRef.current = setTimeout(() => {
              if (!isListeningRef.current) return;
              const retry = startRecognition();
              if (retry) {
                recognitionRef.current = retry;
                try { retry.start(); } catch (e2) {}
              }
            }, 2000);
          }
        }
      }, 200);
    };

    return recognition;
  }, [logCurse, notifyUser, stopListening, clearRestartTimeout, abortRecognition, isRecentlyLogged]);

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

    abortRecognition();
    processedIndexRef.current = 0;

    const recognition = startRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      return;
    }

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
  }, [startRecognition, requestWakeLock, stopListening, toast, abortRecognition, setIsListening]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isListeningRef.current) {
        abortRecognition();

        setTimeout(() => {
          if (!isListeningRef.current) return;
          processedIndexRef.current = 0;
          const newRec = startRecognition();
          if (newRec) {
            recognitionRef.current = newRec;
            try {
              newRec.start();
            } catch (e) {
              console.error("Failed to restart on focus:", e);
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
  }, [startRecognition, abortRecognition, requestWakeLock]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearRestartTimeout();
      releaseWakeLock();
    };
  }, [releaseWakeLock, clearRestartTimeout]);

  return { isListening, startListening, stopListening, remainingTime };
}
