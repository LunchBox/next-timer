"use client";

import { useState, useEffect, useRef } from "react";

const MAX_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

export default function Timer({
  cIdx,
  resetSignal,
}: {
  cIdx: number;
  resetSignal?: number;
}) {
  const storageKey = `timer-${cIdx}`;
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTime(parsed.time || 0);
        setIsRunning(parsed.isRunning || false);
        if (parsed.isRunning && parsed.startTime) {
          startTimeRef.current = parsed.startTime;
          pausedTimeRef.current = parsed.pausedTime || 0;
        }
      } catch (e) {
        // Ignore invalid data
      }
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Save state to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      const stateToSave = {
        time,
        isRunning,
        startTime: startTimeRef.current,
        pausedTime: pausedTimeRef.current,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [time, isRunning, storageKey, isLoaded]);

  // Reset timer when resetSignal changes
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      setIsRunning(false);
      setTime(0);
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
    }
  }, [resetSignal]);

  // Animation frame for smooth updates
  const updateTimer = () => {
    if (isRunning && startTimeRef.current) {
      const now = performance.now();
      const elapsed = now - startTimeRef.current + pausedTimeRef.current;
      const newTime = Math.min(elapsed, MAX_TIME);

      setTime(newTime);

      if (newTime >= MAX_TIME) {
        setIsRunning(false);
        startTimeRef.current = null;
        pausedTimeRef.current = 0;
      } else {
        animationFrameRef.current = requestAnimationFrame(updateTimer);
      }
    }
  };

  useEffect(() => {
    if (isRunning) {
      if (!startTimeRef.current) {
        startTimeRef.current = performance.now();
      }
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (startTimeRef.current) {
        pausedTimeRef.current += performance.now() - startTimeRef.current;
        startTimeRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  const remainingTime = MAX_TIME - time;
  const progressPercentage = (time / MAX_TIME) * 100;

  const handleStart = () => {
    if (time < MAX_TIME) {
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    const firstConfirm = window.confirm("確定要重置計時器嗎？");
    if (!firstConfirm) return;

    const secondConfirm = window.confirm("再次確認：這將清除所有時間記錄！");
    if (!secondConfirm) return;

    const thirdConfirm = window.confirm(
      "最後確認：重置後無法恢復，確定執行嗎？",
    );
    if (!thirdConfirm) return;

    setIsRunning(false);
    setTime(0);
  };

  return (
    <div className="flex w-full items-center gap-4 p-2 border-b">
      <div className="w-16 text-sm font-medium">選手 {cIdx + 1}</div>
      <div className="flex-1">
        <div className="w-full bg-gray-200  h-3 mb-1 shadow-inner">
          <div
            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-3 transition-all duration-300 ease-out shadow-lg animate-pulse"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      <div className="w-32 text-center font-mono text-sm">
        <div className="text-xs text-gray-500">已用: {formatTime(time)}</div>
        <div className="text-xs text-red-600">
          剩餘: {formatTime(remainingTime)}
        </div>
      </div>
      <div className="flex gap-1">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={time >= MAX_TIME}
            className="px-2 py-1 text-xs border cursor-pointer hover:bg-gray-700 hover:text-gray-100 disabled:opacity-50"
          >
            {time === 0 ? "開始" : "繼續"}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-2 py-1 cursor-pointer text-xs border hover:bg-gray-700 hover:text-gray-100"
          >
            暫停
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-2 py-1 cursor-pointer text-xs border hover:bg-gray-700 hover:text-gray-100"
        >
          重置
        </button>
      </div>
    </div>
  );
}
