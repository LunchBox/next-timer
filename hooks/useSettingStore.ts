import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { SETTING } from "../config/setting";
import { SettingState } from "../types/timer";

export interface SettingStore {
  settings: SettingState;
  handleSetMaxMinutes: (minutes: number) => void;
  handleSetPlayerCount: (count: number) => void;
  handleSetAllowMultiTimer: (allow: boolean) => void;
  handleToggleReverseMode: () => Promise<void>;
}

// Helper function to load settings synchronously
function loadSettingsFromStorage(): SettingState {
  if (typeof window === "undefined") {
    return {
      maxMinutes: SETTING.DEFAULT_MAX_MINUTES,
      playerCount: SETTING.DEFAULT_PLAYER_COUNT,
      allowMultiTimer: false,
      reverseMode: false,
    };
  }

  const maxMinutes = (() => {
    try {
      const saved = localStorage.getItem(SETTING.STORAGE_KEYS.MAX_MINUTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed === "number" &&
          parsed >= 1 &&
          parsed <= SETTING.MAX_MINUTES_LIMIT
        ) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore invalid data
    }
    return SETTING.DEFAULT_MAX_MINUTES;
  })();

  const playerCount = (() => {
    try {
      const saved = localStorage.getItem(SETTING.STORAGE_KEYS.PLAYER_COUNT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed === "number" &&
          parsed >= 1 &&
          parsed <= SETTING.MAX_PLAYER_COUNT
        ) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore invalid data
    }
    return SETTING.DEFAULT_PLAYER_COUNT;
  })();

  const allowMultiTimer = (() => {
    try {
      const saved = localStorage.getItem(SETTING.STORAGE_KEYS.ALLOW_MULTI);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === "boolean") {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore invalid data
    }
    return false;
  })();

  const reverseMode = (() => {
    try {
      const saved = localStorage.getItem(SETTING.STORAGE_KEYS.REVERSE_MODE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === "boolean") {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore invalid data
    }
    return false;
  })();

  return {
    maxMinutes,
    playerCount,
    allowMultiTimer,
    reverseMode,
  };
}

export function useSettingStore(): SettingStore {
  // Load settings synchronously for initial render
  const initialSettings = useMemo(() => loadSettingsFromStorage(), []);
  const [maxMinutes, saveMaxMinutes] = useLocalStorage(
    SETTING.STORAGE_KEYS.MAX_MINUTES,
    initialSettings.maxMinutes,
    (v) => typeof v === "number" && v >= 1 && v <= SETTING.MAX_MINUTES_LIMIT,
  );
  const [playerCount, savePlayerCount] = useLocalStorage(
    SETTING.STORAGE_KEYS.PLAYER_COUNT,
    initialSettings.playerCount,
    (v) => typeof v === "number" && v >= 1 && v <= SETTING.MAX_PLAYER_COUNT,
  );
  const [allowMultiTimer, saveAllowMultiTimer] = useLocalStorage(
    SETTING.STORAGE_KEYS.ALLOW_MULTI,
    initialSettings.allowMultiTimer,
    (v) => typeof v === "boolean",
  );
  const [reverseMode, saveReverseMode] = useLocalStorage(
    SETTING.STORAGE_KEYS.REVERSE_MODE,
    initialSettings.reverseMode,
    (v) => typeof v === "boolean",
  );

  // Prevent settings from changing after initial load to avoid recreating timer stores
  const stableSettings = useMemo(
    () => ({
      maxMinutes,
      playerCount,
      allowMultiTimer,
      reverseMode,
    }),
    [],
  ); // Empty dependency array - only use initial values

  // Memoized settings object to prevent unnecessary re-renders
  const settings: SettingState = useMemo(
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
    for (let i = 0; i < SETTING.MAX_PLAYER_COUNT; i++) {
      localStorage.removeItem(`timer-${i}`);
    }
  };

  const handleSetPlayerCount = (count: number) => {
    savePlayerCount(count as any);

    // Clear timer data for players beyond the new count
    for (let i = count; i < SETTING.MAX_PLAYER_COUNT; i++) {
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
