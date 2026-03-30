"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./button";
import TimerDialog from "./timer-dialog";
import { TimerProps, TimerStorageState, TimerState } from "../../types/timer";
import { useTimerStore } from "../../hooks/useTimerStore";
import { tripleConfirm } from "../../utils/confirmations";

export default function Timer(props: TimerProps) {
  const {
    timer: initialTimer,
    settings,
    activeTimerDialog,
    onSetActiveTimerDialog,
  } = props;
  const MAX_TIME = settings.maxMinutes * 60 * 1000; // Convert minutes to milliseconds

  const {
    timer,
    startTimer: storeStartTimer,
    pauseTimer: storePauseTimer,
    resetTimer: storeResetTimer,
    showTimeout,
    hideTimeout,
  } = useTimerStore(initialTimer, {
    reverseMode: settings.reverseMode,
    maxMinutes: settings.maxMinutes,
  });

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

  const handleReset = async () => {
    const confirmed = await tripleConfirm([
      "Are you sure you want to reset this timer?",
      "Confirm again: This will clear all time records!",
      "Final confirmation: Data cannot be recovered after reset, proceed?",
    ]);

    if (!confirmed) return;

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
            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-3 shadow-lg"
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
