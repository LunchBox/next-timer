"use client";

import { useState } from "react";
import Timer from "./timer";

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

  const [resetSignal, setResetSignal] = useState(0);
  const [maxMinutes, setMaxMinutes] = useState(() => loadMaxMinutes());
  const [inputMinutes, setInputMinutes] = useState(() =>
    loadMaxMinutes().toString(),
  );

  const handleResetAll = () => {
    const firstConfirm = window.confirm("確定要重置所有計時器嗎？");
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "再次確認：這將清除所有選手的時間記錄！",
    );
    if (!secondConfirm) return;

    const thirdConfirm = window.confirm(
      "最後確認：重置後所有數據將無法恢復，確定執行嗎？",
    );
    if (!thirdConfirm) return;

    // Clear all timer data from localStorage
    for (let i = 0; i < 10; i++) {
      localStorage.removeItem(`timer-${i}`);
    }

    // Trigger reset signal to all timers
    setResetSignal((prev) => prev + 1);
  };

  const handleSetMaxMinutes = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(inputMinutes);
    if (isNaN(minutes) || minutes <= 0 || minutes > 60) {
      alert("請輸入 1-60 分鐘的有效數字");
      return;
    }

    setMaxMinutes(minutes);
    setInputMinutes(minutes.toString());

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("timer-max-minutes", minutes.toString());
    }

    // Clear all timer data and reset when changing max minutes
    for (let i = 0; i < 10; i++) {
      localStorage.removeItem(`timer-${i}`);
    }
    setResetSignal((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-16 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl font-bold mb-6">Just another Timer</h1>

        {/* Settings Form */}
        <div className="w-full mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-3">計時器設置</h2>
          <form
            onSubmit={handleSetMaxMinutes}
            className="flex items-center gap-4"
          >
            <label htmlFor="maxMinutes" className="text-sm font-medium">
              最大分鐘數:
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
            <span className="text-sm text-gray-600">分鐘 (1-60)</span>
            <button
              type="submit"
              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              設置並重置
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            當前設置: {maxMinutes} 分鐘 - 設置新時間將重置所有計時器
          </p>
        </div>

        {/* Reset All Button */}
        <div className="w-full mb-4">
          <button
            onClick={handleResetAll}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium"
          >
            重置所有計時器
          </button>
        </div>

        {/* Timers */}
        {Array.from({ length: 10 }, (_, i: number) => (
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
