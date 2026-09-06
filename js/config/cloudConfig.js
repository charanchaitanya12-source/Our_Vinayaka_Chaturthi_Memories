/**
 * ============================================================================
 * CLOUD SYNCHRONIZATION CONFIGURATION
 * ============================================================================
 * Manages Firebase and cloud database credentials for multi-device sync.
 * Credentials can be provided here or customized directly via the in-app
 * Cloud Sync Settings modal (persisted securely in browser storage).
 */

// Storage keys for custom cloud configuration overrides
export const CLOUD_STORAGE_KEYS = {
  FIREBASE_CONFIG: 'vinayaka_cloud_firebase_config_v1',
  SYNC_ENABLED: 'vinayaka_cloud_sync_enabled_v1',
  LAST_SYNC: 'vinayaka_cloud_last_synced_timestamp'
};

/**
 * Default Firebase Realtime Database configuration.
 * Users can either fill this in directly or paste their config into
 * the "Cloud Sync Settings" modal on the website without editing code.
 */
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

/**
 * Retrieves the active cloud configuration.
 * Checks for user-configured overrides in localStorage first, then falls back to defaults.
 */
export function getActiveCloudConfig() {
  try {
    const savedCustomConfig = localStorage.getItem(CLOUD_STORAGE_KEYS.FIREBASE_CONFIG);
    if (savedCustomConfig) {
      const parsed = JSON.parse(savedCustomConfig);
      if (parsed && (parsed.databaseURL || parsed.projectId)) {
        return {
          ...DEFAULT_FIREBASE_CONFIG,
          ...parsed,
          isCustom: true
        };
      }
    }
  } catch (err) {
    console.warn('Could not read custom cloud config from storage:', err);
  }

  return {
    ...DEFAULT_FIREBASE_CONFIG,
    isCustom: false
  };
}

/**
 * Saves or updates custom Firebase credentials from the website UI.
 */
export function saveCustomCloudConfig(configObj) {
  try {
    if (!configObj) {
      localStorage.removeItem(CLOUD_STORAGE_KEYS.FIREBASE_CONFIG);
      return true;
    }
    localStorage.setItem(CLOUD_STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(configObj));
    return true;
  } catch (err) {
    console.warn('Failed to save cloud config:', err);
    return false;
  }
}

/**
 * Checks if a valid cloud configuration is present.
 */
export function isCloudConfigured(config = getActiveCloudConfig()) {
  return !!(config && (config.databaseURL || (config.projectId && config.apiKey)));
}
