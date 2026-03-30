import { TimerState } from "@/types/timer";

export function createDefaultTimer(): TimerState {
  return {
    id: 0,
    time: 0,
    isRunning: false,
    isLoaded: false,
    showTimeOut: false,
    isNormalModeComplete: false,
  };
}

export function updateTimerState(
  timers: TimerState[],
  timerId: number,
  updates: Partial<TimerState>,
): TimerState[] {
  return timers.map((timer) =>
    timer.id === timerId ? { ...timer, ...updates } : timer,
  );
}

export function startTimer(
  timers: TimerState[],
  timerId: number,
): TimerState[] {
  return updateTimerState(timers, timerId, { isRunning: true });
}

export function pauseTimer(
  timers: TimerState[],
  timerId: number,
): TimerState[] {
  return updateTimerState(timers, timerId, { isRunning: false });
}

export function resetTimer(
  timers: TimerState[],
  timerId: number,
): TimerState[] {
  return updateTimerState(timers, timerId, {
    isRunning: false,
    time: 0,
    showTimeOut: false,
    isNormalModeComplete: false,
  });
}

export function setTimerTime(
  timers: TimerState[],
  timerId: number,
  time: number,
): TimerState[] {
  return updateTimerState(timers, timerId, { time });
}

export function showTimerTimeout(
  timers: TimerState[],
  timerId: number,
  isNormalModeComplete = false,
): TimerState[] {
  return updateTimerState(timers, timerId, {
    showTimeOut: true,
    isNormalModeComplete,
    isRunning: false,
  });
}

export function hideTimerTimeout(
  timers: TimerState[],
  timerId: number,
): TimerState[] {
  return updateTimerState(timers, timerId, {
    showTimeOut: false,
  });
}

export function setTimerLoaded(
  timers: TimerState[],
  timerId: number,
): TimerState[] {
  return updateTimerState(timers, timerId, { isLoaded: true });
}
