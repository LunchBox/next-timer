import { useState, useEffect, useRef } from "react";
import { TimerState, TimerStorageState } from "../types/timer";
import { useLocalStorage } from "./useLocalStorage";

export interface TimerStore {
  timer: TimerState;
  startTimeRef: React.MutableRefObject<number | null>;
  pausedTimeRef: React.MutableRefObject<number>;
  updateTimer: (newTime: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  showTimeout: (isNormalModeComplete?: boolean) => void;
  hideTimeout: () => void;
  setLoaded: () => void;
}

export function useTimerStore(
  initialTimer: TimerState,
  settings: { reverseMode: boolean; maxMinutes: number },
): TimerStore {
  const storageKey = `timer-${initialTimer.id}`;
  const MAX_TIME = settings.maxMinutes * 60 * 1000;

  // Load initial state from localStorage synchronously
  const getInitialTimerState = (): TimerState => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const storageState: TimerStorageState = JSON.parse(saved);
        if (storageState.isRunning && storageState.startTime) {
          const savedReverseMode = storageState.reverseMode || false;
          if (!savedReverseMode) {
            // For normal mode, simulate start time to maintain correct timing after refresh
            startTimeRef.current = performance.now() - storageState.time;
            pausedTimeRef.current = 0;
            initialTimeRef.current = 0; // Normal mode always starts from 0
          } else {
            startTimeRef.current = storageState.startTime;
            pausedTimeRef.current = storageState.pausedTime || 0;
            initialTimeRef.current = storageState.time; // Reverse mode starts from saved time
          }
        } else {
          // Timer is not running, set initial time for future starts
          initialTimeRef.current = storageState.time || 0;
        }
        return {
          ...initialTimer,
          time: storageState.time || 0,
          isRunning: storageState.isRunning || false,
          isLoaded: true,
        };
      }
    } catch (e) {
      // Invalid data, use defaults
    }
    return { ...initialTimer, isLoaded: true };
  };

  const [timer, setTimer] = useState<TimerState>(getInitialTimerState);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef(0);
  const initialTimeRef = useRef(0); // Store the time when timer started

  // Save to localStorage synchronously whenever state changes (only after initial load)
  useEffect(() => {
    if (timer.isLoaded) {
      const stateToSave: TimerStorageState = {
        time: timer.time,
        isRunning: timer.isRunning,
        startTime: startTimeRef.current,
        pausedTime: pausedTimeRef.current,
        reverseMode: settings.reverseMode,
      };
      // Save synchronously to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [timer, settings.reverseMode, storageKey]); // Added storageKey to deps

  // Reset paused time when reverse mode changes to prevent calculation errors
  useEffect(() => {
    if (!timer.isRunning) {
      pausedTimeRef.current = 0;
    }
  }, [settings.reverseMode, timer.isRunning]);

  // Timer update logic - runs when timer is running
  useEffect(() => {
    let animationFrame: number;

    const updateTimer = () => {
      if (timer.isRunning && startTimeRef.current !== null) {
        const now = performance.now();
        const elapsed = now - startTimeRef.current - pausedTimeRef.current;

        let newTime: number;
        if (settings.reverseMode) {
          // Reverse mode: count down from initial time
          newTime = Math.max(0, initialTimeRef.current - elapsed);
          if (newTime <= 0) {
            // Timer reached zero
            showTimeout(true);
            return;
          }
        } else {
          // Normal mode: count up from initial time
          newTime = initialTimeRef.current + elapsed;
          if (newTime >= MAX_TIME) {
            // Timer reached max time
            showTimeout(false);
            return;
          }
        }

        // Update timer state
        setTimer((prev) => ({ ...prev, time: newTime }));
      }

      if (timer.isRunning) {
        animationFrame = requestAnimationFrame(updateTimer);
      }
    };

    if (timer.isRunning) {
      if (startTimeRef.current === null) {
        // Starting timer for the first time
        startTimeRef.current = performance.now();
        pausedTimeRef.current = 0;
        initialTimeRef.current = timer.time; // Capture the starting time
      }
      animationFrame = requestAnimationFrame(updateTimer);
    } else {
      // Timer paused
      if (startTimeRef.current !== null) {
        pausedTimeRef.current += performance.now() - startTimeRef.current;
      }
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [timer.isRunning, settings.reverseMode, MAX_TIME]);

  const updateTimer = (newTime: number) => {
    setTimer((prev) => ({ ...prev, time: newTime }));
  };

  const startTimer = () => {
    setTimer((prev) => ({ ...prev, isRunning: true }));
  };

  const pauseTimer = () => {
    setTimer((prev) => ({ ...prev, isRunning: false }));
  };

  const resetTimer = () => {
    // Clear localStorage when resetting
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      // Ignore localStorage errors
    }
    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      time: 0,
      showTimeOut: false,
      isNormalModeComplete: false,
    }));
  };

  const showTimeout = (isNormalModeComplete = false) => {
    setTimer((prev) => ({
      ...prev,
      showTimeOut: true,
      isNormalModeComplete,
      isRunning: false,
    }));
  };

  const hideTimeout = () => {
    setTimer((prev) => ({
      ...prev,
      showTimeOut: false,
    }));
  };

  const setLoaded = () => {
    setTimer((prev) => ({ ...prev, isLoaded: true }));
  };

  return {
    timer,
    startTimeRef,
    pausedTimeRef,
    updateTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    showTimeout,
    hideTimeout,
    setLoaded,
  };
}

// Maximum number of timers supported
const MAX_TIMERS = 20;

// Hook for managing multiple timers - always creates MAX_TIMERS hooks for consistency
export function useTimerStores(
  count: number,
  settings: { reverseMode: boolean; maxMinutes: number },
): TimerStore[] {
  // Always create MAX_TIMERS hooks to maintain consistent hook calls
  const allStores = Array.from({ length: MAX_TIMERS }, (_, i) =>
    useTimerStore(
      {
        id: i,
        time: 0,
        isRunning: false,
        isLoaded: false,
        showTimeOut: false,
        isNormalModeComplete: false,
      },
      settings,
    ),
  );

  // Return only the requested number of stores
  return allStores.slice(0, count);
}
