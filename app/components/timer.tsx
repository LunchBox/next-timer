"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./button";
import TimerDialog from "./timer-dialog";
import { TimerProps, TimerStorageState, TimerState } from "../../types/timer";

export default function Timer(props: TimerProps) {
  const {
    cIdx,
    timerState,
    resetSignal,
    settings,
    activeTimerDialog,
    onSetActiveTimerDialog,
    onUpdateTimerState,
  } = props;
  const storageKey = `timer-${cIdx}`;
  const MAX_TIME = settings.maxMinutes * 60 * 1000; // Convert minutes to milliseconds
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.startTime) {
          // Use the saved reverseMode for correct timing restoration
          const savedReverseMode = parsed.reverseMode || false;
          if (!savedReverseMode) {
            // For normal mode, simulate start time to maintain correct timing after refresh
            startTimeRef.current = performance.now() - parsed.time;
            pausedTimeRef.current = 0;
          } else {
            startTimeRef.current = parsed.startTime;
            pausedTimeRef.current = parsed.pausedTime || 0;
          }
        }
        onUpdateTimerState(cIdx, {
          time: parsed.time || 0,
          isRunning: parsed.isRunning || false,
        });
      } catch (e) {
        // Ignore invalid data
      }
    }
    onUpdateTimerState(cIdx, { isLoaded: true });
  }, [storageKey, cIdx, onUpdateTimerState]);

  // Save state to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (timerState.isLoaded) {
      const stateToSave: TimerStorageState = {
        time: timerState.time,
        isRunning: timerState.isRunning,
        startTime: startTimeRef.current,
        pausedTime: pausedTimeRef.current,
        reverseMode: settings.reverseMode,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [
    timerState.time,
    timerState.isRunning,
    storageKey,
    timerState.isLoaded,
    settings.reverseMode,
  ]);

  // Reset timer when resetSignal changes
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      onUpdateTimerState(cIdx, {
        isRunning: false,
        time: 0,
      });
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
    }
  }, [resetSignal, cIdx, onUpdateTimerState]);

  // Reset paused time when reverse mode changes to prevent calculation errors
  useEffect(() => {
    if (!timerState.isRunning) {
      pausedTimeRef.current = 0;
    }
  }, [settings.reverseMode, timerState.isRunning]);

  // Animation frame for smooth updates
  const updateTimer = () => {
    if (timerState.isRunning && startTimeRef.current) {
      const now = performance.now();
      const elapsed = now - startTimeRef.current + pausedTimeRef.current;

      let newTime: number;
      if (settings.reverseMode && timerState.time > 0) {
        // Reverse mode: countdown from current time to 0
        // For countdown, we don't use pausedTimeRef to avoid calculation errors
        const countdownElapsed = now - startTimeRef.current;
        newTime = Math.max(timerState.time - countdownElapsed, 0);
      } else {
        // Normal mode: count up from 0 to MAX_TIME
        newTime = Math.min(elapsed, MAX_TIME);
      }

      onUpdateTimerState(cIdx, { time: newTime });

      if (
        (settings.reverseMode && newTime <= 0) ||
        (!settings.reverseMode && newTime >= MAX_TIME)
      ) {
        // Show timeout for both normal mode completion and reverse mode countdown
        if (
          (settings.reverseMode && newTime <= 0) ||
          (!settings.reverseMode && newTime >= MAX_TIME)
        ) {
          handleTimeOut(!settings.reverseMode && newTime >= MAX_TIME);
        }
        onUpdateTimerState(cIdx, { isRunning: false });
        startTimeRef.current = null;
        pausedTimeRef.current = 0;
      } else {
        animationFrameRef.current = requestAnimationFrame(updateTimer);
      }
    }
  };

  useEffect(() => {
    if (timerState.isRunning) {
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
  }, [timerState.isRunning, cIdx, onUpdateTimerState]);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  const remainingTime = MAX_TIME - timerState.time;
  const progressPercentage =
    settings.reverseMode && timerState.time > 0
      ? (timerState.time / MAX_TIME) * 100
      : (timerState.time / MAX_TIME) * 100;

  const handleStart = () => {
    if (
      timerState.time < MAX_TIME ||
      (settings.reverseMode && timerState.time > 0)
    ) {
      const confirmMessage =
        timerState.time === 0
          ? `Are you sure you want to start Player ${cIdx + 1}'s timer?`
          : settings.reverseMode
            ? `Are you sure you want to count down Player ${cIdx + 1}'s timer?`
            : `Are you sure you want to continue Player ${cIdx + 1}'s timer?`;

      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;

      if (!settings.allowMultiTimer) {
        // If multi-timer is not allowed, show dialog for this timer
        onSetActiveTimerDialog(cIdx);
      }
      onUpdateTimerState(cIdx, { isRunning: true });
    }
  };

  const handlePause = () => {
    onUpdateTimerState(cIdx, { isRunning: false });
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

    onUpdateTimerState(cIdx, {
      isRunning: false,
      time: 0,
    });
  };

  const handleDialogClose = () => {
    onUpdateTimerState(cIdx, {
      isRunning: false,
      showTimeOut: false,
    });
    onSetActiveTimerDialog(null);
  };

  const handleTimeOut = (isNormalModeComplete = false) => {
    onUpdateTimerState(cIdx, {
      showTimeOut: true,
      isNormalModeComplete,
      isRunning: false,
    });
  };

  const showDialog =
    !settings.allowMultiTimer &&
    activeTimerDialog === cIdx &&
    (timerState.isRunning || timerState.showTimeOut);

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
        <div className="text-xs text-gray-500">
          Used: {formatTime(timerState.time)}
        </div>
        <div className="text-xs text-red-600 whitespace-nowrap">
          Remain: {formatTime(remainingTime)}
        </div>
      </div>
      <div className="flex gap-1">
        {!timerState.isRunning ? (
          <Button
            onClick={handleStart}
            disabled={
              (!settings.reverseMode && timerState.time >= MAX_TIME) ||
              (settings.reverseMode && timerState.time === 0)
            }
            variant="ghost"
            size="sm"
          >
            {timerState.time === 0
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
          disabled={timerState.time === 0}
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
          componentState={timerState}
          remainingTime={remainingTime}
          onClose={handleDialogClose}
          onTimeOut={handleTimeOut}
          isReverseMode={settings.reverseMode}
        />
      )}
    </div>
  );
}
