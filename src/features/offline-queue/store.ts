/*
  Where queued scans live on the phone: IndexedDB (database itbi-offline, store scans), so they
  survive a reload, a closed tab or a dead battery. Falls back to memory when IndexedDB is not
  available (some private modes): the queue then lasts as long as the tab.
  Rules for entries: queue.ts. docs/OFFLINE.md.
*/

import type { QueueEntry } from "./queue"

const DB_NAME = "itbi-offline"
const STORE = "scans"
const VERSION = 1

let dbPromise: Promise<IDBDatabase | null> | null = null
const memory = new Map<string, QueueEntry>()

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null)
      const request = indexedDB.open(DB_NAME, VERSION)
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE, { keyPath: "id" })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  // Ask the browser not to evict the queue under storage pressure (best effort).
  void navigator.storage?.persist?.().catch(() => false)
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        if (!db) return reject(new Error("no-indexeddb"))
        const tx = db.transaction(STORE, mode)
        const request = action(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(request.result)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      }),
  )
}

export async function listEntries(): Promise<QueueEntry[]> {
  try {
    return await run("readonly", (store) => store.getAll() as IDBRequest<QueueEntry[]>)
  } catch {
    return [...memory.values()]
  }
}

export async function putEntry(entry: QueueEntry): Promise<void> {
  memory.set(entry.id, entry)
  try {
    await run("readwrite", (store) => store.put(entry))
  } catch {
    // Memory copy above is the fallback.
  }
}

export async function deleteEntry(id: string): Promise<void> {
  memory.delete(id)
  try {
    await run("readwrite", (store) => store.delete(id))
  } catch {
    // Nothing stored there.
  }
}

/** Pending scans in this browser for any account (the sign-out warning). */
export async function countPending(): Promise<number> {
  const entries = await listEntries()
  return entries.filter((entry) => entry.status === "pending").length
}
