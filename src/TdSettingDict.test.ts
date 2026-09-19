import { beforeEach, describe, expect, it } from "vitest";
import { TdSettingDict } from "./TdSettingDict.js";

const DB_NAME = "tdkit-setting";

function deleteSettingDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to delete IndexedDB"));
    request.onblocked = () =>
      reject(new Error("IndexedDB delete blocked"));
  });
}

describe("TdSettingDict", () => {
  beforeEach(async () => {
    await deleteSettingDb();
  });

  it("stores and reads a string value", async () => {
    await TdSettingDict.set("color", "blue");
    await expect(TdSettingDict.get("color")).resolves.toBe("blue");
  });

  it("returns undefined for a missing key", async () => {
    await expect(TdSettingDict.get("missing")).resolves.toBeUndefined();
  });

  it("overwrites an existing value", async () => {
    await TdSettingDict.set("color", "blue");
    await TdSettingDict.set("color", "red");
    await expect(TdSettingDict.get("color")).resolves.toBe("red");
  });

  it("rejects a non-string value", async () => {
    await expect(
      // @ts-expect-error intentional invalid value
      TdSettingDict.set("color", 1),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it("rejects a non-string key on get and set", async () => {
    await expect(
      // @ts-expect-error intentional invalid key
      TdSettingDict.get(1),
    ).rejects.toBeInstanceOf(TypeError);
    await expect(
      // @ts-expect-error intentional invalid key
      TdSettingDict.set(1, "blue"),
    ).rejects.toBeInstanceOf(TypeError);
  });
});
