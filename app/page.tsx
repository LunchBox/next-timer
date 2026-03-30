"use client";

import { useState } from "react";
import TimerComponent from "./components/timer";
import Button from "./components/button";
import TimerSettings from "./components/timer-settings";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { tripleConfirm } from "../utils/confirmations";
import { TIMER_CONFIG } from "../config/timer";
import { TimerState, SettingsState } from "../types/timer";

export default function Home() {
  const [maxMinutes, saveMaxMinutes] = useLocalStorage(
    TIMER_CONFIG.STORAGE_KEYS.MAX_MINUTES,
    TIMER_CONFIG.DEFAULT_MAX_MINUTES,
    (v) =>
      typeof v === "number" && v >= 1 && v <= TIMER_CONFIG.MAX_MINUTES_LIMIT,
  );
  const [playerCount, savePlayerCount] = useLocalStorage(
    TIMER_CONFIG.STORAGE_KEYS.PLAYER_COUNT,
    TIMER_CONFIG.DEFAULT_PLAYER_COUNT,
    (v) =>
      typeof v === "number" && v >= 1 && v <= TIMER_CONFIG.MAX_PLAYER_COUNT,
  );
  const [allowMultiTimer, saveAllowMultiTimer] = useLocalStorage(
    TIMER_CONFIG.STORAGE_KEYS.ALLOW_MULTI,
    false,
    (v) => typeof v === "boolean",
  );
  const [reverseMode, saveReverseMode] = useLocalStorage(
    TIMER_CONFIG.STORAGE_KEYS.REVERSE_MODE,
    false,
    (v) => typeof v === "boolean",
  );
  const [showSettings, setShowSettings] = useState(false);
  const [activeTimerDialog, setActiveTimerDialog] = useState<number | null>(
    null,
  );
  const [globalPause, setGlobalPause] = useState(false);

  // Global settings state
  const settings: SettingsState = {
    maxMinutes,
    playerCount,
    allowMultiTimer,
    reverseMode,
  };

  // Initialize timers
  const [timers, setTimers] = useState<TimerState[]>(() =>
    Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      time: 0,
      isRunning: false,
      isLoaded: false,
      showTimeOut: false,
      isNormalModeComplete: false,
    })),
  );

  // Update timers when playerCount changes
  useState(() => {
    setTimers((prev) => {
      const newTimers = [...prev];
      while (newTimers.length < playerCount) {
        newTimers.push({
          id: newTimers.length,
          time: 0,
          isRunning: false,
          isLoaded: false,
          showTimeOut: false,
          isNormalModeComplete: false,
        });
      }
      return newTimers.slice(0, playerCount);
    });
  });

  // const onUpdateTimerState = (
  //   timerId: number,
  //   updates: Partial<TimerState>,
  // ) => {
  //   setTimers((prev) =>
  //     prev.map((timer) =>
  //       timer.id === timerId
  //         ? { ...timer, state: { ...timer.state, ...updates } }
  //         : timer,
  //     ),
  //   );
  // };

  const handleGlobalPause = () => {
    const newGlobalPause = !globalPause;
    setGlobalPause(newGlobalPause);

    // Pause or resume all timers based on global pause state
    setTimers((prev) =>
      prev.map((timer) => ({
        ...timer,
        isRunning: newGlobalPause ? false : timer.isRunning,
      })),
    );
  };

  const handleResetAll = async () => {
    const confirmed = await tripleConfirm([
      "Are you sure you want to reset all timers?",
      "Confirm again: This will clear all player time records!",
      "Final confirmation: Data cannot be recovered after reset, proceed?",
    ]);

    if (!confirmed) return;

    // Clear all timer data from localStorage
    for (let i = 0; i < playerCount; i++) {
      localStorage.removeItem(`timer-${i}`);
    }

    // Reset all timers directly
    setTimers((prev) =>
      prev.map((timer) => ({
        ...timer,
        state: {
          time: 0,
          isRunning: false,
          isLoaded: true,
          showTimeOut: false,
          isNormalModeComplete: false,
        },
      })),
    );
  };

  const handleSetMaxMinutes = (minutes: number) => {
    saveMaxMinutes(minutes as any);

    // Clear all timer data and reset when changing max minutes
    for (let i = 0; i < TIMER_CONFIG.MAX_PLAYER_COUNT; i++) {
      localStorage.removeItem(`timer-${i}`);
    }

    // Reset all timers
    setTimers((prev) =>
      prev.map((timer) => ({
        ...timer,
        state: {
          time: 0,
          isRunning: false,
          isLoaded: true,
          showTimeOut: false,
          isNormalModeComplete: false,
        },
      })),
    );
  };

  const handleSetPlayerCount = (count: number) => {
    savePlayerCount(count as any);

    // Clear timer data for players beyond the new count
    for (let i = count; i < TIMER_CONFIG.MAX_PLAYER_COUNT; i++) {
      localStorage.removeItem(`timer-${i}`);
    }

    // Reset all timers
    setTimers((prev) =>
      prev.map((timer) => ({
        ...timer,
        state: {
          time: 0,
          isRunning: false,
          isLoaded: true,
          showTimeOut: false,
          isNormalModeComplete: false,
        },
      })),
    );
  };

  const handleSetAllowMultiTimer = (allow: boolean) => {
    saveAllowMultiTimer(allow);

    // If disabling multi-timer, close any active dialog
    if (!allow) {
      setActiveTimerDialog(null);
    }
  };

  const handleToggleReverseMode = async () => {
    const newReverseMode = !reverseMode;
    const action = newReverseMode ? "enable" : "disable";

    const confirmed = await tripleConfirm([
      `Are you sure you want to ${action} reverse mode?`,
      "This will change how timers work.",
      "Confirm to proceed.",
    ]);

    if (!confirmed) return;

    saveReverseMode(newReverseMode);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-8 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl mb-6">Just another Timer</h1>

        {/* Control Buttons */}
        <div className="w-full mb-2 flex gap-2">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="secondary"
            size="sm"
          >
            {showSettings ? "Hide Settings" : "Show Settings"}
          </Button>
          <Button onClick={handleGlobalPause} variant="secondary" size="sm">
            {globalPause ? "Resume All" : "Pause All"}
          </Button>
          <Button onClick={handleResetAll} variant="danger" size="sm">
            Reset All Timers
          </Button>
          <Button
            onClick={handleToggleReverseMode}
            variant={reverseMode ? "primary" : "ghost"}
            size="sm"
          >
            {reverseMode ? "Reverse Mode: ON" : "Reverse Mode: OFF"}
          </Button>
        </div>

        {/* Settings Form */}
        {showSettings && (
          <TimerSettings
            maxMinutes={maxMinutes}
            playerCount={playerCount}
            allowMultiTimer={allowMultiTimer}
            onSetMaxMinutes={handleSetMaxMinutes}
            onSetPlayerCount={handleSetPlayerCount}
            onSetAllowMultiTimer={handleSetAllowMultiTimer}
          />
        )}

        {/* Timers */}
        {Array.from({ length: playerCount }, (_, i: number) => (
          <TimerComponent
            key={timers[i].id}
            timer={timers[i]}
            settings={settings}
            activeTimerDialog={activeTimerDialog}
            onSetActiveTimerDialog={setActiveTimerDialog}
          />
        ))}
      </main>
    </div>
  );
}
