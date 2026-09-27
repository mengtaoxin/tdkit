import { Dexie, type EntityTable } from 'dexie';
import { getLogConfig } from './logConfig.js';

export type TdLogLevel = 'info' | 'warn' | 'error';

export interface TdLogRecord {
  id: number;
  level: TdLogLevel;
  message: string;
  createdAt: number;
}

export interface TdLogQuery {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface TdLogPage {
  records: TdLogRecord[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const db = new Dexie('tdkit-log') as Dexie & {
  entries: EntityTable<TdLogRecord, 'id'>;
};

db.version(1).stores({
  entries: '++id, createdAt',
});

function assertMessage(message: unknown): asserts message is string {
  if (typeof message !== 'string') {
    throw new TypeError('message must be a string');
  }
}

async function prune(): Promise<void> {
  const { retainCount, retainDays } = getLogConfig();
  const cutoff = Date.now() - retainDays * MS_PER_DAY;

  await db.entries.where('createdAt').below(cutoff).delete();

  const overflow = (await db.entries.count()) - retainCount;
  if (overflow > 0) {
    await db.entries.orderBy('createdAt').limit(overflow).delete();
  }
}

export async function append(level: TdLogLevel, message: string): Promise<void> {
  assertMessage(message);
  const { maxChars } = getLogConfig();
  const truncated = message.length > maxChars ? message.slice(0, maxChars) : message;

  await db.transaction('rw', db.entries, async () => {
    await db.entries.add({
      level,
      message: truncated,
      createdAt: Date.now(),
    });
    await prune();
  });
}

export async function clean(): Promise<void> {
  await db.entries.clear();
}

export async function query(queryOptions: TdLogQuery = {}): Promise<TdLogPage> {
  const page = queryOptions.page ?? DEFAULT_PAGE;
  const pageSize = queryOptions.pageSize ?? DEFAULT_PAGE_SIZE;

  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError('page must be an integer >= 1');
  }
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError('pageSize must be an integer >= 1');
  }

  const keyword = queryOptions.keyword?.trim() ?? '';
  const needle = keyword.length > 0 ? keyword.toLowerCase() : null;

  // Dexie collections are mutated by offset/limit, so build a fresh one per use.
  const newestFirst = () => {
    const collection = db.entries.orderBy('createdAt').reverse();
    return needle === null
      ? collection
      : collection.filter((record) => record.message.toLowerCase().includes(needle));
  };

  return db.transaction('rw', db.entries, async () => {
    await prune();

    const total = await newestFirst().count();
    const records = await newestFirst()
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return { records, total, page, pageSize };
  });
}
