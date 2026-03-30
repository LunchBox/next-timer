"use client";

import { useState, useEffect } from "react";
import TimerComponent from "./components/timer";
import Button from "./components/button";
import TimerSettings from "./components/timer-settings";
import { useSettingStore } from "../hooks/useSettingStore";
import { tripleConfirm } from "../utils/confirmations";
import { TIMER_CONFIG } from "../config/timer";
import { TimerState } from "../types/timer";
import {
  createDefaultTimer,
  resetTimer,
  setTimerLoaded,
  updateTimerInArray,
} from "./models/timer";

export default function Home() {
  const {
    settings,
    handleSetMaxMinutes,
    handleSetPlayerCount,
    handleSetAllowMultiTimer,
    handleToggleReverseMode,
  } = useSettingStore();

  const [showSettings, setShowSettings] = useState(false);
  const [activeTimerDialog, setActiveTimerDialog] = useState<number | null>(
    null,
  );
  const [globalPause, setGlobalPause] = useState(false);

  // Initialize timers
  const [timers, setTimers] = useState<TimerState[]>(() =>
    Array.from({ length: settings.playerCount }, (_, i) => ({
      id: i,
      time: 0,
      isRunning: false,
      isLoaded: false,
      showTimeOut: false,
      isNormalModeComplete: false,
    })),
  );

  // Update timers when playerCount changes
  useEffect(() => {
    setTimers((prev) => {
      const newTimers = [...prev];
      while (newTimers.length < settings.playerCount) {
        newTimers.push({
          id: newTimers.length,
          time: 0,
          isRunning: false,
          isLoaded: false,
          showTimeOut: false,
          isNormalModeComplete: false,
        });
      }
      return newTimers.slice(0, settings.playerCount);
    });
  }, [settings.playerCount]);

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
    for (let i = 0; i < settings.playerCount; i++) {
      localStorage.removeItem(`timer-${i}`);
    }

    // Reset all timers using model functions
    setTimers((prev) =>
      prev.map(
        (timer) =>
          updateTimerInArray([timer], timer.id, resetTimer)[0] &&
          updateTimerInArray([timer], timer.id, setTimerLoaded)[0],
      ),
    );
  };

  const handleSetAllowMultiTimerWrapper = (allow: boolean) => {
    handleSetAllowMultiTimer(allow);

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
          <Button onClick={handleGlobalPause} variant="secondary" size="sm">
            {globalPause ? "Resume All" : "Pause All"}
          </Button>
          <Button onClick={handleResetAll} variant="danger" size="sm">
            Reset All Timers
          </Button>
          <Button
            onClick={handleToggleReverseMode}
            variant={settings.reverseMode ? "primary" : "ghost"}
            size="sm"
          >
            {settings.reverseMode ? "Reverse Mode: ON" : "Reverse Mode: OFF"}
          </Button>
        </div>

        {/* Settings Form */}
        {showSettings && (
          <TimerSettings
            maxMinutes={settings.maxMinutes}
            playerCount={settings.playerCount}
            allowMultiTimer={settings.allowMultiTimer}
            onSetMaxMinutes={handleSetMaxMinutes}
            onSetPlayerCount={handleSetPlayerCount}
            onSetAllowMultiTimer={handleSetAllowMultiTimerWrapper}
          />
        )}

        {/* Timers */}
        {Array.from({ length: settings.playerCount }, (_, i: number) => (
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
