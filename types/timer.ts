export interface TimerStorageState {
  time: number;
  isRunning: boolean;
  startTime: number | null;
  pausedTime: number;
  reverseMode: boolean;
}

export interface TimerComponentState {
  time: number;
  isRunning: boolean;
  isLoaded: boolean;
  showTimeOut: boolean;
  isNormalModeComplete: boolean;
}

export interface TimerProps {
  cIdx: number;
  resetSignal?: number;
  maxMinutes: number;
  allowMultiTimer: boolean;
  reverseMode: boolean;
  activeTimerDialog: number | null;
  onSetActiveTimerDialog: (timerId: number | null) => void;
}
