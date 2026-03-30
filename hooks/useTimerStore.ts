import { useState, useEffect, useRef, useCallback } from "react";
import { TimerState, TimerStorageState } from "../types/timer";

/**
 * 計時器 Store 接口
 * 定義單個計時器的狀態和操作方法
 */
export interface TimerStore {
  timer: TimerState; // 當前計時器狀態
  startTimeRef: React.MutableRefObject<number | null>; // 開始時間引用
  pausedTimeRef: React.MutableRefObject<number>; // 累計暫停時間引用
  updateTimer: (newTime: number) => void; // 更新計時器時間
  startTimer: () => void; // 啟動計時器
  pauseTimer: () => void; // 暫停計時器
  resetTimer: () => void; // 重置計時器
  showTimeout: (isNormalModeComplete?: boolean) => void; // 顯示超時狀態
  hideTimeout: () => void; // 隱藏超時狀態
  setLoaded: () => void; // 標記為已載入
}

/**
 * 安全地從 localStorage 載入計時器數據
 * @param storageKey 存儲鍵
 * @returns 計時器存儲狀態或 null
 */
function loadTimerFromStorage(storageKey: string): TimerStorageState | null {
  // SSR 環境下不進行 localStorage 操作
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as TimerStorageState;

    // 基本資料驗證
    if (
      typeof parsed.time !== "number" ||
      typeof parsed.isRunning !== "boolean"
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(`載入計時器數據失敗 ${storageKey}:`, error);
    return null;
  }
}

/**
 * 安全地將計時器數據保存到 localStorage
 * @param storageKey 存儲鍵
 * @param state 要保存的狀態
 */
function saveTimerToStorage(
  storageKey: string,
  state: TimerStorageState,
): void {
  // SSR 環境下不進行 localStorage 操作
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn(`保存計時器數據失敗 ${storageKey}:`, error);
  }
}

/**
 * 單個計時器的自定義 Hook
 * 處理計時邏輯、狀態管理和持久化存儲
 * @param initialTimer 初始計時器狀態
 * @param settings 計時器設定（反向模式、最大分鐘數）
 * @returns TimerStore 對象，包含狀態和操作方法
 */
export function useTimerStore(
  initialTimer: TimerState,
  settings: { reverseMode: boolean; maxMinutes: number },
): TimerStore {
  // 存儲鍵和最大時間計算
  const storageKey = `timer-${initialTimer.id}`;
  const MAX_TIME = settings.maxMinutes * 60 * 1000; // 轉換為毫秒

  // 計時計算用的引用（ref）- 避免不必要的重新渲染
  const startTimeRef = useRef<number | null>(null); // 開始時間
  const pausedTimeRef = useRef(0); // 累計暫停時間
  const initialTimeRef = useRef(0); // 初始時間
  const animationFrameRef = useRef<number | null>(null); // 動畫幀引用

  // 初始化狀態 - 為 SSR 兼容性設置未載入狀態
  const [timer, setTimer] = useState<TimerState>(() => ({
    ...initialTimer,
    isLoaded: false, // 初始設置為未載入
  }));

  /**
   * 組件掛載時載入持久化數據
   * 從 localStorage 恢復計時器狀態，只執行一次
   */
  useEffect(() => {
    const savedData = loadTimerFromStorage(storageKey);

    if (savedData) {
      // 從存儲恢復計時器狀態
      const restoredTimer: TimerState = {
        ...initialTimer,
        time: savedData.time,
        isRunning: false, // 總是從暫停狀態開始，需要時再恢復
        isLoaded: true,
      };

      setTimer(restoredTimer);

      // 如果保存時正在運行，準備恢復運行狀態
      if (savedData.isRunning && savedData.startTime) {
        const savedReverseMode = savedData.reverseMode || false;

        if (!savedReverseMode) {
          // 正常模式：基於經過時間模擬開始時間
          startTimeRef.current = performance.now() - savedData.time;
          pausedTimeRef.current = savedData.pausedTime || 0;
          initialTimeRef.current = 0;
        } else {
          // 反向模式：恢復精確的計時狀態
          startTimeRef.current = savedData.startTime;
          pausedTimeRef.current = savedData.pausedTime || 0;
          initialTimeRef.current = savedData.time;
        }

        // 自動恢復運行狀態（輕微延遲確保狀態已設置）
        setTimeout(() => {
          setTimer((prev) => ({ ...prev, isRunning: true }));
        }, 0);
      } else {
        // 計時器未運行，只設置初始時間
        initialTimeRef.current = savedData.time;
      }
    } else {
      // 沒有保存數據，使用默認值標記為已載入
      setTimer((prev) => ({ ...prev, isLoaded: true }));
      initialTimeRef.current = 0;
    }
    // 只依賴 storageKey - initialTimer 應該是穩定的
  }, [storageKey]);

  /**
   * 計時器狀態改變時保存到 localStorage
   * 只在載入完成後保存
   */
  useEffect(() => {
    if (!timer.isLoaded) return;

    const stateToSave: TimerStorageState = {
      time: timer.time,
      isRunning: timer.isRunning,
      startTime: startTimeRef.current,
      pausedTime: pausedTimeRef.current,
      reverseMode: settings.reverseMode,
    };

    saveTimerToStorage(storageKey, stateToSave);
  }, [timer, settings.reverseMode, storageKey]);

  /**
   * 計時器更新循環函數
   * 使用 requestAnimationFrame 實現平滑的計時更新
   * 與狀態依賴分離以防止無限循環
   */
  const updateTimerLoop = useCallback(() => {
    // 通過 ref 檢查當前運行狀態，避免依賴問題
    const isCurrentlyRunning = startTimeRef.current !== null;

    if (!isCurrentlyRunning) return;

    const now = performance.now();
    // 計算經過時間：當前時間 - 開始時間 - 累計暫停時間
    const elapsed = now - startTimeRef.current! - pausedTimeRef.current;

    let newTime: number;
    let shouldTimeout = false;
    let isNormalModeComplete = false;

    if (settings.reverseMode) {
      // 反向模式：從初始時間倒計時
      newTime = Math.max(0, initialTimeRef.current - elapsed);
      if (newTime <= 0) {
        shouldTimeout = true;
        isNormalModeComplete = true;
      }
    } else {
      // 正常模式：從初始時間正計時
      newTime = initialTimeRef.current + elapsed;
      if (newTime >= MAX_TIME) {
        shouldTimeout = true;
        isNormalModeComplete = false;
      }
    }

    if (shouldTimeout) {
      // 停止計時器並顯示超時狀態
      setTimer((prev) => ({
        ...prev,
        time: settings.reverseMode ? 0 : MAX_TIME,
        isRunning: false,
        showTimeOut: true,
        isNormalModeComplete,
      }));
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
      animationFrameRef.current = null;
      return;
    }

    // 只在仍然運行時更新時間（防止暫停後的更新）
    if (startTimeRef.current !== null) {
      setTimer((prev) => ({ ...prev, time: newTime }));

      // 只有在仍然運行時繼續動畫循環
      animationFrameRef.current = requestAnimationFrame(updateTimerLoop);
    }
  }, [settings.reverseMode, MAX_TIME]);

  // Handle timer start/pause state changes
  useEffect(() => {
    if (timer.isRunning) {
      // Starting timer
      if (startTimeRef.current === null) {
        // First time start - capture current time as start time
        startTimeRef.current = performance.now();
        pausedTimeRef.current = 0;
        initialTimeRef.current = timer.time;
      }
      // Start animation loop if not already running
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(updateTimerLoop);
      }
    } else {
      // Pausing timer
      if (startTimeRef.current !== null) {
        // Accumulate paused time
        pausedTimeRef.current += performance.now() - startTimeRef.current;
        startTimeRef.current = null;
      }
      // Cancel animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [timer.isRunning, updateTimerLoop]);

  // Action functions
  const updateTimer = useCallback((newTime: number) => {
    setTimer((prev) => ({ ...prev, time: newTime }));
  }, []);

  const startTimer = useCallback(() => {
    setTimer((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const pauseTimer = useCallback(() => {
    // Immediately update timing refs to prevent any further updates
    if (startTimeRef.current !== null) {
      pausedTimeRef.current += performance.now() - startTimeRef.current;
      startTimeRef.current = null;
    }

    setTimer((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resetTimer = useCallback(() => {
    // Clear timing refs
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    initialTimeRef.current = 0;

    // Clear storage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn(`Failed to clear timer data for ${storageKey}:`, error);
      }
    }

    // Reset state
    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      time: 0,
      showTimeOut: false,
      isNormalModeComplete: false,
    }));
  }, [storageKey]);

  const showTimeout = useCallback((isNormalModeComplete = false) => {
    setTimer((prev) => ({
      ...prev,
      showTimeOut: true,
      isNormalModeComplete,
      isRunning: false,
    }));
  }, []);

  const hideTimeout = useCallback(() => {
    setTimer((prev) => ({
      ...prev,
      showTimeOut: false,
    }));
  }, []);

  const setLoaded = useCallback(() => {
    setTimer((prev) => ({ ...prev, isLoaded: true }));
  }, []);

  return {
    timer,
    startTimeRef,
    pausedTimeRef,
    updateTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    showTimeout,
    hideTimeout,
    setLoaded,
  };
}

/**
 * 多計時器管理 Hook
 * 根據指定數量創建對應的計時器實例
 * @param count 計時器數量
 * @param settings 計時器設定
 * @returns TimerStore 數組
 */
export function useTimerStores(
  count: number,
  settings: { reverseMode: boolean; maxMinutes: number },
): TimerStore[] {
  return Array.from({ length: count }, (_, i) =>
    useTimerStore(
      {
        id: i,
        time: 0,
        isRunning: false,
        isLoaded: false,
        showTimeOut: false,
        isNormalModeComplete: false,
      },
      settings,
    ),
  );
}
