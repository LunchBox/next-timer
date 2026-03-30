"use client";

import { useState } from "react";
import Timer from "./timer";
import Button from "./button";

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

  const [resetSignal, setResetSignal] = useState(0);
  const [maxMinutes, setMaxMinutes] = useState(() => loadMaxMinutes());
  const [inputMinutes, setInputMinutes] = useState(() =>
    loadMaxMinutes().toString(),
  );
  const [playerCount, setPlayerCount] = useState(() => loadPlayerCount());
  const [inputPlayerCount, setInputPlayerCount] = useState(() =>
    loadPlayerCount().toString(),
  );

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

  const handleSetMaxMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(inputMinutes);
    if (isNaN(minutes) || minutes <= 0 || minutes > 60) {
      alert("Please enter a valid number of minutes (1-60)");
      return;
    }

    setMaxMinutes(minutes);
    setInputMinutes(minutes.toString());

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

  const handleSetPlayerCount = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(inputPlayerCount);
    if (isNaN(count) || count < 1 || count > 20) {
      alert("Please enter a valid number of players (1-20)");
      return;
    }

    setPlayerCount(count);
    setInputPlayerCount(count.toString());

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-8 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl mb-6">Just another Timer</h1>

        {/* Settings Form */}
        <div className="w-full mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-3">Timer Settings</h2>

          {/* Minutes Setting */}
          <form
            onSubmit={handleSetMaxMinutes}
            className="flex items-center gap-4 mb-3"
          >
            <label htmlFor="maxMinutes" className="text-sm font-medium">
              Maximum Minutes:
            </label>
            <input
              id="maxMinutes"
              type="number"
              min="1"
              max="60"
              value={inputMinutes}
              onChange={(e) => setInputMinutes(e.target.value)}
              className="px-3 py-1 border rounded text-sm w-20"
              placeholder="15"
            />
            <span className="text-sm text-gray-600">minutes (1-60)</span>
            <Button type="submit" variant="primary" size="sm">
              Set Minutes
            </Button>
          </form>

          {/* Player Count Setting */}
          <form
            onSubmit={handleSetPlayerCount}
            className="flex items-center gap-4"
          >
            <label htmlFor="playerCount" className="text-sm font-medium">
              Player Count:
            </label>
            <input
              id="playerCount"
              type="number"
              min="1"
              max="20"
              value={inputPlayerCount}
              onChange={(e) => setInputPlayerCount(e.target.value)}
              className="px-3 py-1 border rounded text-sm w-20"
              placeholder="10"
            />
            <span className="text-sm text-gray-600">players (1-20)</span>
            <Button type="submit" variant="primary" size="sm">
              Set Players
            </Button>
          </form>

          <p className="text-xs text-gray-500 mt-2">
            Current settings: {maxMinutes} minutes, {playerCount} players -
            Setting new parameters will reset all timers
          </p>
        </div>

        {/* Reset All Button */}
        <div className="w-full mb-4">
          <Button onClick={handleResetAll} variant="danger" size="md">
            Reset All Timers
          </Button>
        </div>

        {/* Timers */}
        {Array.from({ length: playerCount }, (_, i: number) => (
          <Timer
            cIdx={i}
            key={i}
            resetSignal={resetSignal}
            maxMinutes={maxMinutes}
          />
        ))}
      </main>
    </div>
  );
}
