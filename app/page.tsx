"use client";

import { useState, useEffect } from "react";
import Timer from "./components/timer";
import Button from "./components/button";
import TimerSettings from "./components/timer-settings";

export default function Home() {
  // Load maxMinutes from localStorage or default to 15
  const loadMaxMinutes = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("timer-max-minutes");
      if (saved) {
        try {
          const parsed = parseInt(saved);
          return isNaN(parsed) || parsed < 1 || parsed > 60 ? 15 : parsed;
        } catch (e) {
          return 15;
        }
      }
    }
    return 15;
  };

  // Load playerCount from localStorage or default to 10
  const loadPlayerCount = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("timer-player-count");
      if (saved) {
        try {
          const parsed = parseInt(saved);
          return isNaN(parsed) || parsed < 1 || parsed > 20 ? 10 : parsed;
        } catch (e) {
          return 10;
        }
      }
    }
    return 10;
  };

  // Load allowMultiTimer from localStorage or default to false
  const loadAllowMultiTimer = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("timer-allow-multi-timer");
      if (saved) {
        try {
          return saved === "true";
        } catch (e) {
          return false;
        }
      }
    }
    return false;
  };

  const [resetSignal, setResetSignal] = useState(0);
  const [maxMinutes, setMaxMinutes] = useState(15); // Default value for SSR
  const [playerCount, setPlayerCount] = useState(10); // Default value for SSR
  const [allowMultiTimer, setAllowMultiTimer] = useState(false); // Default value for SSR
  const [showSettings, setShowSettings] = useState(false);
  const [activeTimerDialog, setActiveTimerDialog] = useState<number | null>(
    null,
  );

  // Load settings from localStorage after component mounts (client-side only)
  useEffect(() => {
    setMaxMinutes(loadMaxMinutes());
    setPlayerCount(loadPlayerCount());
    setAllowMultiTimer(loadAllowMultiTimer());
  }, []);

  const handleResetAll = () => {
    const firstConfirm = window.confirm(
      "Are you sure you want to reset all timers?",
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "Confirm again: This will clear all player time records!",
    );
    if (!secondConfirm) return;

    const thirdConfirm = window.confirm(
      "Final confirmation: Data cannot be recovered after reset, proceed?",
    );
    if (!thirdConfirm) return;

    // Clear all timer data from localStorage
    for (let i = 0; i < playerCount; i++) {
      localStorage.removeItem(`timer-${i}`);
    }

    // Trigger reset signal to all timers
    setResetSignal((prev) => prev + 1);
  };

  const handleSetMaxMinutes = (minutes: number) => {
    setMaxMinutes(minutes);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("timer-max-minutes", minutes.toString());
    }

    // Clear all timer data and reset when changing max minutes
    for (let i = 0; i < 20; i++) {
      localStorage.removeItem(`timer-${i}`);
    }
    setResetSignal((prev) => prev + 1);
  };

  const handleSetPlayerCount = (count: number) => {
    setPlayerCount(count);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("timer-player-count", count.toString());
    }

    // Clear timer data for players beyond the new count
    for (let i = count; i < 20; i++) {
      localStorage.removeItem(`timer-${i}`);
    }
    setResetSignal((prev) => prev + 1);
  };

  const handleSetAllowMultiTimer = (allow: boolean) => {
    setAllowMultiTimer(allow);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("timer-allow-multi-timer", allow.toString());
    }

    // If disabling multi-timer, close any active dialog
    if (!allow) {
      setActiveTimerDialog(null);
    }
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
          <Button onClick={handleResetAll} variant="danger" size="sm">
            Reset All Timers
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
          <Timer
            cIdx={i}
            key={i}
            resetSignal={resetSignal}
            maxMinutes={maxMinutes}
            allowMultiTimer={allowMultiTimer}
            activeTimerDialog={activeTimerDialog}
            onSetActiveTimerDialog={setActiveTimerDialog}
          />
        ))}
      </main>
    </div>
  );
}
