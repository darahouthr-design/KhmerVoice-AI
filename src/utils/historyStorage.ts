import { HistoryItem } from '../types';

const DB_NAME = 'KhmerVoiceDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_history';

/**
 * Open or create the IndexedDB instance for KhmerVoice AI
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Load all history items from IndexedDB ordered by createdAt descending
 */
export async function getAllHistoryItems(): Promise<HistoryItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items: HistoryItem[] = request.result || [];
        // Sort descending by creation date
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(items);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('Failed to load history from IndexedDB, falling back to empty list:', err);
    return [];
  }
}

/**
 * Save or update a single history item in IndexedDB
 */
export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save history item to IndexedDB:', err);
  }
}

/**
 * Save multiple history items (e.g. on import or bulk sync)
 */
export async function saveMultipleHistoryItems(items: HistoryItem[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      items.forEach((item) => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error('Failed to save multiple items to IndexedDB:', err);
  }
}

/**
 * Delete a single history item by ID from IndexedDB
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error(`Failed to delete item ${id} from IndexedDB:`, err);
  }
}

/**
 * Clear all history items from IndexedDB
 */
export async function clearAllHistory(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to clear IndexedDB history:', err);
  }
}

/**
 * Safely clean up any residual bloated localStorage keys
 */
export function cleanupBloatedLocalStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('khmervoice_history')) {
        localStorage.removeItem('khmervoice_history');
      }
    }
  } catch {
    // Ignore any localStorage access restrictions
  }
}
