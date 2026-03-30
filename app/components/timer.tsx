"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./button";
import TimerDialog from "./timer-dialog";
import { TimerProps, TimerStorageState, TimerState } from "../../types/timer";
import { useTimerStore } from "../../hooks/useTimerStore";

export default function Timer(props: TimerProps) {
  const {
    timer: initialTimer,
    settings,
    activeTimerDialog,
    onSetActiveTimerDialog,
    onUpdateTimers,
  } = props;
  const MAX_TIME = settings.maxMinutes * 60 * 1000; // Convert minutes to milliseconds
  const animationFrameRef = useRef<number | null>(null);

  const {
    timer,
    startTimeRef,
    pausedTimeRef,
    updateTimer: storeUpdateTimer,
    startTimer: storeStartTimer,
    pauseTimer: storePauseTimer,
    resetTimer: storeResetTimer,
    showTimeout,
    hideTimeout,
  } = useTimerStore(initialTimer, {
    reverseMode: settings.reverseMode,
    maxMinutes: settings.maxMinutes,
  });

  // Animation frame for smooth updates
  const updateTimerAnimation = () => {
    if (timer.isRunning && startTimeRef.current) {
      const now = performance.now();
      const elapsed = now - startTimeRef.current + pausedTimeRef.current;

      let newTime: number;
      if (settings.reverseMode && timer.time > 0) {
        // Reverse mode: countdown from current time to 0
        // For countdown, we don't use pausedTimeRef to avoid calculation errors
        const countdownElapsed = now - startTimeRef.current;
        newTime = Math.max(timer.time - countdownElapsed, 0);
      } else {
        // Normal mode: count up from 0 to MAX_TIME
        newTime = Math.min(elapsed, MAX_TIME);
      }

      storeUpdateTimer(newTime);

      if (
        (settings.reverseMode && newTime <= 0) ||
        (!settings.reverseMode && newTime >= MAX_TIME)
      ) {
        // Show timeout for both normal mode completion and reverse mode countdown
        if (
          (settings.reverseMode && newTime <= 0) ||
          (!settings.reverseMode && newTime >= MAX_TIME)
        ) {
          showTimeout(!settings.reverseMode && newTime >= MAX_TIME);
        }
        storePauseTimer();
        startTimeRef.current = null;
        pausedTimeRef.current = 0;
      } else {
        animationFrameRef.current = requestAnimationFrame(updateTimerAnimation);
      }
    }
  };

  useEffect(() => {
    if (timer.isRunning) {
      if (!startTimeRef.current) {
        startTimeRef.current = performance.now();
      }
      animationFrameRef.current = requestAnimationFrame(updateTimerAnimation);
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
  }, [timer.isRunning, timer.id]);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  const remainingTime = MAX_TIME - timer.time;
  const progressPercentage =
    settings.reverseMode && timer.time > 0
      ? (timer.time / MAX_TIME) * 100
      : (timer.time / MAX_TIME) * 100;

  const handleStart = () => {
    if (timer.time < MAX_TIME || (settings.reverseMode && timer.time > 0)) {
      const confirmMessage =
        timer.time === 0
          ? `Are you sure you want to start Player ${timer.id + 1}'s timer?`
          : settings.reverseMode
            ? `Are you sure you want to count down Player ${timer.id + 1}'s timer?`
            : `Are you sure you want to continue Player ${timer.id + 1}'s timer?`;

      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;

      if (!settings.allowMultiTimer) {
        // If multi-timer is not allowed, show dialog for this timer
        onSetActiveTimerDialog(timer.id);
      }
      storeStartTimer();
    }
  };

  const handlePause = () => {
    storePauseTimer();
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

    storeResetTimer();
  };

  const handleDialogClose = () => {
    hideTimeout();
    onSetActiveTimerDialog(null);
  };

  const handleTimeOut = (isNormalModeComplete = false) => {
    showTimeout(isNormalModeComplete);
  };

  const showDialog =
    !settings.allowMultiTimer &&
    activeTimerDialog === timer.id &&
    (timer.isRunning || timer.showTimeOut);

  return (
    <div className="flex w-full items-center gap-4 p-2 border-b">
      <div className="w-16 text-sm font-medium">Player {timer.id + 1}</div>
      <div className="flex-1">
        <div className="w-full bg-gray-200  h-3 mb-1 shadow-inner">
          <div
            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-3 transition-all duration-300 ease-out shadow-lg animate-pulse"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      <div className="w-32 text-center font-mono text-sm">
        <div className="text-xs text-gray-500">
          Used: {formatTime(timer.time)}
        </div>
        <div className="text-xs text-red-600 whitespace-nowrap">
          Remain: {formatTime(remainingTime)}
        </div>
      </div>
      <div className="flex gap-1">
        {!timer.isRunning ? (
          <Button
            onClick={handleStart}
            disabled={
              (!settings.reverseMode && timer.time >= MAX_TIME) ||
              (settings.reverseMode && timer.time === 0)
            }
            variant="ghost"
            size="sm"
          >
            {timer.time === 0
              ? "Start"
              : settings.reverseMode
                ? "Count Down"
                : "Continue"}
          </Button>
        ) : (
          <Button onClick={handlePause} variant="secondary" size="sm">
            Pause
          </Button>
        )}
        <Button
          onClick={handleReset}
          disabled={timer.time === 0}
          variant="ghost"
          size="sm"
        >
          Reset
        </Button>
      </div>

      {/* Large Timer Dialog */}
      {showDialog && (
        <TimerDialog
          playerNumber={timer.id + 1}
          componentState={timer}
          remainingTime={remainingTime}
          onClose={handleDialogClose}
          onTimeOut={handleTimeOut}
          isReverseMode={settings.reverseMode}
        />
      )}
    </div>
  );
}
