import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { TIMER_CONFIG } from "../config/timer";
import { SettingsState } from "../types/timer";

export interface SettingStore {
  settings: SettingsState;
  handleSetMaxMinutes: (minutes: number) => void;
  handleSetPlayerCount: (count: number) => void;
  handleSetAllowMultiTimer: (allow: boolean) => void;
  handleToggleReverseMode: () => Promise<void>;
}

export function useSettingStore(): SettingStore {
  const [maxMinutes, saveMaxMinutes] = useLocalStorage(
    TIMER_CONFIG.STORAGE_KEYS.MAX_MINUTES,
    TIMER_CONFIG.DEFAULT_MAX_MINUTES,
    (v) =>
      typeof v === "number" && v >= 1 && v <= TIMER_CONFIG.MAX_MINUTES_LIMIT,
  );
  const [playerCount, savePlayerCount] = useLocalStorage(
    TIMER_CONFIG.STORAGE_KEYS.PLAYER_COUNT,
    TIMER_CONFIG.DEFAULT_PLAYER_COUNT,
    (v) =>
      typeof v === "number" && v >= 1 && v <= TIMER_CONFIG.MAX_PLAYER_COUNT,
  );
  const [allowMultiTimer, saveAllowMultiTimer] = useLocalStorage(
    TIMER_CONFIG.STORAGE_KEYS.ALLOW_MULTI,
    false,
    (v) => typeof v === "boolean",
  );
  const [reverseMode, saveReverseMode] = useLocalStorage(
    TIMER_CONFIG.STORAGE_KEYS.REVERSE_MODE,
    false,
    (v) => typeof v === "boolean",
  );

  // Memoized settings object to prevent unnecessary re-renders
  const settings: SettingsState = useMemo(
    () => ({
      maxMinutes,
      playerCount,
      allowMultiTimer,
      reverseMode,
    }),
    [maxMinutes, playerCount, allowMultiTimer, reverseMode],
  );

  const handleSetMaxMinutes = (minutes: number) => {
    saveMaxMinutes(minutes as any);

    // Clear all timer data and reset when changing max minutes
    for (let i = 0; i < TIMER_CONFIG.MAX_PLAYER_COUNT; i++) {
      localStorage.removeItem(`timer-${i}`);
    }
  };

  const handleSetPlayerCount = (count: number) => {
    savePlayerCount(count as any);

    // Clear timer data for players beyond the new count
    for (let i = count; i < TIMER_CONFIG.MAX_PLAYER_COUNT; i++) {
      localStorage.removeItem(`timer-${i}`);
    }
  };

  const handleSetAllowMultiTimer = (allow: boolean) => {
    saveAllowMultiTimer(allow);
  };

  const handleToggleReverseMode = async () => {
    const newReverseMode = !reverseMode;
    const action = newReverseMode ? "enable" : "disable";

    // Import tripleConfirm here to avoid circular dependencies
    const { tripleConfirm } = await import("../utils/confirmations");

    const confirmed = await tripleConfirm([
      `Are you sure you want to ${action} reverse mode?`,
      "This will change how timers work.",
      "Confirm to proceed.",
    ]);

    if (!confirmed) return;

    saveReverseMode(newReverseMode);
  };

  return {
    settings,
    handleSetMaxMinutes,
    handleSetPlayerCount,
    handleSetAllowMultiTimer,
    handleToggleReverseMode,
  };
}
