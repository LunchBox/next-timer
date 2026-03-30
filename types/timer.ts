export interface TimerStorageState {
  time: number;
  isRunning: boolean;
  startTime: number | null;
  pausedTime: number;
  reverseMode: boolean;
}

export interface TimerState {
  time: number;
  isRunning: boolean;
  isLoaded: boolean;
  showTimeOut: boolean;
  isNormalModeComplete: boolean;
}

export interface TimerSettingsState {
  maxMinutes: number;
  playerCount: number;
  allowMultiTimer: boolean;
  reverseMode: boolean;
}

export interface TimerProps {
  cIdx: number;
  timerState: TimerState;
  resetSignal?: number;
  settings: TimerSettingsState;
  activeTimerDialog: number | null;
  onSetActiveTimerDialog: (timerId: number | null) => void;
  onUpdateTimerState: (cIdx: number, updates: Partial<TimerState>) => void;
}
