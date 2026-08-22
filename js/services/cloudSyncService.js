/**
 * ============================================================================
 * CLOUD REALTIME SYNC SERVICE
 * ============================================================================
 * Synchronizes gang member names, nicknames, custom additions, and photo
 * replacements live across all devices (mobile phones, tablets, laptops).
 */

const CLOUD_SYNC_URL = 'https://extendsclass.com/api/json-storage/bin/bcfcaac';

export class CloudSyncService {
  static syncIntervalId = null;

  /**
   * Fetches latest gang data from the shared Cloud Database
   */
  static async fetchGang() {
    try {
      const response = await fetch(CLOUD_SYNC_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-cache'
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data && Array.isArray(data.friends) && data.friends.length > 0) {
        return {
          friends: data.friends,
          updatedAt: data.updatedAt || 0,
          version: data.version || '1.0'
        };
      }
      return null;
    } catch (err) {
      console.warn('Cloud sync fetch offline or unavailable:', err);
      return null;
    }
  }

  /**
   * Saves updated gang data to both local storage and shared Cloud Database
   */
  static async saveGang(friendsList) {
    const timestamp = Date.now();

    const payload = {
      friends: friendsList,
      updatedAt: timestamp,
      version: '2026.08.22.1550'
    };

    // 1. Save locally for instant offline UI responsiveness
    try {
      localStorage.setItem('vinayaka_saved_gang_v12', JSON.stringify(friendsList));
      localStorage.setItem('vinayaka_gang_last_updated', timestamp.toString());
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 2. Push to shared Cloud Database for all other devices
    try {
      const response = await fetch(CLOUD_SYNC_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ Gang changes successfully synced to Cloud Database for all devices!');
        return true;
      }
    } catch (err) {
      console.warn('Cloud sync push error:', err);
    }
    return false;
  }

  /**
   * Starts background listener to pull changes made on other devices
   */
  static startLiveSync(onUpdateCallback) {
    if (this.syncIntervalId) return;

    const checkForUpdates = async () => {
      if (document.hidden) return; // Don't poll when tab is backgrounded to save battery

      const localUpdatedStr = localStorage.getItem('vinayaka_gang_last_updated');
      const localUpdated = localUpdatedStr ? parseInt(localUpdatedStr, 10) : 0;

      const cloudData = await this.fetchGang();
      if (cloudData && cloudData.updatedAt > localUpdated) {
        if (typeof onUpdateCallback === 'function') {
          onUpdateCallback(cloudData.friends, cloudData.updatedAt);
        }
      }
    };

    // Poll cloud every 5 seconds when active
    this.syncIntervalId = setInterval(checkForUpdates, 5000);

    // Sync immediately on tab focus or visibility change
    window.addEventListener('focus', checkForUpdates);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    });
  }
}
