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

  const [storageState, setStorageState] =
    useLocalStorage<TimerStorageState | null>(storageKey, null);

  const [timer, setTimer] = useState<TimerState>(initialTimer);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef(0);

  // Load from localStorage on mount
  useEffect(() => {
    if (storageState && !timer.isLoaded) {
      if (storageState.isRunning && storageState.startTime) {
        const savedReverseMode = storageState.reverseMode || false;
        if (!savedReverseMode) {
          // For normal mode, simulate start time to maintain correct timing after refresh
          startTimeRef.current = performance.now() - storageState.time;
          pausedTimeRef.current = 0;
        } else {
          startTimeRef.current = storageState.startTime;
          pausedTimeRef.current = storageState.pausedTime || 0;
        }
      }
      setTimer((prev) => ({
        ...prev,
        time: storageState.time || 0,
        isRunning: storageState.isRunning || false,
        isLoaded: true,
      }));
    } else if (!storageState && !timer.isLoaded) {
      setTimer((prev) => ({ ...prev, isLoaded: true }));
    }
  }, [storageState]); // Removed timer.isLoaded to prevent infinite loop

  // Save to localStorage whenever state changes (only after initial load)
  useEffect(() => {
    if (timer.isLoaded) {
      const stateToSave: TimerStorageState = {
        time: timer.time,
        isRunning: timer.isRunning,
        startTime: startTimeRef.current,
        pausedTime: pausedTimeRef.current,
        reverseMode: settings.reverseMode,
      };
      setStorageState(stateToSave);
    }
  }, [timer, settings.reverseMode]); // Removed setStorageState as it should be stable

  // Reset paused time when reverse mode changes to prevent calculation errors
  useEffect(() => {
    if (!timer.isRunning) {
      pausedTimeRef.current = 0;
    }
  }, [settings.reverseMode, timer.isRunning]);

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

// Hook for managing multiple timers
export function useTimerStores(
  count: number,
  settings: { reverseMode: boolean; maxMinutes: number },
): TimerStore[] {
  return Array.from({ length: count }, (_, i) =>
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
}
