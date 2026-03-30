import { useState } from "react";
import Button from "./button";

interface TimerSettingsProps {
  maxMinutes: number;
  playerCount: number;
  allowMultiTimer: boolean;
  onSetMaxMinutes: (minutes: number) => void;
  onSetPlayerCount: (count: number) => void;
  onSetAllowMultiTimer: (allow: boolean) => void;
}

export default function TimerSettings({
  maxMinutes,
  playerCount,
  allowMultiTimer,
  onSetMaxMinutes,
  onSetPlayerCount,
  onSetAllowMultiTimer,
}: TimerSettingsProps) {
  const [inputMinutes, setInputMinutes] = useState(maxMinutes.toString());
  const [inputPlayerCount, setInputPlayerCount] = useState(
    playerCount.toString(),
  );

  const handleSetMaxMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(inputMinutes);
    if (isNaN(minutes) || minutes <= 0 || minutes > 60) {
      alert("Please enter a valid number of minutes (1-60)");
      return;
    }

    onSetMaxMinutes(minutes);
  };

  const handleSetPlayerCount = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(inputPlayerCount);
    if (isNaN(count) || count < 1 || count > 20) {
      alert("Please enter a valid number of players (1-20)");
      return;
    }

    onSetPlayerCount(count);
  };

  return (
    <div className="w-full p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 my-4">
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
        className="flex items-center gap-4 mb-3"
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

      {/* Multi Timer Setting */}
      <div className="flex items-center gap-4">
        <label htmlFor="allowMultiTimer" className="text-sm font-medium">
          Allow Multiple Timers:
        </label>
        <input
          id="allowMultiTimer"
          type="checkbox"
          checked={allowMultiTimer}
          onChange={(e) => onSetAllowMultiTimer(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm text-gray-600">
          {allowMultiTimer ? "Enabled" : "Disabled"} - When disabled, only one
          timer can run at a time with a large display dialog
        </span>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Current settings: {maxMinutes} minutes, {playerCount} players,
        multi-timer: {allowMultiTimer ? "enabled" : "disabled"}
      </p>
    </div>
  );
}
