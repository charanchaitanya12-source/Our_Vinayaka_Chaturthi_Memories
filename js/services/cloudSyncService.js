/**
 * ============================================================================
 * CLOUD REALTIME SYNC SERVICE
 * ============================================================================
 * Handles real-time multi-device cloud synchronization via Firebase
 * Realtime Database, with automatic offline caching & cross-tab sync.
 *
 * Ensures any change made on one device (added videos, memory wall posts,
 * gang details, or lit diyas) is immediately visible on all other devices.
 */

import { getActiveCloudConfig, isCloudConfigured, saveCustomCloudConfig } from '../config/cloudConfig.js';

export class CloudSyncService {
  static firebaseApp = null;
  static database = null;
  static isInitialized = false;
  static isOnline = navigator.onLine;
  static isCloudConnected = false;
  static listeners = {};
  static lastSyncTimestamp = 0;

  // Local storage cache keys
  static CACHE_KEYS = {
    VIDEOS: 'bappa_saved_videos_v2',
    MEMORIES: 'vinayaka_chat_memories_wall_v3',
    GANG: 'vinayaka_saved_gang_v15',
    GANG_TIMESTAMP: 'vinayaka_gang_last_updated',
    DIYAS: 'vinayaka_lit_diyas_count',
    LAST_CLOUD_SYNC: 'vinayaka_last_cloud_sync_time'
  };

  // Firebase Database path references
  static DB_PATHS = {
    ROOT: 'vinayaka_memories',
    VIDEOS: 'vinayaka_memories/videos',
    MEMORIES: 'vinayaka_memories/wall_posts',
    GANG: 'vinayaka_memories/gang',
    DIYAS: 'vinayaka_memories/diyas',
    LAST_UPDATED: 'vinayaka_memories/last_updated'
  };

  /**
   * Initializes Firebase and real-time cloud listeners.
   */
  static async init() {
    if (this.isInitialized) return this.getStatus();

    this.lastSyncTimestamp = parseInt(localStorage.getItem(this.CACHE_KEYS.LAST_CLOUD_SYNC) || '0', 10);

    // Online/Offline network state monitors
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.reconnect();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.isCloudConnected = false;
      this.emitStatus();
    });

    // Cross-tab storage listener fallback
    window.addEventListener('storage', (e) => {
      if (e.key === this.CACHE_KEYS.VIDEOS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) this.emit('videos', parsed);
        } catch (err) {}
      } else if (e.key === this.CACHE_KEYS.MEMORIES && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) this.emit('memories', parsed);
        } catch (err) {}
      } else if (e.key === this.CACHE_KEYS.GANG && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) this.emit('gang', parsed);
        } catch (err) {}
      }
    });

    // Attempt Firebase initialization
    await this.setupFirebase();

    this.isInitialized = true;
    this.emitStatus();
    return this.getStatus();
  }

  /**
   * Configures Firebase SDK using active cloud configuration
   */
  static async setupFirebase(customConfig = null) {
    const config = customConfig || getActiveCloudConfig();

    if (!isCloudConfigured(config)) {
      this.isCloudConnected = false;
      console.log('ℹ️ CloudSync: Running in Local Cache Mode. Add Firebase config in Cloud Sync Settings to enable live multi-device sharing.');
      return false;
    }

    if (typeof window.firebase === 'undefined') {
      console.warn('⚠️ CloudSync: Firebase SDK not found on window. Ensure CDN scripts are loaded in index.html.');
      this.isCloudConnected = false;
      return false;
    }

    try {
      // Clean up previous app instance if reconfiguring
      if (this.firebaseApp) {
        try {
          await this.firebaseApp.delete();
        } catch (e) {}
        this.firebaseApp = null;
      } else if (window.firebase.apps && window.firebase.apps.length > 0) {
        try {
          await window.firebase.apps[0].delete();
        } catch (e) {}
      }

      this.firebaseApp = window.firebase.initializeApp(config);
      this.database = window.firebase.database();

      // Monitor connection state via .info/connected
      const connectedRef = this.database.ref('.info/connected');
      connectedRef.on('value', (snap) => {
        const connected = snap.val() === true;
        this.isCloudConnected = connected;
        if (connected) {
          this.lastSyncTimestamp = Date.now();
          localStorage.setItem(this.CACHE_KEYS.LAST_CLOUD_SYNC, this.lastSyncTimestamp.toString());
        }
        this.emitStatus();
      });

      // Attach real-time cloud listeners
      this.attachCloudListeners();
      return true;
    } catch (err) {
      console.warn('⚠️ CloudSync: Firebase init error:', err);
      this.isCloudConnected = false;
      return false;
    }
  }

  /**
   * Reconnects to cloud database when device returns online
   */
  static async reconnect() {
    if (this.database) {
      try {
        this.database.goOnline();
      } catch (e) {}
    } else {
      await this.setupFirebase();
    }
    this.emitStatus();
  }

  /* =========================================================================
     1. VIDEOS SYNCHRONIZATION
     ========================================================================= */

  /**
   * Fetches latest videos list (cloud first, fallback to localStorage)
   */
  static async fetchVideos() {
    if (this.database && this.isCloudConnected) {
      try {
        const snapshot = await this.database.ref(this.DB_PATHS.VIDEOS).once('value');
        const val = snapshot.val();
        if (val && Array.isArray(val)) {
          // Update local cache
          localStorage.setItem(this.CACHE_KEYS.VIDEOS, JSON.stringify(val));
          return val;
        }
      } catch (err) {
        console.warn('CloudSync fetchVideos error:', err);
      }
    }

    // Fallback to local cache
    try {
      const stored = localStorage.getItem(this.CACHE_KEYS.VIDEOS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Saves updated videos list to both Cloud and Local Storage
   */
  static async saveVideos(videosList) {
    if (!Array.isArray(videosList)) return false;

    // 1. Immediately persist to local cache for instant UI feedback
    try {
      localStorage.setItem(this.CACHE_KEYS.VIDEOS, JSON.stringify(videosList));
    } catch (e) {
      console.warn('LocalStorage saveVideos error:', e);
    }

    // 2. Persist to Cloud Database if connected
    if (this.database) {
      try {
        await this.database.ref(this.DB_PATHS.VIDEOS).set(videosList);
        await this.database.ref(this.DB_PATHS.LAST_UPDATED).set(Date.now());
        this.lastSyncTimestamp = Date.now();
        localStorage.setItem(this.CACHE_KEYS.LAST_CLOUD_SYNC, this.lastSyncTimestamp.toString());
        this.emitStatus();
        return true;
      } catch (err) {
        console.warn('CloudSync saveVideos cloud push error:', err);
      }
    }

    return true;
  }

  /**
   * Subscribes to real-time video updates across all devices
   */
  static subscribeVideos(callback) {
    if (typeof callback !== 'function') return;

    this.on('videos', callback);

    if (this.database) {
      this.database.ref(this.DB_PATHS.VIDEOS).on('value', (snapshot) => {
        const val = snapshot.val();
        if (val && Array.isArray(val)) {
          localStorage.setItem(this.CACHE_KEYS.VIDEOS, JSON.stringify(val));
          callback(val);
        }
      });
    }
  }

  /* =========================================================================
     2. MEMORY WALL SYNCHRONIZATION
     ========================================================================= */

  /**
   * Fetches latest memory wall posts
   */
  static async fetchMemories() {
    if (this.database && this.isCloudConnected) {
      try {
        const snapshot = await this.database.ref(this.DB_PATHS.MEMORIES).once('value');
        const val = snapshot.val();
        if (val && Array.isArray(val)) {
          localStorage.setItem(this.CACHE_KEYS.MEMORIES, JSON.stringify(val));
          return val;
        }
      } catch (err) {
        console.warn('CloudSync fetchMemories error:', err);
      }
    }

    try {
      const stored = localStorage.getItem(this.CACHE_KEYS.MEMORIES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Saves memory wall posts to Cloud and Local Storage
   */
  static async saveMemories(postsList) {
    if (!Array.isArray(postsList)) return false;

    try {
      localStorage.setItem(this.CACHE_KEYS.MEMORIES, JSON.stringify(postsList));
    } catch (e) {}

    if (this.database) {
      try {
        await this.database.ref(this.DB_PATHS.MEMORIES).set(postsList);
        await this.database.ref(this.DB_PATHS.LAST_UPDATED).set(Date.now());
        this.lastSyncTimestamp = Date.now();
        localStorage.setItem(this.CACHE_KEYS.LAST_CLOUD_SYNC, this.lastSyncTimestamp.toString());
        this.emitStatus();
        return true;
      } catch (err) {
        console.warn('CloudSync saveMemories cloud push error:', err);
      }
    }

    return true;
  }

  /**
   * Subscribes to real-time memory wall posts
   */
  static subscribeMemories(callback) {
    if (typeof callback !== 'function') return;

    this.on('memories', callback);

    if (this.database) {
      this.database.ref(this.DB_PATHS.MEMORIES).on('value', (snapshot) => {
        const val = snapshot.val();
        if (val && Array.isArray(val)) {
          localStorage.setItem(this.CACHE_KEYS.MEMORIES, JSON.stringify(val));
          callback(val);
        }
      });
    }
  }

  /* =========================================================================
     3. THE GANG (FRIENDS SPOTLIGHT) SYNCHRONIZATION
     ========================================================================= */

  /**
   * Fetches latest friends gang data
   */
  static async fetchGang() {
    if (this.database && this.isCloudConnected) {
      try {
        const snapshot = await this.database.ref(this.DB_PATHS.GANG).once('value');
        const val = snapshot.val();
        if (val && Array.isArray(val)) {
          val.forEach(f => {
            if (f && (f.id === 'friend-hamu' || (f.name && (f.name.toLowerCase().includes('hamu') || f.name.toLowerCase().includes('hemu'))))) {
              f.name = 'Hemu';
            }
          });
          localStorage.setItem(this.CACHE_KEYS.GANG, JSON.stringify(val));
          return {
            friends: val,
            updatedAt: Date.now(),
            version: '6.1.0'
          };
        }
      } catch (err) {
        console.warn('CloudSync fetchGang error:', err);
      }
    }

    try {
      const stored = localStorage.getItem(this.CACHE_KEYS.GANG);
      const timestampStr = localStorage.getItem(this.CACHE_KEYS.GANG_TIMESTAMP);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach(f => {
            if (f && (f.id === 'friend-hamu' || (f.name && (f.name.toLowerCase().includes('hamu') || f.name.toLowerCase().includes('hemu'))))) {
              f.name = 'Hemu';
            }
          });
          return {
            friends: parsed,
            updatedAt: timestampStr ? parseInt(timestampStr, 10) : Date.now(),
            version: '6.1.0'
          };
        }
      }
    } catch (e) {}

    return null;
  }

  /**
   * Saves updated friends gang data to Cloud and Local Storage
   */
  static async saveGang(friendsList) {
    if (!Array.isArray(friendsList)) return false;
    friendsList.forEach(f => {
      if (f && (f.id === 'friend-hamu' || (f.name && (f.name.toLowerCase().includes('hamu') || f.name.toLowerCase().includes('hemu'))))) {
        f.name = 'Hemu';
      }
    });
    const now = Date.now();

    try {
      localStorage.setItem(this.CACHE_KEYS.GANG, JSON.stringify(friendsList));
      localStorage.setItem(this.CACHE_KEYS.GANG_TIMESTAMP, now.toString());
    } catch (e) {}

    if (this.database) {
      try {
        await this.database.ref(this.DB_PATHS.GANG).set(friendsList);
        await this.database.ref(this.DB_PATHS.LAST_UPDATED).set(now);
        this.lastSyncTimestamp = now;
        localStorage.setItem(this.CACHE_KEYS.LAST_CLOUD_SYNC, now.toString());
        this.emitStatus();
        return true;
      } catch (err) {
        console.warn('CloudSync saveGang cloud push error:', err);
      }
    }

    return true;
  }

  /**
   * Subscribes to real-time gang updates
   */
  static subscribeGang(callback) {
    if (typeof callback !== 'function') return;

    this.on('gang', callback);

    if (this.database) {
      this.database.ref(this.DB_PATHS.GANG).on('value', (snapshot) => {
        const val = snapshot.val();
        if (val && Array.isArray(val)) {
          val.forEach(f => {
            if (f && (f.id === 'friend-hamu' || (f.name && (f.name.toLowerCase().includes('hamu') || f.name.toLowerCase().includes('hemu'))))) {
              f.name = 'Hemu';
            }
          });
          localStorage.setItem(this.CACHE_KEYS.GANG, JSON.stringify(val));
          callback(val, Date.now());
        }
      });
    }
  }

  /* =========================================================================
     4. FESTIVE DIYAS COUNTER SYNCHRONIZATION
     ========================================================================= */

  static async fetchDiyas() {
    if (this.database && this.isCloudConnected) {
      try {
        const snapshot = await this.database.ref(this.DB_PATHS.DIYAS).once('value');
        const val = snapshot.val();
        if (typeof val === 'number') {
          localStorage.setItem(this.CACHE_KEYS.DIYAS, val.toString());
          return val;
        }
      } catch (err) {}
    }

    const localCount = parseInt(localStorage.getItem(this.CACHE_KEYS.DIYAS) || '108', 10);
    return localCount;
  }

  static async incrementDiyas() {
    let newCount = parseInt(localStorage.getItem(this.CACHE_KEYS.DIYAS) || '108', 10) + 1;
    localStorage.setItem(this.CACHE_KEYS.DIYAS, newCount.toString());

    if (this.database) {
      try {
        const res = await this.database.ref(this.DB_PATHS.DIYAS).transaction((curr) => (curr || 108) + 1);
        if (res.committed && res.snapshot) {
          newCount = res.snapshot.val();
          localStorage.setItem(this.CACHE_KEYS.DIYAS, newCount.toString());
        }
      } catch (err) {}
    }

    return newCount;
  }

  static subscribeDiyas(callback) {
    if (typeof callback !== 'function') return;

    this.on('diyas', callback);

    if (this.database) {
      this.database.ref(this.DB_PATHS.DIYAS).on('value', (snap) => {
        const val = snap.val();
        if (typeof val === 'number') {
          localStorage.setItem(this.CACHE_KEYS.DIYAS, val.toString());
          callback(val);
        }
      });
    }
  }

  /* =========================================================================
     5. STATUS & MANAGEMENT UTILITIES
     ========================================================================= */

  /**
   * Returns current sync status
   */
  static getStatus() {
    const config = getActiveCloudConfig();
    const configured = isCloudConfigured(config);

    return {
      isOnline: this.isOnline,
      isConfigured: configured,
      isCloudConnected: this.isCloudConnected,
      mode: this.isCloudConnected ? 'live-cloud' : (configured ? 'connecting' : 'local-only'),
      lastSyncTimestamp: this.lastSyncTimestamp,
      configSummary: configured ? (config.projectId || config.databaseURL || 'Custom') : null
    };
  }

  /**
   * Tests a provided Firebase configuration
   */
  static async testConnection(config) {
    if (!config || (!config.databaseURL && !config.projectId)) {
      return { success: false, message: 'Please provide at least a Database URL or Project ID.' };
    }

    if (typeof window.firebase === 'undefined') {
      return { success: false, message: 'Firebase library not loaded. Check internet connection.' };
    }

    try {
      const testAppName = 'test_app_' + Date.now();
      const testApp = window.firebase.initializeApp(config, testAppName);
      const testDb = testApp.database();

      // Test ping to database with 7-second timeout
      const ref = testDb.ref('.info/serverTimeOffset');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out after 7s. Please verify Database URL and network.')), 7000)
      );
      const snap = await Promise.race([ref.once('value'), timeoutPromise]);

      // Clean up test app
      try { await testApp.delete(); } catch (e) {}

      if (snap && (snap.exists() || snap.val() !== null)) {
        return { success: true, message: '✅ Connection verified successfully!' };
      }
      return { success: true, message: '✅ Connected to Firebase successfully!' };
    } catch (err) {
      return { success: false, message: `❌ Connection failed: ${err.message || err}` };
    }
  }

  /**
   * Pushes all local storage state to the cloud
   */
  static async pushAllLocalToCloud() {
    if (!this.database) {
      return { success: false, message: 'Cloud database is not connected.' };
    }

    try {
      const storedVideos = localStorage.getItem(this.CACHE_KEYS.VIDEOS);
      const storedMemories = localStorage.getItem(this.CACHE_KEYS.MEMORIES);
      const storedGang = localStorage.getItem(this.CACHE_KEYS.GANG);
      const storedDiyas = localStorage.getItem(this.CACHE_KEYS.DIYAS);

      const updates = {};
      let itemsCount = 0;

      if (storedVideos) {
        updates[this.DB_PATHS.VIDEOS] = JSON.parse(storedVideos);
        itemsCount++;
      }
      if (storedMemories) {
        updates[this.DB_PATHS.MEMORIES] = JSON.parse(storedMemories);
        itemsCount++;
      }
      if (storedGang) {
        updates[this.DB_PATHS.GANG] = JSON.parse(storedGang);
        itemsCount++;
      }
      if (storedDiyas) {
        updates[this.DB_PATHS.DIYAS] = parseInt(storedDiyas, 10);
        itemsCount++;
      }

      updates[this.DB_PATHS.LAST_UPDATED] = Date.now();

      await this.database.ref().update(updates);
      this.lastSyncTimestamp = Date.now();
      localStorage.setItem(this.CACHE_KEYS.LAST_CLOUD_SYNC, this.lastSyncTimestamp.toString());
      this.emitStatus();

      return { success: true, message: `✨ Successfully uploaded local memories to the cloud! (${itemsCount} sections synced)` };
    } catch (err) {
      return { success: false, message: `Failed to push to cloud: ${err.message}` };
    }
  }

  /**
   * Subscribes to internal event dispatcher
   */
  static on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  /**
   * Emits internal event and window CustomEvent
   */
  static emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try { cb(data); } catch (e) {}
      });
    }

    try {
      window.dispatchEvent(new CustomEvent(`cloud-${event}-updated`, { detail: data }));
    } catch (e) {}
  }

  static emitStatus() {
    const status = this.getStatus();
    this.emit('status', status);
    try {
      window.dispatchEvent(new CustomEvent('cloud-sync-status-changed', { detail: status }));
    } catch (e) {}
  }

  static attachCloudListeners() {
    // Attach listeners for any active subscriptions
    if (this.listeners['videos']) {
      this.database.ref(this.DB_PATHS.VIDEOS).on('value', (snap) => {
        const val = snap.val();
        if (Array.isArray(val)) this.emit('videos', val);
      });
    }
    if (this.listeners['memories']) {
      this.database.ref(this.DB_PATHS.MEMORIES).on('value', (snap) => {
        const val = snap.val();
        if (Array.isArray(val)) this.emit('memories', val);
      });
    }
    if (this.listeners['gang']) {
      this.database.ref(this.DB_PATHS.GANG).on('value', (snap) => {
        const val = snap.val();
        if (Array.isArray(val)) this.emit('gang', val);
      });
    }
    if (this.listeners['diyas']) {
      this.database.ref(this.DB_PATHS.DIYAS).on('value', (snap) => {
        const val = snap.val();
        if (typeof val === 'number') this.emit('diyas', val);
      });
    }
  }
}
