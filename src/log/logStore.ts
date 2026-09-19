import { getLogConfig } from "./logConfig.js";

export type TdLogLevel = "info" | "warn" | "error";

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

const DB_NAME = "tdkit-log";
const STORE_NAME = "entries";
const DB_VERSION = 1;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

let dbPromise: Promise<IDBDatabase> | null = null;
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });

  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function assertMessage(message: unknown): asserts message is string {
  if (typeof message !== "string") {
    throw new TypeError("message must be a string");
  }
}

async function prune(store: IDBObjectStore): Promise<void> {
  const { retainCount, retainDays } = getLogConfig();
  const cutoff = Date.now() - retainDays * MS_PER_DAY;
  const createdAtIndex = store.index("createdAt");

  const expiredKeys = await requestToPromise(
    createdAtIndex.getAllKeys(IDBKeyRange.upperBound(cutoff, true)),
  );
  for (const key of expiredKeys) {
    store.delete(key);
  }

  const remaining = (await requestToPromise(
    createdAtIndex.getAll(),
  )) as TdLogRecord[];
  const overflow = remaining.length - retainCount;
  if (overflow > 0) {
    for (let i = 0; i < overflow; i++) {
      const record = remaining[i];
      if (record !== undefined) {
        store.delete(record.id);
      }
    }
  }
}

async function appendImpl(level: TdLogLevel, message: string): Promise<void> {
  assertMessage(message);
  const { maxChars } = getLogConfig();
  const truncated =
    message.length > maxChars ? message.slice(0, maxChars) : message;

  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const done = transactionDone(tx);
  const store = tx.objectStore(STORE_NAME);

  store.add({
    level,
    message: truncated,
    createdAt: Date.now(),
  });

  await prune(store);
  await done;
}

async function cleanImpl(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const done = transactionDone(tx);
  tx.objectStore(STORE_NAME).clear();
  await done;
}

async function queryImpl(query: TdLogQuery = {}): Promise<TdLogPage> {
  const page = query.page ?? DEFAULT_PAGE;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError("page must be an integer >= 1");
  }
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("pageSize must be an integer >= 1");
  }

  const keyword = query.keyword?.trim() ?? "";
  const needle = keyword.length > 0 ? keyword.toLowerCase() : null;

  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const done = transactionDone(tx);
  const store = tx.objectStore(STORE_NAME);

  await prune(store);

  const createdAtIndex = store.index("createdAt");
  const all = (await requestToPromise(
    createdAtIndex.getAll(),
  )) as TdLogRecord[];
  await done;

  // Newest first (getAll returns ascending by createdAt).
  const newestFirst = all.slice().reverse();
  const matched =
    needle === null
      ? newestFirst
      : newestFirst.filter((record) =>
          record.message.toLowerCase().includes(needle),
        );

  const total = matched.length;
  const start = (page - 1) * pageSize;
  const records = matched.slice(start, start + pageSize);

  return { records, total, page, pageSize };
}

export function append(level: TdLogLevel, message: string): Promise<void> {
  return enqueue(() => appendImpl(level, message));
}

export function clean(): Promise<void> {
  return enqueue(() => cleanImpl());
}

export function query(queryOptions?: TdLogQuery): Promise<TdLogPage> {
  return enqueue(() => queryImpl(queryOptions));
}
