"use client";

import { useState, useEffect, useMemo } from "react";
import TimerComponent from "./components/timer";
import Button from "./components/button";
import TimerSettings from "./components/timer-settings";
import { useSettingStore } from "../hooks/useSettingStore";
import { useTimerStores } from "../hooks/useTimerStore";
import { tripleConfirm } from "../utils/confirmations";

export default function Home() {
  const {
    settings,
    handleSetMaxMinutes,
    handleSetPlayerCount,
    handleSetAllowMultiTimer,
    handleToggleReverseMode,
  } = useSettingStore();

  // Use stable settings for timer stores to prevent recreation
  const stableTimerSettings = useMemo(
    () => ({
      reverseMode: settings.reverseMode,
      maxMinutes: settings.maxMinutes,
    }),
    [settings.reverseMode, settings.maxMinutes],
  );

  const [showSettings, setShowSettings] = useState(false);
  const [activeTimerDialog, setActiveTimerDialog] = useState<number | null>(
    null,
  );
  const [globalPause, setGlobalPause] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by only rendering dynamic content after client-side mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use the timer stores hook to manage all timers
  const timerStores = useTimerStores(settings.playerCount, stableTimerSettings);

  const handleGlobalPause = () => {
    const newGlobalPause = !globalPause;
    setGlobalPause(newGlobalPause);

    // Pause or resume all timers based on global pause state
    if (newGlobalPause) {
      timerStores.forEach((store) => store.pauseTimer());
    }
  };

  const handleResetAll = async () => {
    const confirmed = await tripleConfirm([
      "Are you sure you want to reset all timers?",
      "Confirm again: This will clear all player time records!",
      "Final confirmation: Data cannot be recovered after reset, proceed?",
    ]);

    if (!confirmed) return;

    // Reset all timers using the store methods
    timerStores.forEach((store) => store.resetTimer());
  };

  const handleSetAllowMultiTimerWrapper = (allow: boolean) => {
    handleSetAllowMultiTimer(allow);

    // If disabling multi-timer, close any active dialog
    if (!allow) {
      setActiveTimerDialog(null);
    }
  };

  const handleStartTimer = (timerId: number) => {
    if (timerStores[timerId]) {
      timerStores[timerId].startTimer();
    }
  };

  const handlePauseTimer = (timerId: number) => {
    if (timerStores[timerId]) {
      timerStores[timerId].pauseTimer();
    }
  };

  const handleResetTimer = (timerId: number) => {
    if (timerStores[timerId]) {
      timerStores[timerId].resetTimer();
    }
  };

  const handleShowTimeout = (timerId: number, isNormalModeComplete = false) => {
    if (timerStores[timerId]) {
      timerStores[timerId].showTimeout(isNormalModeComplete);
    }
  };

  const handleHideTimeout = (timerId: number) => {
    if (timerStores[timerId]) {
      timerStores[timerId].hideTimeout();
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
          {isClient && (
            <Button
              onClick={handleToggleReverseMode}
              variant={settings.reverseMode ? "primary" : "ghost"}
              size="sm"
            >
              {settings.reverseMode ? "Reverse Mode: ON" : "Reverse Mode: OFF"}
            </Button>
          )}
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

        {/* Timers - only render on client to prevent hydration mismatch */}
        {isClient &&
          timerStores.map((store, i: number) => (
            <TimerComponent
              key={store.timer.id}
              timer={store.timer}
              settings={settings}
              activeTimerDialog={activeTimerDialog}
              onSetActiveTimerDialog={setActiveTimerDialog}
              onStartTimer={handleStartTimer}
              onPauseTimer={handlePauseTimer}
              onResetTimer={handleResetTimer}
              onShowTimeout={handleShowTimeout}
              onHideTimeout={handleHideTimeout}
            />
          ))}
      </main>
    </div>
  );
}
