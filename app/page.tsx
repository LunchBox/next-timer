"use client";

import { useState, useEffect, useMemo } from "react";
import TimerComponent from "./components/timer";
import Button from "./components/button";
import TimerSettings from "./components/timer-settings";
import { useSettingStore } from "../hooks/useSettingStore";
import { useTimerStores } from "../hooks/useTimerStore";
import { tripleConfirm } from "../utils/confirmations";

/**
 * 主頁面組件 - 多玩家計時器應用
 * 負責管理所有計時器的狀態和用戶交互
 */
export default function Home() {
  // 從設定 store 獲取設定和處理函數
  const {
    settings,
    handleSetMaxMinutes,
    handleSetPlayerCount,
    handleSetAllowMultiTimer,
    handleToggleReverseMode,
  } = useSettingStore();

  // 創建穩定的計時器設定對象，避免不必要的重新渲染
  // 只有當 reverseMode 或 maxMinutes 改變時才重新創建
  const stableTimerSettings = useMemo(
    () => ({
      reverseMode: settings.reverseMode,
      maxMinutes: settings.maxMinutes,
    }),
    [settings.reverseMode, settings.maxMinutes],
  );

  // UI 狀態管理
  const [showSettings, setShowSettings] = useState(false); // 設定面板顯示狀態
  const [activeTimerDialog, setActiveTimerDialog] = useState<number | null>(
    null,
  ); // 活躍的計時器對話框
  const [globalPause, setGlobalPause] = useState(false); // 全域暫停狀態
  const [isClient, setIsClient] = useState(false); // 客戶端掛載狀態，用於防止 hydration 不匹配

  // 防止 SSR hydration 不匹配 - 只在客戶端渲染動態內容
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化所有計時器 store
  // 根據玩家數量和設定創建對應的計時器實例
  const timerStores = useTimerStores(settings.playerCount, stableTimerSettings);

  /**
   * 全域暫停/恢復處理函數
   * 切換所有計時器的運行狀態
   */
  const handleGlobalPause = () => {
    const newGlobalPause = !globalPause;
    setGlobalPause(newGlobalPause);

    // 根據全域暫停狀態暫停或恢復所有計時器
    if (newGlobalPause) {
      timerStores.forEach((store) => store.pauseTimer());
    }
  };

  /**
   * 重置所有計時器處理函數
   * 使用三重確認確保用戶真的要清除所有數據
   */
  const handleResetAll = async () => {
    const confirmed = await tripleConfirm([
      "Are you sure you want to reset all timers?",
      "Confirm again: This will clear all player time records!",
      "Final confirmation: Data cannot be recovered after reset, proceed?",
    ]);

    if (!confirmed) return;

    // 使用 store 方法重置所有計時器
    timerStores.forEach((store) => store.resetTimer());
  };

  /**
   * 多計時器設定包裝函數
   * 當禁用多計時器時，自動關閉活躍的對話框
   */
  const handleSetAllowMultiTimerWrapper = (allow: boolean) => {
    handleSetAllowMultiTimer(allow);

    // 如果禁用多計時器，關閉任何活躍的對話框
    if (!allow) {
      setActiveTimerDialog(null);
    }
  };

  /**
   * 反向模式切換包裝函數
   * 在切換模式前先暫停所有運行中的計時器，確保狀態一致性
   */
  const handleToggleReverseModeWrapper = () => {
    // 在切換反向模式前暫停所有運行中的計時器
    const pauseAllTimers = () => {
      timerStores.forEach((store) => {
        if (store.timer.isRunning) {
          store.pauseTimer();
        }
      });
    };

    handleToggleReverseMode(pauseAllTimers);
  };

  /**
   * 啟動指定計時器
   * @param timerId 計時器 ID
   */
  const handleStartTimer = (timerId: number) => {
    if (timerStores[timerId]) {
      timerStores[timerId].startTimer();
    }
  };

  /**
   * 暫停指定計時器
   * @param timerId 計時器 ID
   */
  const handlePauseTimer = (timerId: number) => {
    if (timerStores[timerId]) {
      timerStores[timerId].pauseTimer();
    }
  };

  /**
   * 重置指定計時器
   * @param timerId 計時器 ID
   */
  const handleResetTimer = (timerId: number) => {
    if (timerStores[timerId]) {
      timerStores[timerId].resetTimer();
    }
  };

  /**
   * 顯示計時器超時狀態
   * @param timerId 計時器 ID
   * @param isNormalModeComplete 是否為正常模式完成
   */
  const handleShowTimeout = (timerId: number, isNormalModeComplete = false) => {
    if (timerStores[timerId]) {
      timerStores[timerId].showTimeout(isNormalModeComplete);
    }
  };

  /**
   * 隱藏計時器超時狀態
   * @param timerId 計時器 ID
   */
  const handleHideTimeout = (timerId: number) => {
    if (timerStores[timerId]) {
      timerStores[timerId].hideTimeout();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-8 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl mb-6">Just another Timer</h1>

        {/* Control Buttons */}
        <div className="w-full mb-2 flex gap-2">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="secondary"
            size="sm"
          >
            {showSettings ? "Hide Settings" : "Show Settings"}
          </Button>
          <Button onClick={handleGlobalPause} variant="secondary" size="sm">
            {globalPause ? "Resume All" : "Pause All"}
          </Button>
          <Button onClick={handleResetAll} variant="danger" size="sm">
            Reset All Timers
          </Button>
          {isClient && (
            <Button
              onClick={handleToggleReverseModeWrapper}
              variant={settings.reverseMode ? "primary" : "ghost"}
              size="sm"
            >
              {settings.reverseMode ? "Reverse Mode: ON" : "Reverse Mode: OFF"}
            </Button>
          )}
        </div>

        {/* Settings Form */}
        {showSettings && (
          <TimerSettings
            maxMinutes={settings.maxMinutes}
            playerCount={settings.playerCount}
            allowMultiTimer={settings.allowMultiTimer}
            onSetMaxMinutes={handleSetMaxMinutes}
            onSetPlayerCount={handleSetPlayerCount}
            onSetAllowMultiTimer={handleSetAllowMultiTimerWrapper}
          />
        )}

        {/* Timers - only render on client to prevent hydration mismatch */}
        {isClient &&
          timerStores.map((store, i: number) => (
            <TimerComponent
              key={store.timer.id}
              timer={store.timer}
              settings={settings}
              activeTimerDialog={activeTimerDialog}
              onSetActiveTimerDialog={setActiveTimerDialog}
              onStartTimer={handleStartTimer}
              onPauseTimer={handlePauseTimer}
              onResetTimer={handleResetTimer}
              onShowTimeout={handleShowTimeout}
              onHideTimeout={handleHideTimeout}
            />
          ))}
      </main>
    </div>
  );
}
