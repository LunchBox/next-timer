export const SETTING = {
  DEFAULT_MAX_MINUTES: 15,
  DEFAULT_PLAYER_COUNT: 10,
  MAX_MINUTES_LIMIT: 60,
  MAX_PLAYER_COUNT: 20,
  STORAGE_KEYS: {
    MAX_MINUTES: "timer-max-minutes",
    PLAYER_COUNT: "timer-player-count",
    ALLOW_MULTI: "timer-allow-multi-timer",
    REVERSE_MODE: "timer-reverse-mode",
  },
} as const;

export type GlobalSetting = typeof SETTING;
