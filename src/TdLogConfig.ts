import {
  setMaxChars,
  setRetainCount,
  setRetainDays,
} from "./log/logConfig.js";

/**
 * Runtime configuration for {@link TdLog} retention and message truncation.
 *
 * Changes take effect on the next write or query; existing messages are not
 * re-truncated when `maxChars` is lowered.
 */
export const TdLogConfig = {
  /** Keep at most the newest `count` log entries. Default: 100. */
  retainCount(count: number): void {
    setRetainCount(count);
  },

  /** Keep entries for at most `days` days (days × 24h). Default: 30. */
  retainDays(days: number): void {
    setRetainDays(days);
  },

  /**
   * Truncate each message to at most `chars` UTF-16 code units before saving.
   * Default: 65535.
   */
  maxChars(chars: number): void {
    setMaxChars(chars);
  },
} as const;
