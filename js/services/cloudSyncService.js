/**
 * ============================================================================
 * CLOUD REALTIME SYNC SERVICE
 * ============================================================================
 * Handles synchronization across tabs, windows, and local storage state.
 */

export class CloudSyncService {
  static syncIntervalId = null;

  /**
   * Fetches latest gang data
   */
  static async fetchGang() {
    // Return local storage data as source of truth for the device
    try {
      const stored = localStorage.getItem('vinayaka_saved_gang_v12');
      const timestampStr = localStorage.getItem('vinayaka_gang_last_updated');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return {
            friends: parsed,
            updatedAt: timestampStr ? parseInt(timestampStr, 10) : Date.now(),
            version: '2026.08.22.1600'
          };
        }
      }
    } catch (e) {
      console.warn('Local cache read error:', e);
    }
    return null;
  }

  /**
   * Saves updated gang data to local storage and broadcasts to other open tabs
   */
  static async saveGang(friendsList) {
    const timestamp = Date.now();

    try {
      localStorage.setItem('vinayaka_saved_gang_v12', JSON.stringify(friendsList));
      localStorage.setItem('vinayaka_gang_last_updated', timestamp.toString());
      return true;
    } catch (e) {
      console.warn('LocalStorage save error:', e);
      return false;
    }
  }

  /**
   * Starts live sync listener for cross-tab and storage updates
   */
  static startLiveSync(onUpdateCallback) {
    if (this.syncIntervalId) return;

    window.addEventListener('storage', (e) => {
      if (e.key === 'vinayaka_saved_gang_v12' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const timestampStr = localStorage.getItem('vinayaka_gang_last_updated');
          const ts = timestampStr ? parseInt(timestampStr, 10) : Date.now();
          if (Array.isArray(parsed) && typeof onUpdateCallback === 'function') {
            onUpdateCallback(parsed, ts);
          }
        } catch (err) {}
      }
    });
  }
}
