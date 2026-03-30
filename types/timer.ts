/**
 * 計時器持久化存儲狀態
 * 用於在 localStorage 中保存和恢復計時器數據
 */
export interface TimerStorageState {
  time: number; // 當前時間（毫秒）
  isRunning: boolean; // 是否正在運行
  startTime: number | null; // 開始時間戳
  pausedTime: number; // 累計暫停時間
  reverseMode: boolean; // 是否為反向模式
}

/**
 * 單個計時器的完整狀態
 * 包含所有運行時需要的狀態信息
 */
export interface TimerState {
  id: number; // 計時器唯一標識符
  time: number; // 當前時間（毫秒）
  isRunning: boolean; // 是否正在運行
  isLoaded: boolean; // 是否已從存儲載入數據
  showTimeOut: boolean; // 是否顯示超時對話框
  isNormalModeComplete: boolean; // 正常模式是否完成
}

/**
 * 應用設定狀態
 * 包含所有用戶可配置的設定項
 */
export interface SettingState {
  maxMinutes: number; // 最大計時分鐘數
  playerCount: number; // 玩家數量
  allowMultiTimer: boolean; // 是否允許多計時器同時運行
  reverseMode: boolean; // 是否啟用反向計時模式
}

/**
 * 計時器組件屬性接口
 * 定義 Timer 組件需要的所有屬性和回調函數
 */
export interface TimerProps {
  timer: TimerState; // 計時器狀態
  settings: SettingState; // 應用設定
  activeTimerDialog: number | null; // 活躍的計時器對話框 ID
  onSetActiveTimerDialog: (timerId: number | null) => void; // 設置活躍對話框
  onStartTimer: (timerId: number) => void; // 啟動計時器
  onPauseTimer: (timerId: number) => void; // 暫停計時器
  onResetTimer: (timerId: number) => void; // 重置計時器
  onShowTimeout: (timerId: number, isNormalModeComplete?: boolean) => void; // 顯示超時
  onHideTimeout: (timerId: number) => void; // 隱藏超時
}
