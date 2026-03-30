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

export interface SettingsState {
  maxMinutes: number;
  playerCount: number;
  allowMultiTimer: boolean;
  reverseMode: boolean;
}

export interface TimerProps {
  timer: TimerState;
  settings: SettingsState;
  activeTimerDialog: number | null;
  onSetActiveTimerDialog: (timerId: number | null) => void;
}
