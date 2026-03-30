"use client";

import Button from "./button";
import TimerDialog from "./timer-dialog";
import { TimerProps } from "../../types/timer";
import { tripleConfirm } from "../../utils/confirmations";

/**
 * 計時器組件
 * 顯示單個玩家的計時器，包含進度條、時間顯示和控制按鈕
 */
export default function Timer(props: TimerProps) {
  const {
    timer,
    settings,
    activeTimerDialog,
    onSetActiveTimerDialog,
    onStartTimer,
    onPauseTimer,
    onResetTimer,
    onShowTimeout,
    onHideTimeout,
  } = props;

  // 將分鐘轉換為毫秒
  const MAX_TIME = settings.maxMinutes * 60 * 1000;

  /**
   * 格式化時間顯示
   * 轉換毫秒為 MM:SS.CC 格式
   */
  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  // 計算剩餘時間和進度百分比
  const remainingTime = MAX_TIME - timer.time;
  const progressPercentage =
    settings.reverseMode && timer.time > 0
      ? (timer.time / MAX_TIME) * 100 // 反向模式：顯示剩餘時間比例
      : (timer.time / MAX_TIME) * 100; // 正常模式：顯示已用時間比例

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
      onStartTimer(timer.id);
    }
  };

  const handlePause = () => {
    onPauseTimer(timer.id);
  };

  const handleReset = async () => {
    const confirmed = await tripleConfirm([
      "Are you sure you want to reset this timer?",
      "Confirm again: This will clear all time records!",
      "Final confirmation: Data cannot be recovered after reset, proceed?",
    ]);

    if (!confirmed) return;

    onResetTimer(timer.id);
  };

  const handleDialogClose = () => {
    // 當關閉 dialog 時，如果計時器正在運行，需要先暫停它
    if (timer.isRunning) {
      onPauseTimer(timer.id);
    }
    onHideTimeout(timer.id);
    onSetActiveTimerDialog(null);
  };

  const handleTimeOut = (isNormalModeComplete = false) => {
    onShowTimeout(timer.id, isNormalModeComplete);
  };

  const showDialog =
    !settings.allowMultiTimer &&
    activeTimerDialog === timer.id &&
    (timer.isRunning || timer.showTimeOut);

  return (
    <div className="w-full grid grid-cols-[4rem_1fr_8rem_9rem] gap-4 items-center p-2 border-b">
      <div className="text-sm font-medium">Player {timer.id + 1}</div>
      <div className="min-w-4">
        <div className="w-full bg-gray-200 h-3 mb-1 shadow-inner">
          <div
            className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-3 shadow-lg"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      <div className="text-right font-mono text-sm">
        <div className="text-xs text-gray-500">
          Used: {formatTime(timer.time)}
        </div>
        <div className="text-xs text-red-600 whitespace-nowrap">
          Remain: {formatTime(remainingTime)}
        </div>
      </div>
      <div className="flex gap-1 justify-end text-right">
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
