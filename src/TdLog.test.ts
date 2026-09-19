import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TdLog } from "./TdLog.js";
import { TdLogConfig } from "./TdLogConfig.js";

async function resetPublicState(): Promise<void> {
  TdLogConfig.retainCount(100);
  TdLogConfig.retainDays(30);
  TdLogConfig.maxChars(65535);
  await TdLog.clean();
}

describe("TdLogConfig", () => {
  beforeEach(async () => {
    await resetPublicState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects non-positive or non-integer retainCount", () => {
    expect(() => TdLogConfig.retainCount(0)).toThrow(RangeError);
    expect(() => TdLogConfig.retainCount(1.5)).toThrow(RangeError);
    expect(() => TdLogConfig.retainCount(-1)).toThrow(RangeError);
  });

  it("rejects non-positive or non-integer retainDays", () => {
    expect(() => TdLogConfig.retainDays(0)).toThrow(RangeError);
    expect(() => TdLogConfig.retainDays(2.2)).toThrow(RangeError);
  });

  it("rejects non-positive or non-integer maxChars", () => {
    expect(() => TdLogConfig.maxChars(0)).toThrow(RangeError);
    expect(() => TdLogConfig.maxChars(3.14)).toThrow(RangeError);
  });
});

describe("TdLog", () => {
  beforeEach(async () => {
    await resetPublicState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores info, warn, and error with level, message, and createdAt", async () => {
    const before = Date.now();
    await TdLog.info("nothing special");
    await TdLog.warn("warn");
    await TdLog.error("error");
    const after = Date.now();

    const page = await TdLog.query();
    expect(page.total).toBe(3);
    expect(page.records).toHaveLength(3);

    // Newest first
    expect(page.records[0]).toMatchObject({ level: "error", message: "error" });
    expect(page.records[1]).toMatchObject({ level: "warn", message: "warn" });
    expect(page.records[2]).toMatchObject({
      level: "info",
      message: "nothing special",
    });

    for (const record of page.records) {
      expect(typeof record.id).toBe("number");
      expect(record.createdAt).toBeGreaterThanOrEqual(before);
      expect(record.createdAt).toBeLessThanOrEqual(after);
    }
  });

  it("rejects non-string messages", async () => {
    await expect(
      TdLog.info(123 as unknown as string),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it("truncates messages longer than maxChars", async () => {
    TdLogConfig.maxChars(5);
    await TdLog.info("abcdefghij");

    const page = await TdLog.query();
    expect(page.records[0]?.message).toBe("abcde");
  });

  it("keeps only the newest retainCount entries", async () => {
    TdLogConfig.retainCount(100);

    for (let i = 0; i < 101; i++) {
      await TdLog.info(`msg-${i}`);
    }

    const page = await TdLog.query({ pageSize: 200 });
    expect(page.total).toBe(100);
    expect(page.records[0]?.message).toBe("msg-100");
    expect(page.records.at(-1)?.message).toBe("msg-1");
    expect(page.records.some((r) => r.message === "msg-0")).toBe(false);
  });

  it("drops entries older than retainDays", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    await TdLog.info("old");
    TdLogConfig.retainDays(30);

    vi.setSystemTime(new Date("2026-02-05T00:00:00.000Z"));
    await TdLog.info("fresh");

    const page = await TdLog.query();
    expect(page.total).toBe(1);
    expect(page.records[0]?.message).toBe("fresh");
  });

  it("cleans all stored entries without changing config", async () => {
    TdLogConfig.retainCount(50);
    await TdLog.info("a");
    await TdLog.warn("b");

    await TdLog.clean();

    const page = await TdLog.query();
    expect(page.total).toBe(0);
    expect(page.records).toEqual([]);

    // Config still applies after clean
    for (let i = 0; i < 51; i++) {
      await TdLog.info(`n-${i}`);
    }
    const after = await TdLog.query({ pageSize: 100 });
    expect(after.total).toBe(50);
  });

  it("filters by keyword case-insensitively", async () => {
    await TdLog.info("Hello World");
    await TdLog.warn("goodbye");
    await TdLog.error("HELLO again");

    const page = await TdLog.query({ keyword: "hello" });
    expect(page.total).toBe(2);
    expect(page.records.map((r) => r.message)).toEqual([
      "HELLO again",
      "Hello World",
    ]);
  });

  it("treats empty keyword as no filter", async () => {
    await TdLog.info("one");
    await TdLog.info("two");

    const page = await TdLog.query({ keyword: "   " });
    expect(page.total).toBe(2);
  });

  it("paginates newest-first results", async () => {
    for (let i = 0; i < 5; i++) {
      await TdLog.info(`item-${i}`);
    }

    const page1 = await TdLog.query({ page: 1, pageSize: 2 });
    expect(page1.total).toBe(5);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(2);
    expect(page1.records.map((r) => r.message)).toEqual(["item-4", "item-3"]);

    const page2 = await TdLog.query({ page: 2, pageSize: 2 });
    expect(page2.records.map((r) => r.message)).toEqual(["item-2", "item-1"]);

    const page3 = await TdLog.query({ page: 3, pageSize: 2 });
    expect(page3.records.map((r) => r.message)).toEqual(["item-0"]);

    const pageOut = await TdLog.query({ page: 10, pageSize: 2 });
    expect(pageOut.total).toBe(5);
    expect(pageOut.records).toEqual([]);
  });

  it("rejects invalid query pagination", async () => {
    await expect(TdLog.query({ page: 0 })).rejects.toBeInstanceOf(RangeError);
    await expect(TdLog.query({ pageSize: 0 })).rejects.toBeInstanceOf(
      RangeError,
    );
  });
});
