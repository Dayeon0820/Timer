// 설정값을 localStorage 와 동기화하는 훅
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS } from '../lib/defaults';
import { readJSON, writeJSON } from '../lib/storage';

const SETTINGS_KEY = 'focus-timer:settings';

export function useSettings() {
  // 저장된 값 위에 기본값을 깔아서, 새로 추가된 설정 항목도 기본값을 갖도록 함
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...readJSON(SETTINGS_KEY, {}),
  }));

  useEffect(() => {
    writeJSON(SETTINGS_KEY, settings);
  }, [settings]);

  /** 일부 항목만 변경: update({ focusMinutes: 50 }) */
  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const resetToDefault = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  return { settings, update, resetToDefault };
}
