import {
  append,
  clean as cleanStore,
  query as queryStore,
  type TdLogLevel,
  type TdLogPage,
  type TdLogQuery,
  type TdLogRecord,
} from "./log/logStore.js";

export type { TdLogLevel, TdLogPage, TdLogQuery, TdLogRecord };

/**
 * Persist structured log entries in IndexedDB for later inspection.
 *
 * Retention and truncation are controlled by {@link TdLogConfig}.
 */
export const TdLog = {
  info(message: string): Promise<void> {
    return append("info", message);
  },

  warn(message: string): Promise<void> {
    return append("warn", message);
  },

  error(message: string): Promise<void> {
    return append("error", message);
  },

  /** Delete all stored log entries. Does not change configuration. */
  clean(): Promise<void> {
    return cleanStore();
  },

  /** Query stored entries with optional keyword filter and pagination. */
  query(queryOptions?: TdLogQuery): Promise<TdLogPage> {
    return queryStore(queryOptions);
  },
} as const;
