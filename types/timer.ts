export interface TimerState {
  time: number;
  isRunning: boolean;
  startTime: number | null;
  pausedTime: number;
  reverseMode: boolean;
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
