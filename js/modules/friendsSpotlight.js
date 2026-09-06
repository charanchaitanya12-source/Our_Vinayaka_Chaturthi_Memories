/**
 * ============================================================================
 * THE GANG / FRIEND SPOTLIGHT CONTROLLER
 * ============================================================================
 * Two-area visual layout:
 * 1. Standard Members Grid (Narendra, Sai, Ramesh, Pradeep, Chinna, custom
 *    members, plus empty "+ Add" square card) in a neat 3-card-per-row grid of
 *    smaller square boxes.
 * 2. Standalone Tall Vertical Column for Sai Nikhil Raj Muppana (3 stacked photos).
 */

import { memoriesData } from '../data/memoriesData.js?v=4.4';
import { CloudSyncService } from '../services/cloudSyncService.js?v=4.4';

export class FriendsController {
  constructor(containerId = 'friends-grid-container') {
    this.container = document.getElementById(containerId);
    
    // Add Member Modal Elements
    this.addMemberModal = document.getElementById('add-member-modal');
    this.addMemberModalClose = document.getElementById('add-member-modal-close');
    this.addMemberCancelBtn = document.getElementById('btn-cancel-add-member');
    this.addMemberForm = document.getElementById('add-member-form');
    this.addMemberNameInput = document.getElementById('input-add-member-name');
    this.addMemberRoleInput = document.getElementById('input-add-member-role');
    this.addMemberFileInput = document.getElementById('input-add-member-file');
    this.addMemberDropzone = document.getElementById('add-member-dropzone');
    this.addMemberPreviewImg = document.getElementById('add-member-preview-img');
    this.addMemberPreviewName = document.getElementById('add-member-preview-name');
    this.addMemberPreviewRole = document.getElementById('add-member-preview-role');

    // Trigger Buttons
    this.navAddBtn = document.getElementById('btn-nav-add-member');
    this.headerAddBtn = document.getElementById('btn-open-add-member');
    this.editBtn = document.getElementById('btn-edit-friends');

    // Editor Modal Elements
    this.editorModal = document.getElementById('friend-editor-modal');
    this.editorModalClose = document.getElementById('friend-editor-close');
    this.editorList = document.getElementById('friend-editor-list');
    this.addFriendBtn = document.getElementById('btn-add-new-friend');
    this.saveAllBtn = document.getElementById('btn-save-friends');

    // Storage Keys
    this.storageKey = 'vinayaka_saved_gang_v14';
    this.deletedKey = 'vinayaka_deleted_friend_ids_v14';
    this.currentUploadedPhoto = null;
    this.friends = [];

    // Reset Defaults Button
    this.resetDefaultBtn = document.getElementById('btn-reset-friends-default');
    this.exportGangCodeBtn = document.getElementById('btn-export-gang-code');

    // Purge old legacy keys to prevent stale overrides
    this.purgeLegacyCaches();

    this.init();
  }

  static compressImage(file, maxDimension = 400, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  purgeLegacyCaches() {
    try {
      // Only purge deprecated legacy keys (v1 to v5), preserve active v14 and cloud sync keys
      const legacyKeys = ['vinayaka_gang_v1', 'vinayaka_gang_v2', 'vinayaka_saved_gang_v1', 'vinayaka_saved_gang_v2'];
      legacyKeys.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }

  async init() {
    this.purgeLegacyCaches();
    await this.loadFriends();
    this.render();

    // Subscribe to live real-time gang updates across all devices
    CloudSyncService.subscribeGang((gang) => {
      if (Array.isArray(gang) && gang.length > 0) {
        this.friends = gang;
        this.render();
      }
    });

    // Re-render when external refresh requested
    window.addEventListener('refresh-friends', () => {
      this.render();
    });
  }

  getDeletedIds() {
    return [];
  }

  markDeleted(id) {}

  async loadFriends() {
    // 1. Fetch from Cloud Database first (multi-device source of truth)
    const cloudGang = await CloudSyncService.fetchGang();
    if (cloudGang && Array.isArray(cloudGang.friends) && cloudGang.friends.length > 0) {
      this.friends = cloudGang.friends;
      return;
    }

    // 2. Check local storage cache
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.friends = parsed;
          return;
        }
      } catch (e) {}
    }

    this.friends = (memoriesData.friends || []).map(f => {
      if (f.id === 'friend-sai-nikhil' || (f.name && f.name.toLowerCase().includes('sai nikhil'))) {
        return {
          id: f.id || 'friend-sai-nikhil',
          name: f.name || 'Sai Nikhil Raj Muppana',
          nickname: f.nickname || 'Sai Nikhil',
          photos: (f.photos && f.photos.length >= 3) ? [...f.photos] : [
            'assets/images/tribute/tribute_solo_smile_pines.jpg',
            'assets/images/tribute/tribute_solo_night_smile.jpg',
            'assets/images/tribute/tribute_group_araku_pinery.jpg'
          ],
          taggedMoments: f.taggedMoments || ['gal-1', 'gal-2']
        };
      }
      if (f.id === 'friend-pradeep' || (f.name && f.name.toLowerCase().includes('pradeep'))) {
        return {
          id: 'friend-pradeep',
          name: 'Pradeep',
          nickname: f.nickname || 'The Gang',
          photos: (f.photos && f.photos.length > 0) ? [...f.photos] : [
            'assets/images/gang/gang_member_pradeep.jpg',
            'assets/images/gang/real_gang_pradeep.jpg'
          ],
          taggedMoments: f.taggedMoments || ['gal-1', 'gal-2']
        };
      }
      if (f.id === 'friend-ramesh' || (f.name && f.name.toLowerCase().includes('ramesh'))) {
        return {
          id: 'friend-ramesh',
          name: 'Ramesh',
          nickname: f.nickname || 'The Gang',
          photos: (f.photos && f.photos.length > 0) ? [...f.photos] : ['assets/images/gang/gang_member_ramesh.jpg'],
          taggedMoments: f.taggedMoments || ['gal-1', 'gal-2', 'gal-13']
        };
      }
      if (f.id === 'friend-teja' || (f.name && f.name.toLowerCase().includes('teja'))) {
        return {
          id: 'friend-teja',
          name: 'Teja',
          nickname: f.nickname || 'The Gang',
          photos: (f.photos && f.photos.length > 0) ? [...f.photos] : [
            'assets/images/gang/gang_member_teja.jpg',
            'assets/images/gang/real_gang_teja.jpg'
          ],
          taggedMoments: f.taggedMoments || ['gal-1', 'gal-2', 'gal-12']
        };
      }
      if (f.id === 'friend-charan' || (f.name && f.name.toLowerCase().includes('charan'))) {
        return {
          id: 'friend-charan',
          name: 'Charan',
          nickname: f.nickname || 'The Gang',
          photos: (f.photos && f.photos.length > 0) ? [...f.photos] : [
            'assets/images/gang/gang_member_charan.jpg',
            'assets/images/gang/real_gang_charan.jpg'
          ],
          taggedMoments: f.taggedMoments || ['gal-1', 'gal-2', 'gal-11']
        };
      }
      if (f.id === 'friend-hamu' || (f.name && (f.name.toLowerCase().includes('hamu') || f.name.toLowerCase().includes('hemu')))) {
        return {
          id: 'friend-hamu',
          name: 'Hemu',
          nickname: f.nickname || 'The Gang',
          photos: (f.photos && f.photos.length > 0) ? [...f.photos] : [
            'assets/images/gang/gang_member_hamu.jpg',
            'assets/images/gang/real_gang_hamu.jpg'
          ],
          taggedMoments: f.taggedMoments || ['gal-1', 'gal-2']
        };
      }
      if (f.id === 'friend-narendra' || (f.name && f.name.toLowerCase().includes('narendra'))) {
        return {
          id: 'friend-narendra',
          name: 'Narendra',
          nickname: f.nickname || 'The Gang',
          photos: (f.photos && f.photos.length > 0) ? [...f.photos] : [
            'assets/images/gang/gang_member_narendra.jpg',
            'assets/images/gang/real_gang_narendra.jpg'
          ],
          taggedMoments: f.taggedMoments || ['gal-1', 'gal-2', 'gal-3']
        };
      }
      if (f.id === 'friend-chinna' || (f.name && f.name.toLowerCase().includes('chinna'))) {
        return {
          id: 'friend-chinna',
          name: 'Chinna',
          nickname: f.nickname || 'The Gang',
          photos: (f.photos && f.photos.length > 0) ? [...f.photos] : [
            'assets/images/gang/gang_member_chinna.jpg',
            'assets/images/gang/real_gang_chinna.jpg'
          ],
          taggedMoments: f.taggedMoments || ['gal-1', 'gal-2', 'gal-7']
        };
      }
      if (f.id === 'friend-committee' || (f.name && f.name.toLowerCase().includes('committee'))) {
        return {
          id: 'friend-committee',
          name: 'Committee',
          nickname: f.nickname || 'Utsav Committee',
          photos: (f.photos && f.photos.length > 0) ? [...f.photos] : [
            'assets/images/gang/gang_member_committee.jpg',
            'assets/images/gang/real_gang_committee.jpg'
          ],
          taggedMoments: f.taggedMoments || ['gal-1', 'gal-2', 'gal-3', 'gal-14']
        };
      }
      return {
        id: f.id,
        name: f.name,
        nickname: f.nickname || 'The Gang',
        photos: (f.photos && f.photos.length > 0) ? [...f.photos] : ['assets/images/gang/gang_member_ramesh.jpg'],
        taggedMoments: f.taggedMoments || ['gal-1', 'gal-2']
      };
    });
  }

  saveFriends() {
    try {
      const now = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(this.friends));
      localStorage.setItem('vinayaka_gang_last_updated', now.toString());

      if (this.channel) {
        this.channel.postMessage({ type: 'GANG_UPDATED', timestamp: now });
      }
      CloudSyncService.saveGang(this.friends);
    } catch (e) {
      console.warn('Could not save friends data to localStorage:', e);
    }
  }

  resetDefaults() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.deletedKey);
    } catch (e) {}
    this.loadFriends();
    this.render();
    CloudSyncService.saveGang(this.friends);
    this.showToast("↺ Reset gang members back to defaults & synced!");
  }

  showToast(message) {
    let toast = document.getElementById('festive-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'festive-toast';
      toast.className = 'festive-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  render() {
    if (!this.container) return;

    const visibleFriends = this.friends;

    // Separate Sai Nikhil from standard square members
    const saiNikhil = visibleFriends.find(f => f.id === 'friend-sai-nikhil' || (f.name && f.name.toLowerCase().includes('sai nikhil')));
    const standardFriends = visibleFriends.filter(f => f !== saiNikhil);

    // 1. Render Grid of Smaller Square Cards
    const standardCardsHtml = standardFriends.map((friend, idx) => {
      const photos = (friend.photos && friend.photos.length > 0) ? friend.photos : (friend.avatar ? [friend.avatar] : ['assets/images/gang/gang_member_ramesh.jpg']);
      const photoSrc = photos[0] || 'assets/images/gang/gang_member_ramesh.jpg';

      return `
        <div class="friend-card standard-square-card reveal-item reveal-delay-${(idx % 3) + 1}" data-friend-id="${friend.id}" id="card-${friend.id}">
          <div class="square-photo-wrapper">
            <img class="square-friend-avatar" src="${photoSrc}?v=4.4" alt="${friend.name}" loading="lazy" />
          </div>
          <div class="square-card-content">
            <h4 class="square-friend-name" title="${friend.name}">${friend.name}</h4>
            ${friend.nickname ? `
              <div class="square-friend-subnames" title="${friend.nickname}">✨ ${friend.nickname}</div>
            ` : ''}
            <button class="btn-view-moments square-btn-moments" data-friend-id="${friend.id}">
              Moments (${(friend.taggedMoments || []).length || 'All'})
            </button>
          </div>
        </div>
      `;
    }).join('');

    // 2. Standalone Showcase for Sai Nikhil
    const saiPhotos = (saiNikhil && saiNikhil.photos && saiNikhil.photos.length >= 3)
      ? saiNikhil.photos
      : [
          'assets/images/tribute/tribute_solo_smile_pines.jpg',
          'assets/images/tribute/tribute_solo_night_smile.jpg',
          'assets/images/tribute/tribute_group_araku_pinery.jpg'
        ];
    const saiName = saiNikhil ? saiNikhil.name : 'Sai Nikhil Raj Muppana';
    const saiNickname = (saiNikhil && saiNikhil.nickname) || 'Sai Nikhil';
    const saiId = saiNikhil ? saiNikhil.id : 'friend-sai-nikhil';

    if (standardFriends.length > 0) {
      const tallColumnHtml = `
        <div class="tall-sai-column-wrapper reveal-item reveal-delay-2">
          <div class="friend-card tall-sai-card" data-friend-id="${saiId}" id="card-${saiId}">
            <div class="tall-sai-badge"><span>✨</span> In Loving Memory</div>
            <div class="tall-sai-photos-stack">
              ${saiPhotos.map((p, pIdx) => `
                <div class="tall-sai-photo-item">
                  <img class="tall-sai-avatar" src="${p}?v=4.4" alt="${saiName} Photo ${pIdx + 1}" loading="lazy" />
                </div>
              `).join('')}
            </div>
            <div class="tall-sai-card-content">
              <h4 class="tall-sai-name">${saiName}</h4>
              <div class="tall-sai-subnames">✨ ${saiNickname}</div>
              <button class="btn-view-moments tall-sai-btn-moments" data-friend-id="${saiId}">
                View Moments (${(saiNikhil && saiNikhil.taggedMoments ? saiNikhil.taggedMoments.length : 2)})
              </button>
            </div>
          </div>
        </div>
      `;

      this.container.innerHTML = `
        <div class="gang-split-layout">
          <!-- Area 1: Standard Members Square Grid -->
          <div class="gang-grid-side">
            <div class="standard-members-grid">
              ${standardCardsHtml}
            </div>
          </div>

          <!-- Area 2: Standalone Tall Vertical Column -->
          <div class="gang-tall-side">
            ${tallColumnHtml}
          </div>
        </div>
      `;
    } else {
      // Single-member fallback
      this.container.innerHTML = `
        <div class="gang-single-member-showcase reveal-item reveal-delay-1">
          <div class="friend-card tall-sai-card single-hero-card" data-friend-id="${saiId}" id="card-${saiId}">
            <div class="tall-sai-badge"><span>✨</span> In Loving Memory • Forever In Our Hearts</div>
            
            <div class="tall-sai-photos-horizontal">
              ${saiPhotos.map((p, pIdx) => `
                <div class="tall-sai-photo-item hero-photo-item">
                  <img class="tall-sai-avatar" src="${p}" alt="${saiName} Photo ${pIdx + 1}" loading="lazy" />
                </div>
              `).join('')}
            </div>

            <div class="tall-sai-card-content">
              <h3 class="tall-sai-name" style="font-size: 1.65rem; color: var(--gold-300); margin-bottom: 0.35rem;">${saiName}</h3>
              <div class="tall-sai-subnames" style="font-size: 1.05rem; margin-bottom: 0.75rem;">✨ ${saiNickname}</div>
              <button class="btn-view-moments tall-sai-btn-moments" data-friend-id="${saiId}" style="font-size: 0.88rem; padding: 0.5rem 1.4rem;">
                View Moments (${(saiNikhil && saiNikhil.taggedMoments ? saiNikhil.taggedMoments.length : 2)})
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Attach click events for cards & "View Moments" (Lightbox trigger)
    this.container.querySelectorAll('.friend-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const friendId = card.getAttribute('data-friend-id');
        const friend = this.friends.find(f => f.id === friendId) || this.friends[0];
        if (friend) {
          const firstPhoto = (friend.photos && friend.photos[0]) || 'assets/images/tribute/tribute_solo_smile_pines.jpg';
          window.dispatchEvent(new CustomEvent('open-lightbox', {
            detail: {
              src: firstPhoto,
              type: 'image',
              title: `${friend.name}'s Memories`,
              caption: `Cherished festival moments and timeless remembrance of ${friend.name}.`,
              category: 'The Gang'
            }
          }));
        }
      });
    });

    this.container.querySelectorAll('.btn-view-moments').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const friendId = btn.getAttribute('data-friend-id');
        const friend = this.friends.find(f => f.id === friendId) || this.friends[0];
        if (friend) {
          const firstPhoto = (friend.photos && friend.photos[0]) || 'assets/images/tribute/tribute_solo_smile_pines.jpg';
          window.dispatchEvent(new CustomEvent('open-lightbox', {
            detail: {
              src: firstPhoto,
              type: 'image',
              title: `${friend.name}'s Memories`,
              caption: `Cherished festival moments and timeless remembrance of ${friend.name}.`,
              category: 'The Gang'
            }
          }));
        }
      });
    });

    // Refresh scroll reveals
    window.dispatchEvent(new CustomEvent('refresh-reveals'));
  }

  /* --------------------------------------------------------------------------
     ADD MEMBER MODAL & UPLOAD WORKFLOW
     -------------------------------------------------------------------------- */
  setupAddMemberEvents() {
    // Open modal triggers
    if (this.navAddBtn) {
      this.navAddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openAddMemberModal();
      });
    }

    if (this.headerAddBtn) {
      this.headerAddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openAddMemberModal();
      });
    }

    // Close modal triggers
    if (this.addMemberModalClose) {
      this.addMemberModalClose.addEventListener('click', () => this.closeAddMemberModal());
    }

    if (this.addMemberCancelBtn) {
      this.addMemberCancelBtn.addEventListener('click', () => this.closeAddMemberModal());
    }

    if (this.addMemberModal) {
      this.addMemberModal.addEventListener('click', (e) => {
        if (e.target === this.addMemberModal) this.closeAddMemberModal();
      });
    }

    // Live preview updates from Name and Role inputs
    if (this.addMemberNameInput) {
      this.addMemberNameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (this.addMemberPreviewName) {
          this.addMemberPreviewName.textContent = val || 'New Member';
        }
      });
    }

    if (this.addMemberRoleInput) {
      this.addMemberRoleInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (this.addMemberPreviewRole) {
          this.addMemberPreviewRole.textContent = val ? `✨ ${val}` : '✨ The Gang';
        }
      });
    }

    // Photo file upload & Drag and Drop
    if (this.addMemberFileInput) {
      this.addMemberFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.handlePhotoFile(file);
      });
    }

    if (this.addMemberDropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        this.addMemberDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.addMemberDropzone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.addMemberDropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.addMemberDropzone.classList.remove('drag-over');
        });
      });

      this.addMemberDropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file && file.type.startsWith('image/')) {
          this.handlePhotoFile(file);
        }
      });
    }

    // Form Submission
    if (this.addMemberForm) {
      this.addMemberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleMemberSubmit();
      });
    }
  }

  async handlePhotoFile(file) {
    if (!file) return;
    try {
      this.currentUploadedPhoto = await FriendsController.compressImage(file, 600, 0.8);
      if (this.addMemberPreviewImg) {
        this.addMemberPreviewImg.src = this.currentUploadedPhoto;
      }
      if (this.addMemberDropzone) {
        this.addMemberDropzone.classList.add('has-photo');
        const textEl = this.addMemberDropzone.querySelector('.dropzone-text');
        if (textEl) textEl.textContent = `Selected: ${file.name}`;
      }
    } catch (e) {
      console.warn('Error compressing photo:', e);
    }
  }

  openAddMemberModal() {
    if (!this.addMemberModal) return;

    // Reset Form
    if (this.addMemberForm) this.addMemberForm.reset();
    this.currentUploadedPhoto = 'assets/images/gang/gang_member_ramesh.jpg';
    if (this.addMemberPreviewImg) {
      this.addMemberPreviewImg.src = this.currentUploadedPhoto;
    }
    if (this.addMemberPreviewName) this.addMemberPreviewName.textContent = 'New Member';
    if (this.addMemberPreviewRole) this.addMemberPreviewRole.textContent = '✨ The Gang';
    if (this.addMemberDropzone) {
      this.addMemberDropzone.classList.remove('has-photo', 'drag-over');
      const textEl = this.addMemberDropzone.querySelector('.dropzone-text');
      if (textEl) textEl.textContent = 'Click to choose or drag & drop photo';
    }

    this.addMemberModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus input
    setTimeout(() => {
      if (this.addMemberNameInput) this.addMemberNameInput.focus();
    }, 150);
  }

  closeAddMemberModal() {
    if (!this.addMemberModal) return;
    this.addMemberModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  handleMemberSubmit() {
    const name = this.addMemberNameInput ? this.addMemberNameInput.value.trim() : '';
    const nickname = this.addMemberRoleInput ? this.addMemberRoleInput.value.trim() : '';

    if (!name) {
      alert('Please enter a member name!');
      return;
    }

    const photo = this.currentUploadedPhoto || 'assets/images/gang/gang_member_ramesh.jpg';
    const newId = 'friend-custom-' + Date.now();

    const newMember = {
      id: newId,
      name: name,
      nickname: nickname || undefined,
      photos: [photo],
      taggedMoments: ['gal-1', 'gal-2'],
      isCustom: true
    };

    // Add to friends list
    this.friends.push(newMember);
    this.saveFriends();
    this.render();
    this.closeAddMemberModal();

    // Scroll to the newly created member card with smooth highlight animation
    setTimeout(() => {
      const newCard = document.getElementById(`card-${newId}`);
      if (newCard) {
        newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newCard.classList.add('card-just-added');
        setTimeout(() => newCard.classList.remove('card-just-added'), 2500);
      }
    }, 200);
  }

  /* --------------------------------------------------------------------------
     EXISTING FRIEND EDITOR MODAL WORKFLOW
     -------------------------------------------------------------------------- */
  setupEditorEvents() {
    if (this.editBtn) {
      this.editBtn.addEventListener('click', () => this.openEditor());
    }

    if (this.editorModalClose) {
      this.editorModalClose.addEventListener('click', () => this.closeEditor());
    }

    if (this.editorModal) {
      this.editorModal.addEventListener('click', (e) => {
        if (e.target === this.editorModal) this.closeEditor();
      });
    }

    if (this.addFriendBtn) {
      this.addFriendBtn.addEventListener('click', () => {
        this.closeEditor();
        this.openAddMemberModal();
      });
    }

    // QR Code Sync Modal Elements
    const syncQrModal = document.getElementById('sync-qr-modal');
    const syncQrClose = document.getElementById('sync-qr-close');
    const syncQrImg = document.getElementById('sync-qr-img');
    const showSyncQrBtn = document.getElementById('btn-show-sync-qr');
    const shareGangLinkBtn = document.getElementById('btn-share-gang-link');
    const copySyncLinkInsideQrBtn = document.getElementById('btn-copy-sync-link-inside-qr');
    const importGangCodeBtn = document.getElementById('btn-import-gang-code');

    if (showSyncQrBtn) {
      showSyncQrBtn.addEventListener('click', () => {
        const syncUrl = this.generateSyncUrl();
        if (syncQrImg) {
          syncQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(syncUrl)}`;
        }
        if (syncQrModal) {
          syncQrModal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    }

    if (syncQrClose && syncQrModal) {
      syncQrClose.addEventListener('click', () => {
        syncQrModal.classList.remove('active');
        document.body.style.overflow = '';
      });
      syncQrModal.addEventListener('click', (e) => {
        if (e.target === syncQrModal) {
          syncQrModal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }

    const copyLinkAction = () => {
      const syncUrl = this.generateSyncUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(syncUrl).then(() => {
          this.showToast("🔗 Direct Sync Link copied! Open this on your other phone.");
        }).catch(() => {
          prompt("Copy this Sync Link to open on your other phone:", syncUrl);
        });
      } else {
        prompt("Copy this Sync Link to open on your other phone:", syncUrl);
      }
    };

    if (shareGangLinkBtn) {
      shareGangLinkBtn.addEventListener('click', copyLinkAction);
    }
    if (copySyncLinkInsideQrBtn) {
      copySyncLinkInsideQrBtn.addEventListener('click', copyLinkAction);
    }

    if (importGangCodeBtn) {
      importGangCodeBtn.addEventListener('click', () => {
        const input = prompt("Paste your Gang JSON or Sync Link code below:");
        if (!input) return;

        try {
          let parsed = null;
          if (input.includes('sync=')) {
            const rawEncoded = input.split('sync=')[1].split('&')[0];
            const decodedStr = decodeURIComponent(escape(atob(decodeURIComponent(rawEncoded))));
            parsed = JSON.parse(decodedStr);
          } else {
            parsed = JSON.parse(input.trim());
          }

          if (Array.isArray(parsed) && parsed.length > 0) {
            this.friends = parsed;
            this.saveFriends();
            this.render();
            this.renderEditorList();
            this.showToast("🎉 Gang imported successfully!");
          } else {
            alert("Invalid gang data format. Please try again.");
          }
        } catch (err) {
          alert("Could not parse data. Please make sure you copied the full code.");
        }
      });
    }

    if (this.resetDefaultBtn) {
      this.resetDefaultBtn.addEventListener('click', () => {
        if (confirm('Reset all gang members and photos back to original defaults?')) {
          this.resetDefaults();
          this.renderEditorList();
        }
      });
    }

    if (this.exportGangCodeBtn) {
      this.exportGangCodeBtn.addEventListener('click', () => {
        const jsonStr = JSON.stringify(this.friends, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(jsonStr).then(() => {
            this.showToast("📋 Gang code copied to clipboard!");
          }).catch(() => {
            prompt("Copy your updated gang JSON below:", jsonStr);
          });
        } else {
          prompt("Copy your updated gang JSON below:", jsonStr);
        }
      });
    }

    if (this.saveAllBtn) {
      this.saveAllBtn.addEventListener('click', () => {
        // Explicitly scrape all current input values from DOM
        if (this.editorList) {
          const cards = this.editorList.querySelectorAll('.friend-edit-card');
          cards.forEach(card => {
            const idx = parseInt(card.getAttribute('data-index'), 10);
            const nameInput = card.querySelector('.friend-name-input');
            const nickInput = card.querySelector('.friend-nickname-input');
            if (this.friends[idx]) {
              if (nameInput && nameInput.value.trim()) this.friends[idx].name = nameInput.value.trim();
              if (nickInput) this.friends[idx].nickname = nickInput.value.trim() || undefined;
            }
          });
        }

        this.saveFriends();
        this.render();
        this.closeEditor();
        this.showToast("💾 Gang changes saved & synced across devices! ✨");
        window.dispatchEvent(new CustomEvent('refresh-friends'));
      });
    }
  }

  checkForUrlSync() {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    let rawEncoded = null;

    if (hash.includes('sync=')) {
      rawEncoded = hash.split('sync=')[1].split('&')[0];
    } else if (search.includes('sync=')) {
      rawEncoded = search.split('sync=')[1].split('&')[0];
    }

    if (rawEncoded) {
      try {
        const decodedStr = decodeURIComponent(escape(atob(decodeURIComponent(rawEncoded))));
        const parsed = JSON.parse(decodedStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.friends = parsed;
          this.saveFriends();
          this.render();
          this.showToast("🎉 Gang imported & synced successfully from link!");
          try {
            history.replaceState(null, document.title, window.location.pathname);
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Sync import error:', e);
      }
    }
  }

  generateSyncUrl() {
    try {
      const jsonStr = JSON.stringify(this.friends);
      const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
      return `${window.location.origin}${window.location.pathname}#sync=${encoded}`;
    } catch (e) {
      return window.location.href;
    }
  }

  openEditor() {
    if (!this.editorModal) return;
    this.renderEditorList();
    this.editorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeEditor() {
    if (!this.editorModal) return;
    this.editorModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  renderEditorList() {
    if (!this.editorList) return;

    this.editorList.innerHTML = this.friends.map((friend, idx) => {
      const photos = friend.photos || (friend.avatar ? [friend.avatar] : []);

      return `
        <div class="friend-edit-card" data-index="${idx}">
          <div class="friend-edit-header">
            <label class="form-label" style="margin:0; font-weight:700; color:var(--gold-300);">
              #${idx + 1}: ${friend.name}
            </label>
            <button type="button" class="btn-delete-friend" data-index="${idx}" title="Delete this card">
              🗑️ Delete Card
            </button>
          </div>

          <div style="margin-bottom: 0.75rem;">
            <label class="form-label">Member Name *</label>
            <input type="text" class="form-input friend-name-input" data-index="${idx}" value="${friend.name}" placeholder="Enter name" />
          </div>

          <div style="margin-bottom: 0.75rem;">
            <label class="form-label">Nickname / Subtitle</label>
            <input type="text" class="form-input friend-nickname-input" data-index="${idx}" value="${friend.nickname || ''}" placeholder="e.g. Dhol King" />
          </div>

          <div>
            <label class="form-label">Photo (${photos.length})</label>
            <div class="friend-edit-photos-preview">
              ${photos.map((p, pIdx) => `
                <div class="friend-edit-photo-thumb-wrapper">
                  <img class="friend-edit-photo-thumb" src="${p}" alt="Photo ${pIdx + 1}" />
                  ${photos.length > 1 ? `
                    <button type="button" class="btn-remove-photo" data-friend-index="${idx}" data-photo-index="${pIdx}" title="Remove photo">✕</button>
                  ` : ''}
                </div>
              `).join('')}
            </div>

            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
              <input type="file" accept="image/*" class="friend-photo-upload-input" id="friend-upload-${idx}" style="display:none;" />
              <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;" onclick="document.getElementById('friend-upload-${idx}').click()">
                📷 Replace/Add Photo
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach Name inputs
    this.editorList.querySelectorAll('.friend-name-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        if (this.friends[index]) {
          this.friends[index].name = e.target.value;
        }
      });
    });

    // Attach Nickname inputs
    this.editorList.querySelectorAll('.friend-nickname-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'), 10);
        if (this.friends[index]) {
          this.friends[index].nickname = e.target.value;
        }
      });
    });

    // Attach Photo uploads
    this.editorList.querySelectorAll('.friend-photo-upload-input').forEach((input, idx) => {
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        this.showToast("⏳ Compressing photo...");
        try {
          const newPhotoSrc = await FriendsController.compressImage(file, 400, 0.7);
          this.friends[idx].photos = [newPhotoSrc];
          this.renderEditorList();
          this.showToast("📷 Photo updated! Click 'Save Changes' to apply.");
        } catch (err) {
          console.warn('Error compressing photo:', err);
          this.showToast("❌ Could not process photo.");
        }
      });
    });

    // Attach Remove single photo buttons
    this.editorList.querySelectorAll('.btn-remove-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        const fIdx = parseInt(btn.getAttribute('data-friend-index'), 10);
        const pIdx = parseInt(btn.getAttribute('data-photo-index'), 10);
        if (this.friends[fIdx] && this.friends[fIdx].photos) {
          this.friends[fIdx].photos.splice(pIdx, 1);
          this.renderEditorList();
        }
      });
    });

    // Attach Delete friend buttons
    this.editorList.querySelectorAll('.btn-delete-friend').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index'), 10);
        const toDelete = this.friends[index];
        if (toDelete) {
          this.markDeleted(toDelete.id);
          this.friends.splice(index, 1);
          this.saveFriends();
          this.renderEditorList();
        }
      });
    });
  }
}
