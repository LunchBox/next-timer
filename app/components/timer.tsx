"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./button";
import TimerDialog from "./timer-dialog";

export default function Timer({
  cIdx,
  resetSignal,
  maxMinutes,
  allowMultiTimer,
  reverseMode,
  activeTimerDialog,
  onSetActiveTimerDialog,
}: {
  cIdx: number;
  resetSignal?: number;
  maxMinutes: number;
  allowMultiTimer: boolean;
  reverseMode: boolean;
  activeTimerDialog: number | null;
  onSetActiveTimerDialog: (timerId: number | null) => void;
}) {
  const storageKey = `timer-${cIdx}`;
  const MAX_TIME = maxMinutes * 60 * 1000; // Convert minutes to milliseconds
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTimeOut, setShowTimeOut] = useState(false);
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

  // Reset paused time when reverse mode changes to prevent calculation errors
  useEffect(() => {
    if (!isRunning) {
      pausedTimeRef.current = 0;
    }
  }, [reverseMode, isRunning]);

  // Animation frame for smooth updates
  const updateTimer = () => {
    if (isRunning && startTimeRef.current) {
      const now = performance.now();
      const elapsed = now - startTimeRef.current + pausedTimeRef.current;

      let newTime: number;
      if (reverseMode && time > 0) {
        // Reverse mode: countdown from current time to 0
        // For countdown, we don't use pausedTimeRef to avoid calculation errors
        const countdownElapsed = now - startTimeRef.current;
        newTime = Math.max(time - countdownElapsed, 0);
      } else {
        // Normal mode: count up from 0 to MAX_TIME
        newTime = Math.min(elapsed, MAX_TIME);
      }

      setTime(newTime);

      if (
        (reverseMode && newTime <= 0) ||
        (!reverseMode && newTime >= MAX_TIME)
      ) {
        // Show timeout alert for reverse mode countdown
        if (reverseMode && newTime <= 0) {
          handleTimeOut();
        }
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
  const progressPercentage =
    reverseMode && time > 0 ? (time / MAX_TIME) * 100 : (time / MAX_TIME) * 100;

  const handleStart = () => {
    if (time < MAX_TIME || (reverseMode && time > 0)) {
      const confirmMessage =
        time === 0
          ? `Are you sure you want to start Player ${cIdx + 1}'s timer?`
          : reverseMode
            ? `Are you sure you want to count down Player ${cIdx + 1}'s timer?`
            : `Are you sure you want to continue Player ${cIdx + 1}'s timer?`;

      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;

      if (!allowMultiTimer) {
        // If multi-timer is not allowed, show dialog for this timer
        onSetActiveTimerDialog(cIdx);
      }
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

  const handleDialogClose = () => {
    setIsRunning(false);
    setShowTimeOut(false);
    onSetActiveTimerDialog(null);
  };

  const handleTimeOut = () => {
    setShowTimeOut(true);
    setIsRunning(false);
  };

  const showDialog =
    !allowMultiTimer &&
    activeTimerDialog === cIdx &&
    (isRunning || showTimeOut);

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
            disabled={
              (!reverseMode && time >= MAX_TIME) || (reverseMode && time === 0)
            }
            variant="ghost"
            size="sm"
          >
            {time === 0 ? "Start" : reverseMode ? "Count Down" : "Continue"}
          </Button>
        ) : (
          <Button onClick={handlePause} variant="secondary" size="sm">
            Pause
          </Button>
        )}
        <Button
          onClick={handleReset}
          disabled={time === 0}
          variant="ghost"
          size="sm"
        >
          Reset
        </Button>
      </div>

      {/* Large Timer Dialog */}
      {showDialog && (
        <TimerDialog
          playerNumber={cIdx + 1}
          time={time}
          remainingTime={remainingTime}
          onClose={handleDialogClose}
          onTimeOut={handleTimeOut}
          isReverseMode={reverseMode}
          showTimeOut={showTimeOut}
        />
      )}
    </div>
  );
}
