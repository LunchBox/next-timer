"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./button";
import TimerDialog from "./timer-dialog";
import {
  TimerProps,
  TimerStorageState,
  TimerComponentState,
} from "../../types/timer";

export default function Timer(props: TimerProps) {
  const {
    cIdx,
    resetSignal,
    maxMinutes,
    allowMultiTimer,
    reverseMode,
    activeTimerDialog,
    onSetActiveTimerDialog,
  } = props;
  const storageKey = `timer-${cIdx}`;
  const MAX_TIME = maxMinutes * 60 * 1000; // Convert minutes to milliseconds
  const [componentState, setComponentState] = useState<TimerComponentState>({
    time: 0,
    isRunning: false,
    isLoaded: false,
    showTimeOut: false,
    isNormalModeComplete: false,
  });
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
        setComponentState((prev) => ({
          ...prev,
          time: parsed.time || 0,
          isRunning: parsed.isRunning || false,
        }));
      } catch (e) {
        // Ignore invalid data
      }
    }
    setComponentState((prev) => ({ ...prev, isLoaded: true }));
  }, [storageKey]);

  // Save state to localStorage whenever it changes (only after initial load)
  useEffect(() => {
    if (componentState.isLoaded) {
      const stateToSave: TimerStorageState = {
        time: componentState.time,
        isRunning: componentState.isRunning,
        startTime: startTimeRef.current,
        pausedTime: pausedTimeRef.current,
        reverseMode,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [
    componentState.time,
    componentState.isRunning,
    storageKey,
    componentState.isLoaded,
    reverseMode,
  ]);

  // Reset timer when resetSignal changes
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      setComponentState((prev) => ({
        ...prev,
        isRunning: false,
        time: 0,
      }));
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
    }
  }, [resetSignal]);

  // Reset paused time when reverse mode changes to prevent calculation errors
  useEffect(() => {
    if (!componentState.isRunning) {
      pausedTimeRef.current = 0;
    }
  }, [reverseMode, componentState.isRunning]);

  // Animation frame for smooth updates
  const updateTimer = () => {
    if (componentState.isRunning && startTimeRef.current) {
      const now = performance.now();
      const elapsed = now - startTimeRef.current + pausedTimeRef.current;

      let newTime: number;
      if (reverseMode && componentState.time > 0) {
        // Reverse mode: countdown from current time to 0
        // For countdown, we don't use pausedTimeRef to avoid calculation errors
        const countdownElapsed = now - startTimeRef.current;
        newTime = Math.max(componentState.time - countdownElapsed, 0);
      } else {
        // Normal mode: count up from 0 to MAX_TIME
        newTime = Math.min(elapsed, MAX_TIME);
      }

      setComponentState((prev) => ({ ...prev, time: newTime }));

      if (
        (reverseMode && newTime <= 0) ||
        (!reverseMode && newTime >= MAX_TIME)
      ) {
        // Show timeout for both normal mode completion and reverse mode countdown
        if (
          (reverseMode && newTime <= 0) ||
          (!reverseMode && newTime >= MAX_TIME)
        ) {
          handleTimeOut(!reverseMode && newTime >= MAX_TIME);
        }
        setComponentState((prev) => ({ ...prev, isRunning: false }));
        startTimeRef.current = null;
        pausedTimeRef.current = 0;
      } else {
        animationFrameRef.current = requestAnimationFrame(updateTimer);
      }
    }
  };

  useEffect(() => {
    if (componentState.isRunning) {
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
  }, [componentState.isRunning]);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  const remainingTime = MAX_TIME - componentState.time;
  const progressPercentage =
    reverseMode && componentState.time > 0
      ? (componentState.time / MAX_TIME) * 100
      : (componentState.time / MAX_TIME) * 100;

  const handleStart = () => {
    if (
      componentState.time < MAX_TIME ||
      (reverseMode && componentState.time > 0)
    ) {
      const confirmMessage =
        componentState.time === 0
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
      setComponentState((prev) => ({ ...prev, isRunning: true }));
    }
  };

  const handlePause = () => {
    setComponentState((prev) => ({ ...prev, isRunning: false }));
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

    setComponentState((prev) => ({
      ...prev,
      isRunning: false,
      time: 0,
    }));
  };

  const handleDialogClose = () => {
    setComponentState((prev) => ({
      ...prev,
      isRunning: false,
      showTimeOut: false,
    }));
    onSetActiveTimerDialog(null);
  };

  const handleTimeOut = (isNormalModeComplete = false) => {
    setComponentState((prev) => ({
      ...prev,
      showTimeOut: true,
      isNormalModeComplete,
      isRunning: false,
    }));
  };

  const showDialog =
    !allowMultiTimer &&
    activeTimerDialog === cIdx &&
    (componentState.isRunning || componentState.showTimeOut);

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
          Used: {formatTime(componentState.time)}
        </div>
        <div className="text-xs text-red-600 whitespace-nowrap">
          Remain: {formatTime(remainingTime)}
        </div>
      </div>
      <div className="flex gap-1">
        {!componentState.isRunning ? (
          <Button
            onClick={handleStart}
            disabled={
              (!reverseMode && componentState.time >= MAX_TIME) ||
              (reverseMode && componentState.time === 0)
            }
            variant="ghost"
            size="sm"
          >
            {componentState.time === 0
              ? "Start"
              : reverseMode
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
          disabled={componentState.time === 0}
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
          componentState={componentState}
          remainingTime={remainingTime}
          onClose={handleDialogClose}
          onTimeOut={handleTimeOut}
          isReverseMode={reverseMode}
        />
      )}
    </div>
  );
}
