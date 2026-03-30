export interface TimerStorageState {
  time: number;
  isRunning: boolean;
  startTime: number | null;
  pausedTime: number;
  reverseMode: boolean;
}

// state of each player's timer
export interface TimerState {
  id: number;
  time: number;
  isRunning: boolean;
  isLoaded: boolean;
  showTimeOut: boolean;
  isNormalModeComplete: boolean;
}

export interface SettingState {
  maxMinutes: number;
  playerCount: number;
  allowMultiTimer: boolean;
  reverseMode: boolean;
}

export interface TimerProps {
  timer: TimerState;
  settings: SettingState;
  activeTimerDialog: number | null;
  onSetActiveTimerDialog: (timerId: number | null) => void;
  onStartTimer: (timerId: number) => void;
  onPauseTimer: (timerId: number) => void;
  onResetTimer: (timerId: number) => void;
  onShowTimeout: (timerId: number, isNormalModeComplete?: boolean) => void;
  onHideTimeout: (timerId: number) => void;
}
