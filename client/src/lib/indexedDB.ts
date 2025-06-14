import { VideoFragment, ReflectionSession, PatternInsight } from '@/types/reflection';

const DB_NAME = 'SelfMirroringDB';
const DB_VERSION = 1;

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Video fragments store
        if (!db.objectStoreNames.contains('fragments')) {
          const fragmentStore = db.createObjectStore('fragments', { keyPath: 'id' });
          fragmentStore.createIndex('timestamp', 'timestamp');
          fragmentStore.createIndex('tags', 'tags', { multiEntry: true });
          fragmentStore.createIndex('mood', 'metadata.mood');
        }

        // Reflection sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('startTime', 'startTime');
        }

        // Pattern insights store
        if (!db.objectStoreNames.contains('patterns')) {
          const patternStore = db.createObjectStore('patterns', { keyPath: 'id' });
          patternStore.createIndex('type', 'type');
          patternStore.createIndex('timestamp', 'timestamp');
        }

        // Video blobs store (separate for large binary data)
        if (!db.objectStoreNames.contains('videoBlobs')) {
          db.createObjectStore('videoBlobs', { keyPath: 'id' });
        }
      };
    });
  }

  async saveFragment(fragment: VideoFragment): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Save video blob separately
    await this.saveVideoBlob(fragment.id, fragment.blob);
    
    // Save variations blobs
    for (const variation of fragment.variations) {
      await this.saveVideoBlob(variation.id, variation.blob);
    }

    // Save response blobs
    for (const response of fragment.responses) {
      await this.saveVideoBlob(response.id, response.blob);
    }

    // Save fragment metadata (without blobs)
    const fragmentToSave = {
      ...fragment,
      blob: null, // Remove blob reference
      variations: fragment.variations.map(v => ({ ...v, blob: null })),
      responses: fragment.responses.map(r => ({ ...r, blob: null }))
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['fragments'], 'readwrite');
      const store = transaction.objectStore('fragments');
      const request = store.put(fragmentToSave);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async saveVideoBlob(id: string, blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['videoBlobs'], 'readwrite');
      const store = transaction.objectStore('videoBlobs');
      const request = store.put({ id, blob });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getFragment(id: string): Promise<VideoFragment | null> {
    if (!this.db) throw new Error('Database not initialized');

    const fragment = await new Promise<any>((resolve, reject) => {
      const transaction = this.db!.transaction(['fragments'], 'readonly');
      const store = transaction.objectStore('fragments');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    if (!fragment) return null;

    // Restore video blobs
    fragment.blob = await this.getVideoBlob(fragment.id);
    
    for (const variation of fragment.variations) {
      variation.blob = await this.getVideoBlob(variation.id);
    }

    for (const response of fragment.responses) {
      response.blob = await this.getVideoBlob(response.id);
    }

    return fragment;
  }

  private async getVideoBlob(id: string): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['videoBlobs'], 'readonly');
      const store = transaction.objectStore('videoBlobs');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.blob || null);
    });
  }

  async getAllFragments(): Promise<VideoFragment[]> {
    if (!this.db) throw new Error('Database not initialized');

    const fragments = await new Promise<any[]>((resolve, reject) => {
      const transaction = this.db!.transaction(['fragments'], 'readonly');
      const store = transaction.objectStore('fragments');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    // Restore blobs for all fragments
    const restoredFragments = await Promise.all(
      fragments.map(async (fragment) => {
        fragment.blob = await this.getVideoBlob(fragment.id);
        
        for (const variation of fragment.variations) {
          variation.blob = await this.getVideoBlob(variation.id);
        }

        for (const response of fragment.responses) {
          response.blob = await this.getVideoBlob(response.id);
        }

        return fragment;
      })
    );

    return restoredFragments;
  }

  async saveSession(session: ReflectionSession): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put(session);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async savePattern(pattern: PatternInsight): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patterns'], 'readwrite');
      const store = transaction.objectStore('patterns');
      const request = store.put(pattern);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getPatterns(): Promise<PatternInsight[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patterns'], 'readonly');
      const store = transaction.objectStore('patterns');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteFragment(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fragment = await this.getFragment(id);
    if (!fragment) return;

    // Delete associated video blobs
    await this.deleteVideoBlob(id);
    for (const variation of fragment.variations) {
      await this.deleteVideoBlob(variation.id);
    }
    for (const response of fragment.responses) {
      await this.deleteVideoBlob(response.id);
    }

    // Delete fragment record
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['fragments'], 'readwrite');
      const store = transaction.objectStore('fragments');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async deleteVideoBlob(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['videoBlobs'], 'readwrite');
      const store = transaction.objectStore('videoBlobs');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const dbManager = new IndexedDBManager();
