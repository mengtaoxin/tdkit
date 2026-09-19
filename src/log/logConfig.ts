const DEFAULT_RETAIN_COUNT = 100;
const DEFAULT_RETAIN_DAYS = 30;
const DEFAULT_MAX_CHARS = 65535;

export interface LogConfigState {
  retainCount: number;
  retainDays: number;
  maxChars: number;
}

const state: LogConfigState = {
  retainCount: DEFAULT_RETAIN_COUNT,
  retainDays: DEFAULT_RETAIN_DAYS,
  maxChars: DEFAULT_MAX_CHARS,
};

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be an integer >= 1`);
  }
}

export function getLogConfig(): Readonly<LogConfigState> {
  return state;
}

export function setRetainCount(value: number): void {
  assertPositiveInteger("retainCount", value);
  state.retainCount = value;
}

export function setRetainDays(value: number): void {
  assertPositiveInteger("retainDays", value);
  state.retainDays = value;
}

export function setMaxChars(value: number): void {
  assertPositiveInteger("maxChars", value);
  state.maxChars = value;
}
