"use client";

import { useState } from "react";
import Timer from "./timer";

export default function Home() {
  const [resetSignal, setResetSignal] = useState(0);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-16 px-16 bg-white dark:bg-black sm:items-start">
        <h1>Just another Timer</h1>
        <div className="w-full mb-4">
          <button
            onClick={handleResetAll}
            className="px-2 py-1 text-xs border cursor-pointer hover:text-white hover:bg-red-500 transition-colors font-medium"
          >
            重置所有計時器
          </button>
        </div>
        {Array.from({ length: 10 }, (_, i: number) => (
          <Timer cIdx={i} key={i} resetSignal={resetSignal}></Timer>
        ))}
      </main>
    </div>
  );
}
