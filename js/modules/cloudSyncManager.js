/**
 * ============================================================================
 * CLOUD SYNC MANAGER UI CONTROLLER
 * ============================================================================
 * Coordinates the multi-device sync status badge, sync modal, credentials
 * configuration form, and manual push/pull operations.
 */

import { CloudSyncService } from '../services/cloudSyncService.js';
import { getActiveCloudConfig, saveCustomCloudConfig } from '../config/cloudConfig.js';

export class CloudSyncManagerController {
  constructor() {
    this.badgeBtn = document.getElementById('btn-cloud-sync-status');
    this.badgeText = document.getElementById('cloud-sync-badge-text');
    this.badgeDot = document.querySelector('.cloud-sync-dot');

    this.modal = document.getElementById('cloud-sync-modal');
    this.closeBtn = document.getElementById('cloud-sync-close');
    this.form = document.getElementById('cloud-config-form');

    this.statusTag = document.getElementById('cloud-modal-status-tag');
    this.statusDetails = document.getElementById('cloud-modal-status-details');
    this.lastSyncSpan = document.getElementById('cloud-modal-last-sync');

    this.testBtn = document.getElementById('btn-test-cloud-config');
    this.saveBtn = document.getElementById('btn-save-cloud-config');
    this.pushBtn = document.getElementById('btn-push-local-to-cloud');
    this.clearBtn = document.getElementById('btn-clear-cloud-config');
    this.feedbackEl = document.getElementById('cloud-config-feedback');

    // Input fields
    this.apiKeyInput = document.getElementById('cloud-cfg-apikey');
    this.dbUrlInput = document.getElementById('cloud-cfg-dburl');
    this.projectIdInput = document.getElementById('cloud-cfg-projectid');
    this.appIdInput = document.getElementById('cloud-cfg-appid');

    // Additional sync triggers on page
    this.sectionSyncBtn = document.getElementById('btn-sync-videos-cloud');

    this.init();
  }

  async init() {
    // 1. Initialize Cloud Service
    await CloudSyncService.init();

    // 2. Setup Event Listeners
    if (this.badgeBtn) {
      this.badgeBtn.addEventListener('click', () => this.openModal());
    }

    if (this.sectionSyncBtn) {
      this.sectionSyncBtn.addEventListener('click', () => this.openModal());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
        this.closeModal();
      }
    });

    // 3. Cloud actions
    if (this.testBtn) {
      this.testBtn.addEventListener('click', () => this.handleTestConnection());
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveConfig();
      });
    }

    if (this.pushBtn) {
      this.pushBtn.addEventListener('click', () => this.handlePushLocalToCloud());
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.handleClearConfig());
    }

    // 4. Listen for status changes
    window.addEventListener('cloud-sync-status-changed', (e) => {
      this.updateBadge(e.detail || CloudSyncService.getStatus());
    });

    // Initial badge update
    this.updateBadge(CloudSyncService.getStatus());
  }

  updateBadge(status) {
    if (!this.badgeBtn || !this.badgeText) return;

    if (status.isCloudConnected) {
      this.badgeBtn.className = 'btn-cloud-sync connected';
      this.badgeText.textContent = 'Cloud Synced 🟢';
      this.badgeBtn.title = 'Live Multi-Device Cloud Sync is ACTIVE. All updates are visible to everyone.';
      if (this.badgeDot) this.badgeDot.className = 'cloud-sync-dot connected';
    } else if (status.isConfigured) {
      this.badgeBtn.className = 'btn-cloud-sync connecting';
      this.badgeText.textContent = 'Connecting 🟡';
      this.badgeBtn.title = 'Connecting to Cloud Database...';
      if (this.badgeDot) this.badgeDot.className = 'cloud-sync-dot connecting';
    } else {
      this.badgeBtn.className = 'btn-cloud-sync local-only';
      this.badgeText.textContent = 'Multi-Device Sync ☁️';
      this.badgeBtn.title = 'Changes are currently local to this device. Click to connect Free Cloud Database so all devices can see updates.';
      if (this.badgeDot) this.badgeDot.className = 'cloud-sync-dot local-only';
    }
  }

  openModal() {
    if (!this.modal) return;
    this.populateModalFields();
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    if (this.feedbackEl) this.feedbackEl.style.display = 'none';
  }

  populateModalFields() {
    const config = getActiveCloudConfig();
    const status = CloudSyncService.getStatus();

    if (this.apiKeyInput) this.apiKeyInput.value = config.apiKey || '';
    if (this.dbUrlInput) this.dbUrlInput.value = config.databaseURL || '';
    if (this.projectIdInput) this.projectIdInput.value = config.projectId || '';
    if (this.appIdInput) this.appIdInput.value = config.appId || '';

    if (this.statusTag) {
      if (status.isCloudConnected) {
        this.statusTag.className = 'cloud-status-badge success';
        this.statusTag.textContent = '🟢 Live Cloud Connected';
      } else if (status.isConfigured) {
        this.statusTag.className = 'cloud-status-badge warning';
        this.statusTag.textContent = '🟡 Connecting / Offline';
      } else {
        this.statusTag.className = 'cloud-status-badge info';
        this.statusTag.textContent = '⚪ Local Storage Mode (Not Synced Across Devices)';
      }
    }

    if (this.statusDetails) {
      if (status.isCloudConnected) {
        this.statusDetails.textContent = `Connected to Realtime Database (${status.configSummary}). Every change made here updates instantly on all other phones and computers.`;
      } else if (status.isConfigured) {
        this.statusDetails.textContent = `Configured for ${status.configSummary}. Connecting to cloud...`;
      } else {
        this.statusDetails.textContent = 'Currently, added videos and updates are saved only in this browser. Connect a free Firebase Realtime Database below so everyone can see your updates on any device.';
      }
    }

    if (this.lastSyncSpan) {
      if (status.lastSyncTimestamp > 0) {
        const d = new Date(status.lastSyncTimestamp);
        this.lastSyncSpan.textContent = d.toLocaleTimeString() + ', ' + d.toLocaleDateString();
      } else {
        this.lastSyncSpan.textContent = 'Never';
      }
    }
  }

  getFormData() {
    let dbUrl = this.dbUrlInput ? this.dbUrlInput.value.trim() : '';
    let projectId = this.projectIdInput ? this.projectIdInput.value.trim() : '';
    const apiKey = this.apiKeyInput ? this.apiKeyInput.value.trim() : '';
    const appId = this.appIdInput ? this.appIdInput.value.trim() : '';

    if (dbUrl) {
      if (!/^https?:\/\//i.test(dbUrl)) {
        dbUrl = 'https://' + dbUrl;
      }
      dbUrl = dbUrl.replace(/\/+$/, '');
      if (!projectId) {
        const match = dbUrl.match(/https?:\/\/([^.]+)/i);
        if (match && match[1]) projectId = match[1];
      }
    }

    return {
      apiKey,
      databaseURL: dbUrl,
      projectId,
      appId
    };
  }

  showFeedback(msg, type = 'info') {
    if (!this.feedbackEl) return;
    this.feedbackEl.textContent = msg;
    this.feedbackEl.className = `cloud-feedback-box ${type}`;
    this.feedbackEl.style.display = 'block';
  }

  async handleTestConnection() {
    const config = this.getFormData();
    this.showFeedback('Testing connection to Firebase...', 'info');

    const result = await CloudSyncService.testConnection(config);
    if (result.success) {
      this.showFeedback(result.message, 'success');
    } else {
      this.showFeedback(result.message, 'error');
    }
  }

  async handleSaveConfig() {
    const config = this.getFormData();
    if (!config.databaseURL && !config.projectId) {
      this.showFeedback('Please enter your Database URL or Project ID.', 'warning');
      return;
    }

    this.showFeedback('Saving configuration & establishing live connection...', 'info');

    saveCustomCloudConfig(config);
    const success = await CloudSyncService.setupFirebase(config);

    if (success) {
      this.showFeedback('🎉 Connected! Now pushing current local data to cloud...', 'success');
      await CloudSyncService.pushAllLocalToCloud();
      this.populateModalFields();
      this.updateBadge(CloudSyncService.getStatus());
      setTimeout(() => {
        this.showFeedback('✨ Live Multi-Device Sync is active! All devices will now see updates.', 'success');
      }, 1000);
    } else {
      this.showFeedback('⚠️ Config saved, but could not connect immediately. Please verify Database URL & rules.', 'warning');
      this.populateModalFields();
      this.updateBadge(CloudSyncService.getStatus());
    }
  }

  async handlePushLocalToCloud() {
    this.showFeedback('Uploading local videos & memories to the cloud...', 'info');
    const res = await CloudSyncService.pushAllLocalToCloud();
    if (res.success) {
      this.showFeedback(res.message, 'success');
      this.populateModalFields();
    } else {
      this.showFeedback(res.message, 'error');
    }
  }

  async handleClearConfig() {
    if (confirm('Disconnect from Cloud Database and reset to Local Storage mode?')) {
      saveCustomCloudConfig(null);
      if (CloudSyncService.database) {
        try { CloudSyncService.database.goOffline(); } catch (e) {}
        CloudSyncService.database = null;
      }
      if (CloudSyncService.firebaseApp) {
        try { await CloudSyncService.firebaseApp.delete(); } catch (e) {}
        CloudSyncService.firebaseApp = null;
      }
      CloudSyncService.isCloudConnected = false;
      CloudSyncService.emitStatus();
      this.populateModalFields();
      this.updateBadge(CloudSyncService.getStatus());
      this.showFeedback('Disconnected. Running in local storage mode.', 'info');
    }
  }
}
