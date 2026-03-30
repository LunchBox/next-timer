import { useState, useEffect } from "react";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  validator?: (value: any) => boolean,
): [T, (newValue: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (!validator || validator(parsed)) {
            setValue(parsed);
          }
        } catch (e) {
          // 忽略無效數據
        }
      }
    }
  }, [key, validator]);

  const saveValue = (newValue: T) => {
    setValue(newValue);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Failed to save to localStorage for key "${key}":`, error);
      }
    }
  };

  return [value, saveValue] as const;
}
