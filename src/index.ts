/**
 * tdkit — browser TypeScript library
 */

export { TdLog } from "./TdLog.js";
export type {
  TdLogLevel,
  TdLogPage,
  TdLogQuery,
  TdLogRecord,
} from "./TdLog.js";
export { TdLogConfig } from "./TdLogConfig.js";

/** Create a DOM element with optional properties. */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<HTMLElementTagNameMap[K]>,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    Object.assign(el, props);
  }
  return el;
}

/** Return a greeting string. */
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
