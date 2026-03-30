"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./button";

export default function Timer({
  cIdx,
  resetSignal,
  maxMinutes,
}: {
  cIdx: number;
  resetSignal?: number;
  maxMinutes: number;
}) {
  const storageKey = `timer-${cIdx}`;
  const MAX_TIME = maxMinutes * 60 * 1000; // Convert minutes to milliseconds
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
    const firstConfirm = window.confirm(
      "Are you sure you want to reset this timer?",
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "Confirm again: This will clear all time records!",
    );
    if (!secondConfirm) return;

    const thirdConfirm = window.confirm(
      "Final confirmation: Data cannot be recovered after reset, proceed?",
    );
    if (!thirdConfirm) return;

    setIsRunning(false);
    setTime(0);
  };

  return (
    <div className="flex w-full items-center gap-4 p-2 border-b">
      <div className="w-16 text-sm font-medium">Player {cIdx + 1}</div>
      <div className="flex-1">
        <div className="w-full bg-gray-200  h-3 mb-1 shadow-inner">
          <div
            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-3 transition-all duration-300 ease-out shadow-lg animate-pulse"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      <div className="w-32 text-center font-mono text-sm">
        <div className="text-xs text-gray-500">Used: {formatTime(time)}</div>
        <div className="text-xs text-red-600 whitespace-nowrap">
          Remain: {formatTime(remainingTime)}
        </div>
      </div>
      <div className="flex gap-1">
        {!isRunning ? (
          <Button
            onClick={handleStart}
            disabled={time >= MAX_TIME}
            variant="ghost"
            size="sm"
          >
            {time === 0 ? "Start" : "Continue"}
          </Button>
        ) : (
          <Button onClick={handlePause} variant="secondary" size="sm">
            Pause
          </Button>
        )}
        <Button onClick={handleReset} variant="ghost" size="sm">
          Reset
        </Button>
      </div>
    </div>
  );
}
