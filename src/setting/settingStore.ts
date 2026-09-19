interface SettingRecord {
  key: string;
  value: string;
}

const DB_NAME = "tdkit-setting";
const STORE_NAME = "entries";
const DB_VERSION = 1;

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
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
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

function assertKey(key: unknown): asserts key is string {
  if (typeof key !== "string") {
    throw new TypeError("key must be a string");
  }
}

function assertValue(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new TypeError("value must be a string");
  }
}

async function getImpl(key: string): Promise<string | undefined> {
  assertKey(key);

  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const done = transactionDone(tx);
  const store = tx.objectStore(STORE_NAME);
  const record = (await requestToPromise(store.get(key))) as
    | SettingRecord
    | undefined;
  await done;

  return record?.value;
}

async function setImpl(key: string, value: string): Promise<void> {
  assertKey(key);
  assertValue(value);

  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const done = transactionDone(tx);
  const store = tx.objectStore(STORE_NAME);
  store.put({ key, value } satisfies SettingRecord);
  await done;
}

export function get(key: string): Promise<string | undefined> {
  return enqueue(() => getImpl(key));
}

export function set(key: string, value: string): Promise<void> {
  return enqueue(() => setImpl(key, value));
}
