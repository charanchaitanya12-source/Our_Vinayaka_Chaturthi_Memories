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

import { memoriesData } from '../data/memoriesData.js';

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
    this.storageKey = 'vinayaka_gang_profiles_v8';
    this.deletedKey = 'vinayaka_deleted_friend_ids_v8';
    this.currentUploadedPhoto = null;
    this.friends = [];

    this.init();
  }

  init() {
    this.loadFriends();
    this.render();
    this.setupAddMemberEvents();
    this.setupEditorEvents();

    // Re-render when external refresh requested
    window.addEventListener('refresh-friends', () => this.render());
  }

  getDeletedIds() {
    try {
      const stored = localStorage.getItem(this.deletedKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  markDeleted(id) {
    if (!id) return;
    try {
      const deleted = this.getDeletedIds();
      if (!deleted.includes(id)) {
        deleted.push(id);
        localStorage.setItem(this.deletedKey, JSON.stringify(deleted));
      }
    } catch (e) {
      console.warn('Could not save deleted friend id:', e);
    }
  }

  loadFriends() {
    const deletedIds = this.getDeletedIds();

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasOldPlaceholders = parsed.some(f => f.name && f.name.startsWith('Friend '));
          if (!hasOldPlaceholders) {
            this.friends = parsed.filter(f => !deletedIds.includes(f.id));
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Error reading stored friends data:', e);
    }

    // Default to the curated memoriesData.friends
    this.friends = memoriesData.friends.filter(f => !deletedIds.includes(f.id)).map(f => {
      if (f.id === 'friend-sai-nikhil' || f.name.toLowerCase().includes('sai nikhil')) {
        return {
          ...f,
          photos: f.photos && f.photos.length >= 3 ? f.photos : [
            'assets/images/tribute/tribute_solo_smile_pines.jpg',
            'assets/images/tribute/tribute_solo_night_smile.jpg',
            'assets/images/tribute/tribute_group_araku_pinery.jpg'
          ]
        };
      } else {
        return {
          ...f,
          photos: [f.photos ? f.photos[0] : 'assets/images/gang/gang_member_1.jpg']
        };
      }
    });

    this.saveFriends();
  }

  saveFriends() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.friends));
    } catch (e) {
      console.warn('Could not save friends data to localStorage:', e);
    }
  }

  render() {
    if (!this.container) return;

    const deletedIds = this.getDeletedIds();
    const visibleFriends = this.friends.filter(f => !deletedIds.includes(f.id));

    // Separate Sai Nikhil from standard square members
    const saiNikhil = visibleFriends.find(f => f.id === 'friend-sai-nikhil' || f.name.toLowerCase().includes('sai nikhil'));
    const standardFriends = visibleFriends.filter(f => f !== saiNikhil);

    // 1. Render Grid of Smaller Square Cards
    const standardCardsHtml = standardFriends.map((friend, idx) => {
      const photos = friend.photos || (friend.avatar ? [friend.avatar] : ['assets/images/gang/gang_member_1.jpg']);
      const photoSrc = photos[0] || 'assets/images/gang/gang_member_1.jpg';

      return `
        <div class="friend-card standard-square-card reveal-item reveal-delay-${(idx % 3) + 1}" data-friend-id="${friend.id}" id="card-${friend.id}">
          <div class="square-photo-wrapper">
            <img class="square-friend-avatar" src="${photoSrc}" alt="${friend.name}" loading="lazy" />
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

    // 2. Permanent '+ Add' Button formatted as an empty square card in the grid
    const addMemberSquareCardHtml = `
      <div class="friend-card standard-square-card add-member-square-card reveal-item reveal-delay-3" id="card-add-new-member" role="button" tabindex="0" title="Add a new member to The Gang">
        <div class="add-square-icon-box">
          <span class="add-square-plus">➕</span>
        </div>
        <div class="square-card-content">
          <h4 class="square-friend-name" style="color: var(--gold-300);">Add Member</h4>
          <div class="square-friend-subnames" style="color: var(--text-muted);">+ New Person</div>
          <button type="button" class="btn-primary square-btn-add" style="margin-top: 0.35rem; font-size: 0.72rem; padding: 0.25rem 0.75rem;">
            <span>+ Add</span>
          </button>
        </div>
      </div>
    `;

    // 3. Standalone Tall Vertical Column for Sai Nikhil
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

    const tallColumnHtml = `
      <div class="tall-sai-column-wrapper reveal-item reveal-delay-2">
        <div class="friend-card tall-sai-card" data-friend-id="${saiId}" id="card-${saiId}">
          <div class="tall-sai-badge"><span>✨</span> In Loving Memory</div>
          <div class="tall-sai-photos-stack">
            ${saiPhotos.map((p, pIdx) => `
              <div class="tall-sai-photo-item">
                <img class="tall-sai-avatar" src="${p}" alt="${saiName} Photo ${pIdx + 1}" loading="lazy" />
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

    // 4. Main 2-Area Layout
    this.container.innerHTML = `
      <div class="gang-split-layout">
        <!-- Area 1: Standard Members Square Grid -->
        <div class="gang-grid-side">
          <div class="standard-members-grid">
            ${standardCardsHtml}
            ${addMemberSquareCardHtml}
          </div>
        </div>

        <!-- Area 2: Standalone Tall Vertical Column -->
        <div class="gang-tall-side">
          ${tallColumnHtml}
        </div>
      </div>
    `;

    // Attach click events for "View Moments" (Lightbox trigger)
    this.container.querySelectorAll('.btn-view-moments').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const friendId = btn.getAttribute('data-friend-id');
        const friend = this.friends.find(f => f.id === friendId);
        if (friend) {
          const firstPhoto = (friend.photos && friend.photos[0]) || 'assets/images/gang/gang_member_1.jpg';
          window.dispatchEvent(new CustomEvent('open-lightbox', {
            detail: {
              src: firstPhoto,
              type: 'image',
              title: `${friend.name}'s Memories`,
              caption: `Cherished festival moments and lifelong brotherhood with ${friend.name}.`,
              category: 'The Gang'
            }
          }));
        }
      });
    });

    // Attach click events on the Add Member Square Card
    const addCard = document.getElementById('card-add-new-member');
    if (addCard) {
      addCard.addEventListener('click', () => this.openAddMemberModal());
      addCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openAddMemberModal();
        }
      });
    }

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

  handlePhotoFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      this.currentUploadedPhoto = event.target.result;
      if (this.addMemberPreviewImg) {
        this.addMemberPreviewImg.src = this.currentUploadedPhoto;
      }
      if (this.addMemberDropzone) {
        this.addMemberDropzone.classList.add('has-photo');
        const textEl = this.addMemberDropzone.querySelector('.dropzone-text');
        if (textEl) textEl.textContent = `Selected: ${file.name}`;
      }
    };
    reader.readAsDataURL(file);
  }

  openAddMemberModal() {
    if (!this.addMemberModal) return;

    // Reset Form
    if (this.addMemberForm) this.addMemberForm.reset();
    this.currentUploadedPhoto = 'assets/images/gang/gang_member_1.jpg';
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

    const photo = this.currentUploadedPhoto || 'assets/images/gang/gang_member_1.jpg';
    const newId = 'friend-member-' + Date.now();

    const newMember = {
      id: newId,
      name: name,
      nickname: nickname || undefined,
      photos: [photo],
      taggedMoments: ['gal-1', 'gal-2']
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

    if (this.saveAllBtn) {
      this.saveAllBtn.addEventListener('click', () => {
        this.saveFriends();
        this.render();
        this.closeEditor();
        window.dispatchEvent(new CustomEvent('refresh-friends'));
      });
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
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhotoSrc = event.target.result;
          this.friends[idx].photos = [newPhotoSrc];
          this.renderEditorList();
        };
        reader.readAsDataURL(file);
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
