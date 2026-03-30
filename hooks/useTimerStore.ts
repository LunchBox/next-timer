import { useState, useEffect, useRef, useCallback } from "react";
import { TimerState, TimerStorageState } from "../types/timer";

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

// Helper function to safely parse localStorage data
function loadTimerFromStorage(storageKey: string): TimerStorageState | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as TimerStorageState;

    // Basic validation
    if (
      typeof parsed.time !== "number" ||
      typeof parsed.isRunning !== "boolean"
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(`Failed to load timer data for ${storageKey}:`, error);
    return null;
  }
}

// Helper function to save timer to localStorage
function saveTimerToStorage(
  storageKey: string,
  state: TimerStorageState,
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn(`Failed to save timer data for ${storageKey}:`, error);
  }
}

export function useTimerStore(
  initialTimer: TimerState,
  settings: { reverseMode: boolean; maxMinutes: number },
): TimerStore {
  const storageKey = `timer-${initialTimer.id}`;
  const MAX_TIME = settings.maxMinutes * 60 * 1000;

  // Refs for timing calculations
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef(0);
  const initialTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize state - load from storage once on mount
  const [timer, setTimer] = useState<TimerState>(() => {
    // Start with unloaded state for SSR compatibility
    return { ...initialTimer, isLoaded: false };
  });

  // Load persisted data on mount - only once
  useEffect(() => {
    const savedData = loadTimerFromStorage(storageKey);

    if (savedData) {
      // Restore timer state from storage
      const restoredTimer: TimerState = {
        ...initialTimer,
        time: savedData.time,
        isRunning: false, // Always start paused, will resume if needed
        isLoaded: true,
      };

      setTimer(restoredTimer);

      // If timer was running when saved, prepare to resume
      if (savedData.isRunning && savedData.startTime) {
        const savedReverseMode = savedData.reverseMode || false;

        if (!savedReverseMode) {
          // Normal mode: simulate start time based on elapsed time
          startTimeRef.current = performance.now() - savedData.time;
          pausedTimeRef.current = savedData.pausedTime || 0;
          initialTimeRef.current = 0;
        } else {
          // Reverse mode: restore exact timing state
          startTimeRef.current = savedData.startTime;
          pausedTimeRef.current = savedData.pausedTime || 0;
          initialTimeRef.current = savedData.time;
        }

        // Auto-resume if it was running (slight delay to ensure state is set)
        setTimeout(() => {
          setTimer((prev) => ({ ...prev, isRunning: true }));
        }, 0);
      } else {
        // Timer was not running, just set initial time
        initialTimeRef.current = savedData.time;
      }
    } else {
      // No saved data, mark as loaded with defaults
      setTimer((prev) => ({ ...prev, isLoaded: true }));
      initialTimeRef.current = 0;
    }
    // Only depend on storageKey - initialTimer should be stable
  }, [storageKey]);

  // Save to localStorage whenever timer state changes (after loaded)
  useEffect(() => {
    if (!timer.isLoaded) return;

    const stateToSave: TimerStorageState = {
      time: timer.time,
      isRunning: timer.isRunning,
      startTime: startTimeRef.current,
      pausedTime: pausedTimeRef.current,
      reverseMode: settings.reverseMode,
    };

    saveTimerToStorage(storageKey, stateToSave);
  }, [timer, settings.reverseMode, storageKey]);

  // Timer update logic - separated from state dependencies to prevent loops
  const updateTimerLoop = useCallback(() => {
    // Check current running state from ref to avoid dependency issues
    const isCurrentlyRunning = startTimeRef.current !== null;

    if (!isCurrentlyRunning) return;

    const now = performance.now();
    const elapsed = now - startTimeRef.current! - pausedTimeRef.current;

    let newTime: number;
    let shouldTimeout = false;
    let isNormalModeComplete = false;

    if (settings.reverseMode) {
      // Reverse mode: count down from initial time
      newTime = Math.max(0, initialTimeRef.current - elapsed);
      if (newTime <= 0) {
        shouldTimeout = true;
        isNormalModeComplete = true;
      }
    } else {
      // Normal mode: count up from initial time
      newTime = initialTimeRef.current + elapsed;
      if (newTime >= MAX_TIME) {
        shouldTimeout = true;
        isNormalModeComplete = false;
      }
    }

    if (shouldTimeout) {
      // Stop the timer and show timeout
      setTimer((prev) => ({
        ...prev,
        time: settings.reverseMode ? 0 : MAX_TIME,
        isRunning: false,
        showTimeOut: true,
        isNormalModeComplete,
      }));
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
      animationFrameRef.current = null;
      return;
    }

    // Update timer time
    setTimer((prev) => ({ ...prev, time: newTime }));

    // Continue animation loop only if still running
    if (startTimeRef.current !== null) {
      animationFrameRef.current = requestAnimationFrame(updateTimerLoop);
    }
  }, [settings.reverseMode, MAX_TIME]);

  // Handle timer start/pause state changes
  useEffect(() => {
    if (timer.isRunning) {
      // Starting timer
      if (startTimeRef.current === null) {
        // First time start - capture current time as start time
        startTimeRef.current = performance.now();
        pausedTimeRef.current = 0;
        initialTimeRef.current = timer.time;
      }
      // Start animation loop if not already running
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(updateTimerLoop);
      }
    } else {
      // Pausing timer
      if (startTimeRef.current !== null) {
        // Accumulate paused time
        pausedTimeRef.current += performance.now() - startTimeRef.current;
        startTimeRef.current = null;
      }
      // Cancel animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [timer.isRunning, updateTimerLoop]);

  // Action functions
  const updateTimer = useCallback((newTime: number) => {
    setTimer((prev) => ({ ...prev, time: newTime }));
  }, []);

  const startTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resetTimer = useCallback(() => {
    // Clear timing refs
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    initialTimeRef.current = 0;

    // Clear storage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn(`Failed to clear timer data for ${storageKey}:`, error);
      }
    }

    // Reset state
    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      time: 0,
      showTimeOut: false,
      isNormalModeComplete: false,
    }));
  }, [storageKey]);

  const showTimeout = useCallback((isNormalModeComplete = false) => {
    setTimer((prev) => ({
      ...prev,
      showTimeOut: true,
      isNormalModeComplete,
      isRunning: false,
    }));
  }, []);

  const hideTimeout = useCallback(() => {
    setTimer((prev) => ({
      ...prev,
      showTimeOut: false,
    }));
  }, []);

  const setLoaded = useCallback(() => {
    setTimer((prev) => ({ ...prev, isLoaded: true }));
  }, []);

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

// Hook for managing multiple timers - creates only the requested number of timers
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
