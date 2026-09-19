import { get as getStore, set as setStore } from "./setting/settingStore.js";

/**
 * Persist string settings in IndexedDB as a key→value dictionary.
 */
export const TdSettingDict = {
  get(key: string): Promise<string | undefined> {
    return getStore(key);
  },

  set(key: string, value: string): Promise<void> {
    return setStore(key, value);
  },
} as const;
