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
  timer: TimerState,
  updates: Partial<TimerState>,
): TimerState {
  return { ...timer, ...updates };
}

export function startTimer(timer: TimerState): TimerState {
  return updateTimerState(timer, { isRunning: true });
}

export function pauseTimer(timer: TimerState): TimerState {
  return updateTimerState(timer, { isRunning: false });
}

export function resetTimer(timer: TimerState): TimerState {
  return updateTimerState(timer, {
    isRunning: false,
    time: 0,
    showTimeOut: false,
    isNormalModeComplete: false,
  });
}

export function setTimerTime(timer: TimerState, time: number): TimerState {
  return updateTimerState(timer, { time });
}

export function showTimerTimeout(
  timer: TimerState,
  isNormalModeComplete = false,
): TimerState {
  return updateTimerState(timer, {
    showTimeOut: true,
    isNormalModeComplete,
    isRunning: false,
  });
}

export function hideTimerTimeout(timer: TimerState): TimerState {
  return updateTimerState(timer, {
    showTimeOut: false,
  });
}

export function setTimerLoaded(timer: TimerState): TimerState {
  return updateTimerState(timer, { isLoaded: true });
}

// Utility function to update a timer in an array
export function updateTimerInArray(
  timers: TimerState[],
  timerId: number,
  updateFn: (timer: TimerState) => TimerState,
): TimerState[] {
  return timers.map((timer) =>
    timer.id === timerId ? updateFn(timer) : timer,
  );
}
