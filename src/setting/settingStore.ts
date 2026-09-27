import { Dexie, type EntityTable } from 'dexie';

interface SettingRecord {
  key: string;
  value: string;
}

const db = new Dexie('tdkit-setting') as Dexie & {
  entries: EntityTable<SettingRecord, 'key'>;
};

db.version(1).stores({
  entries: 'key',
});

function assertKey(key: unknown): asserts key is string {
  if (typeof key !== 'string') {
    throw new TypeError('key must be a string');
  }
}

function assertValue(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError('value must be a string');
  }
}

export async function get(key: string): Promise<string | undefined> {
  assertKey(key);
  const record = await db.entries.get(key);
  return record?.value;
}

export async function set(key: string, value: string): Promise<void> {
  assertKey(key);
  assertValue(value);
  await db.entries.put({ key, value });
}
