<template>
  <div class="announcement-page">
    <section class="header-card">
      <div>
        <p class="eyebrow">CALFFA Notices</p>
        <h1>Announcements</h1>
        <p class="subtitle">Official updates for members in a social-style feed.</p>
      </div>

      <button
        v-if="canCreateAnnouncement"
        class="btn primary header-btn"
        type="button"
        @click="openCreateModal = true"
      >
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 5V19" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
          <path d="M5 12H19" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
        </svg>
        Create Announcement
      </button>
    </section>

    <div v-if="toastMessage" class="toast" :class="toastType">{{ toastMessage }}</div>

    <section class="section">
      <div class="section-head">
        <h2>All Announcements</h2>
        <span>{{ filteredAnnouncements.length }} {{ filteredAnnouncements.length === 1 ? 'item' : 'items' }}</span>
      </div>
      <div class="section-tools">
        <div class="search-input-wrap">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            v-model.trim="searchTitle"
            type="text"
            class="search-input"
            placeholder="Search by title..."
          />
        </div>
        <select v-model="sortOrder" class="sort-select">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      <p v-if="loading" class="muted">Loading announcements...</p>
      <p v-else-if="filteredAnnouncements.length === 0" class="muted">No announcements found.</p>

      <div class="feed-scroll">
        <div class="feed-grid">
          <article v-for="item in filteredAnnouncements" :key="item.id" class="ig-card">
            <div class="ig-top">
              <div class="avatar">{{ authorInitials(item.author_name) }}</div>
              <div class="ig-top-meta">
                <strong class="author-name">{{ item.author_name || item.author_role }}</strong>
                <span class="meta-line">{{ formatDate(item.created_at) }}</span>
              </div>
              <span class="role-pill">{{ item.author_role }}</span>
            </div>

            <img
              v-if="item.image"
              :src="resolveImageUrl(item.image)"
              alt="Announcement image"
              class="ig-image"
              @click="openImagePreview(resolveImageUrl(item.image), item.title || 'Announcement image')"
            />
            <div v-else class="ig-image ig-image-fallback">
              <span class="placeholder-icon">
                <svg class="placeholder-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4 8.5C4 7.67157 4.67157 7 5.5 7H8.1C8.59706 7 9.06195 6.75332 9.34164 6.34164L10.1584 5.15836C10.4381 4.74668 10.9029 4.5 11.4 4.5H12.6C13.0971 4.5 13.5619 4.74668 13.8416 5.15836L14.6584 6.34164C14.9381 6.75332 15.4029 7 15.9 7H18.5C19.3284 7 20 7.67157 20 8.5V17.5C20 18.3284 19.3284 19 18.5 19H5.5C4.67157 19 4 18.3284 4 17.5V8.5Z" stroke="currentColor" stroke-width="1.8"/>
                  <circle cx="12" cy="12.5" r="3.25" stroke="currentColor" stroke-width="1.8"/>
                </svg>
              </span>
              <span class="placeholder-text">Image not available</span>
            </div>

            <div class="ig-actions">
              <span class="action-right">
                <button
                  v-if="canEditAnnouncement(item)"
                  class="icon-btn edit-btn"
                  type="button"
                  title="Edit announcement"
                  @click="openEditModalFn(item)"
                >
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M4 20H8L18.5 9.5C19.3284 8.67157 19.3284 7.32843 18.5 6.5V6.5C17.6716 5.67157 16.3284 5.67157 15.5 6.5L5 17V20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button
                  v-if="canDeleteAnnouncement(item)"
                  class="icon-btn delete-btn"
                  type="button"
                  title="Delete announcement"
                  @click="openDeleteModal(item.id)"
                >
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M5 7H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <path d="M9 7V5.5C9 4.67157 9.67157 4 10.5 4H13.5C14.3284 4 15 4.67157 15 5.5V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <path d="M8 10V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <path d="M12 10V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <path d="M16 10V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <path d="M6.5 7L7.2 18.2C7.26067 19.1707 8.06598 19.9286 9.0386 19.9286H14.9614C15.934 19.9286 16.7393 19.1707 16.8 18.2L17.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                </button>
              </span>
            </div>

            <div class="ig-caption">
              <h3>{{ item.title }}</h3>
              <p>{{ item.content }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <div v-if="openCreateModal" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal">
        <h3>Create Announcement</h3>
        <label>Title</label>
        <input v-model="createForm.title" type="text" maxlength="255" />

        <label>Content</label>
        <textarea v-model="createForm.content" rows="6"></textarea>

        <label>Attach Image (optional)</label>
        <input type="file" accept="image/*" @change="onImageSelected" />
        <p v-if="createForm.imageFileName" class="file-name">Selected: {{ createForm.imageFileName }}</p>

        <div class="modal-actions">
          <button class="btn" type="button" @click="closeCreateModal">Cancel</button>
          <button class="btn primary" type="button" :disabled="submitting" @click="submitCreateAnnouncement">
            {{ submitting ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="openEditModal" class="modal-backdrop" @click.self="closeEditModal">
      <div class="modal">
        <h3>Edit Announcement</h3>
        <label>Title</label>
        <input v-model="editForm.title" type="text" maxlength="255" />

        <label>Content</label>
        <textarea v-model="editForm.content" rows="6"></textarea>

        <label>Update Image (optional)</label>
        <input type="file" accept="image/*" @change="onEditImageSelected" />
        <p v-if="editForm.imageFileName" class="file-name">Selected: {{ editForm.imageFileName }}</p>
        <p v-if="editingAnnouncement?.image && !editForm.imageFileName" class="file-name">Current image will be kept</p>

        <div class="modal-actions">
          <button class="btn" type="button" @click="closeEditModal">Cancel</button>
          <button class="btn primary" type="button" :disabled="submitting" @click="submitEditAnnouncement">
            {{ submitting ? 'Updating...' : 'Update' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="openDeleteConfirmModal" class="modal-backdrop" @click.self="closeDeleteModal">
      <div class="modal delete-modal">
        <h3>Confirm Deletion</h3>
        <p>This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="btn" type="button" @click="closeDeleteModal">Cancel</button>
          <button class="btn danger" type="button" @click="confirmDeleteAnnouncement">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="openImagePreviewModal" class="modal-backdrop image-preview-backdrop" @click.self="closeImagePreview">
      <div class="image-preview-modal">
        <button class="image-close-btn" type="button" aria-label="Close image preview" @click="closeImagePreview">&times;</button>
        <img :src="previewImageSrc" :alt="previewImageAlt" class="image-preview-full" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const API_ORIGIN = 'http://localhost:3000'

const authStore = useAuthStore()
const router = useRouter()
const userRole = computed(() => (authStore.currentUser?.role || '').toLowerCase())
const userId = computed(() => authStore.currentUser?.id)
const token = computed(() => authStore.token)
const canCreateAnnouncement = computed(() => ['president', 'admin'].includes(userRole.value))

const canEditAnnouncement = (item) => {
  if (!userId.value) return false
  return item.author_id === userId.value
}

const canDeleteAnnouncement = (item) => {
  if (!userId.value) return false
  return item.author_id === userId.value
}

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer = null

const announcements = ref([])
const searchTitle = ref('')
const sortOrder = ref('newest')
const openCreateModal = ref(false)
const openEditModal = ref(false)
const openDeleteConfirmModal = ref(false)
const openImagePreviewModal = ref(false)
const pendingDeleteAnnouncementId = ref(null)
const editingAnnouncement = ref(null)
const previewImageSrc = ref('')
const previewImageAlt = ref('Announcement image')
const createForm = ref({
  title: '',
  content: '',
  imageFile: null,
  imageFileName: ''
})
const editForm = ref({
  title: '',
  content: '',
  imageFile: null,
  imageFileName: ''
})

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const filteredAnnouncements = computed(() => {
  const query = searchTitle.value.toLowerCase()
  let rows = announcements.value
  if (query) {
    rows = rows.filter((item) => String(item.title || '').toLowerCase().includes(query))
  }
  rows = [...rows].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime()
    const bTime = new Date(b.created_at).getTime()
    return sortOrder.value === 'oldest' ? aTime - bTime : bTime - aTime
  })
  return rows
})

const showToast = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2400)
}
watch(errorMessage, (value) => {
  if (value) showToast(value, 'error')
})
watch(successMessage, (value) => {
  if (value) showToast(value, 'success')
})

const authHeaders = () => ({
  Authorization: `Bearer ${token.value}`
})

const handleUnauthorized = (message) => {
  authStore.logout()
  errorMessage.value = message || 'Session expired. Please log in again.'
  setTimeout(() => {
    router.push('/login')
  }, 250)
}

const fetchAnnouncements = async () => {
  clearMessages()
  if (!token.value) {
    errorMessage.value = 'Please log in first.'
    return
  }

  loading.value = true
  try {
    const response = await fetch('/api/announcements', { headers: authHeaders() })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch announcements')
    }

    announcements.value = data.data || []
  } catch (err) {
    errorMessage.value = err.message || 'Failed to fetch announcements'
  } finally {
    loading.value = false
  }
}

const onImageSelected = (event) => {
  const file = event.target.files?.[0] || null
  createForm.value.imageFile = file
  createForm.value.imageFileName = file ? file.name : ''
}

const submitCreateAnnouncement = async () => {
  clearMessages()
  if (!canCreateAnnouncement.value) {
    errorMessage.value = 'Only President or Admin can create announcements.'
    return
  }

  const title = createForm.value.title.trim()
  const content = createForm.value.content.trim()

  if (!title || !content) {
    errorMessage.value = 'Title and content are required.'
    return
  }

  const formData = new FormData()
  formData.append('title', title)
  formData.append('content', content)
  if (createForm.value.imageFile) {
    formData.append('image', createForm.value.imageFile)
  }

  submitting.value = true
  try {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create announcement')
    }

    successMessage.value = data.message || 'Announcement posted successfully.'
    closeCreateModal()
    await fetchAnnouncements()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to create announcement'
  } finally {
    submitting.value = false
  }
}

const closeCreateModal = () => {
  openCreateModal.value = false
  createForm.value = {
    title: '',
    content: '',
    imageFile: null,
    imageFileName: ''
  }
}

const openEditModalFn = (item) => {
  if (!canEditAnnouncement(item)) {
    errorMessage.value = 'You can only edit your own announcements.'
    return
  }
  editingAnnouncement.value = item
  editForm.value = {
    title: item.title,
    content: item.content,
    imageFile: null,
    imageFileName: ''
  }
  openEditModal.value = true
}

const closeEditModal = () => {
  openEditModal.value = false
  editingAnnouncement.value = null
  editForm.value = {
    title: '',
    content: '',
    imageFile: null,
    imageFileName: ''
  }
}

const onEditImageSelected = (event) => {
  const file = event.target.files?.[0] || null
  editForm.value.imageFile = file
  editForm.value.imageFileName = file ? file.name : ''
}

const submitEditAnnouncement = async () => {
  clearMessages()
  if (!editingAnnouncement.value) return

  const title = editForm.value.title.trim()
  const content = editForm.value.content.trim()

  if (!title || !content) {
    errorMessage.value = 'Title and content are required.'
    return
  }

  const formData = new FormData()
  formData.append('title', title)
  formData.append('content', content)
  if (editForm.value.imageFile) {
    formData.append('image', editForm.value.imageFile)
  }

  submitting.value = true
  try {
    const response = await fetch(`/api/announcements/${editingAnnouncement.value.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: formData
    })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update announcement')
    }

    successMessage.value = data.message || 'Announcement updated successfully.'
    closeEditModal()
    await fetchAnnouncements()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to update announcement'
  } finally {
    submitting.value = false
  }
}

const openDeleteModal = (id) => {
  pendingDeleteAnnouncementId.value = id
  openDeleteConfirmModal.value = true
}

const closeDeleteModal = () => {
  openDeleteConfirmModal.value = false
  pendingDeleteAnnouncementId.value = null
}

const openImagePreview = (src, alt = 'Announcement image') => {
  previewImageSrc.value = src
  previewImageAlt.value = alt
  openImagePreviewModal.value = true
}

const closeImagePreview = () => {
  openImagePreviewModal.value = false
  previewImageSrc.value = ''
  previewImageAlt.value = 'Announcement image'
}

const confirmDeleteAnnouncement = async () => {
  if (!pendingDeleteAnnouncementId.value) return
  await deleteAnnouncement(pendingDeleteAnnouncementId.value)
  closeDeleteModal()
}

const deleteAnnouncement = async (id) => {
  clearMessages()

  try {
    const response = await fetch('/api/announcements/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body: JSON.stringify({ announcement_id: id })
    })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete announcement')
    }

    showToast('Post deleted successfully.')
    await fetchAnnouncements()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to delete announcement'
  }
}

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  const normalized = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${API_ORIGIN}${normalized}`
}

const authorInitials = (name) => {
  const source = (name || 'User').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(fetchAnnouncements)
</script>

<style scoped>
.announcement-page {
  --glass-bg: rgba(29, 43, 33, 0.92);
  --glass-panel: rgba(31, 48, 36, 0.94);
  --glass-line: rgba(255, 255, 255, 0.1);
  --glass-line-strong: rgba(255, 255, 255, 0.18);
  --green: #34d399;
  --teal: #2dd4bf;
  --lime: #a3e635;
  --yellow: #86efac;
  --red: #f87171;
  --text-main: #eefde6;
  --text-muted: rgba(220, 238, 211, 0.78);
  --text-soft: rgba(220, 238, 211, 0.58);

  max-width: 1220px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(145deg, #0f1712 0%, #132119 22%, #1a2b20 45%, #243b2c 72%, #2f4a38 100%);
  color: var(--text-main);
  position: relative;
  isolation: isolate;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.announcement-page::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 10% 90%, rgba(17, 94, 41, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 90% 10%, rgba(45, 212, 191, 0.10) 0%, transparent 60%),
    radial-gradient(circle at 78% 78%, rgba(163, 230, 53, 0.08) 0%, transparent 30%);
  pointer-events: none;
  z-index: -1;
}
.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 26px 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(28, 41, 31, 0.94) 0%, rgba(35, 54, 40, 0.9) 56%, rgba(48, 78, 62, 0.84) 100%);
  color: var(--text-main);
  border: 1px solid var(--glass-line);
  box-shadow:
    18px 18px 34px rgba(8, 14, 10, 0.5),
    -14px -14px 26px rgba(42, 61, 46, 0.4),
    inset 1px 1px 0 rgba(255,255,255,0.08),
    inset -1px -1px 0 rgba(0,0,0,0.34);
  position: relative;
  overflow: hidden;
}

.header-card::before {
  content: '';
  position: absolute;
  right: -60px;
  top: -70px;
  width: 230px;
  height: 230px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.12) 0%, transparent 66%);
  pointer-events: none;
}

.eyebrow { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-soft); }
h1 { margin: 0; font-size: clamp(2rem, 2.2vw, 2.9rem); }
.subtitle { margin: 12px 0 0; color: var(--text-muted); font-size: 1rem; }
.section {
  margin-top: 22px;
  padding: 20px 22px 22px;
  border-radius: 20px;
  border: 1px solid var(--glass-line);
  background: var(--glass-bg);
  box-shadow:
    14px 14px 26px rgba(8, 13, 10, 0.5),
    0 0 0 1px rgba(20, 32, 24, 0.45),
    inset 1px 1px 0 rgba(255,255,255,0.08),
    inset 0 -20px 22px rgba(0,0,0,0.18);
  position: relative;
  overflow: hidden;
}
.section::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 10%, rgba(163, 230, 53, 0.08) 0%, rgba(163, 230, 53, 0) 30%),
    radial-gradient(circle at 86% 88%, rgba(45, 212, 191, 0.08) 0%, rgba(45, 212, 191, 0) 32%);
  pointer-events: none;
}
.section > * {
  position: relative;
  z-index: 1;
}
.section-head { display: flex; justify-content: space-between; align-items: end; margin-bottom: 14px; }
.section-head h2 { margin: 0; font-size: clamp(1.35rem, 2vw, 1.95rem); color: #b6f7cb; }
.section-head span { font-size: 1.02rem; color: var(--text-muted); font-weight: 700; }
.section-tools {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}
.search-input,
.sort-select {
  border: 1px solid rgba(190, 235, 203, 0.24);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text-main);
  background: rgba(0, 0, 0, 0.24);
}

.search-input::placeholder {
  color: var(--text-soft);
}

.search-input {
  flex: 1;
  min-width: 180px;
  padding-left: 46px;
}
.search-input-wrap {
  position: relative;
  flex: 1;
  min-width: 180px;
}
.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 13px;
  color: #065f46;
  background: linear-gradient(135deg, rgba(209, 250, 229, 0.95), rgba(167, 243, 208, 0.9));
  border: 1px solid rgba(16, 185, 129, 0.32);
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.18);
  pointer-events: none;
}
.sort-select {
  min-width: 130px;
}

.sort-select option {
  color: #10241a;
}

.feed-scroll {
  max-height: 560px;
  overflow-y: auto;
  padding-right: 8px;
  padding-bottom: 2px;
}
.feed-scroll::-webkit-scrollbar {
  width: 8px;
}
.feed-scroll::-webkit-scrollbar-thumb {
  background: rgba(190, 235, 203, 0.3);
  border-radius: 999px;
}
.feed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 16px;
  justify-content: center;
}
.ig-card {
  border: 1px solid rgba(190, 235, 203, 0.24);
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(32, 48, 37, 0.96), rgba(24, 36, 28, 0.94));
  margin: 0;
  overflow: hidden;
  box-shadow:
    12px 12px 24px rgba(8, 13, 10, 0.52),
    0 0 0 1px rgba(20, 32, 24, 0.5),
    inset 1px 1px 0 rgba(255,255,255,0.08),
    inset 0 -16px 20px rgba(0,0,0,0.18);
  height: 404px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  justify-self: center;
  position: relative;
}
.ig-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 88% 12%, rgba(163, 230, 53, 0.12) 0%, rgba(163, 230, 53, 0) 44%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.04) 0%, transparent 55%);
  pointer-events: none;
}
.ig-card:hover {
  transform: translateY(-3px);
  box-shadow:
    18px 18px 32px rgba(8, 13, 10, 0.56),
    0 14px 28px rgba(16, 56, 33, 0.26),
    inset 1px 1px 0 rgba(255,255,255,0.1);
}
.ig-top { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; }
.ig-top-meta { display: flex; flex-direction: column; min-width: 0; }
.author-name { font-size: 13px; line-height: 1.2; }
.meta-line { font-size: 12px; color: var(--text-soft); }
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #166534, #22c55e);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
}
.role-pill {
  margin-left: auto;
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1px solid rgba(74, 222, 128, 0.25);
}
.ig-image {
  width: 100%;
  display: block;
  height: 176px;
  object-fit: cover;
  object-position: center;
  flex-shrink: 0;
  background: rgba(255,255,255,0.04);
  cursor: zoom-in;
}
.ig-image-fallback {
  height: 176px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  color: var(--text-soft);
  background: linear-gradient(145deg, rgba(74, 222, 128, 0.08), rgba(45, 212, 191, 0.06));
  font-weight: 600;
}
.placeholder-icon {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(190, 235, 203, 0.18);
  color: rgba(220, 238, 211, 0.78);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
}
.placeholder-svg {
  width: 24px;
  height: 24px;
  display: block;
}
.placeholder-text {
  font-size: 13px;
}
.ig-actions {
  display: flex;
  gap: 10px;
  padding: 10px 12px 8px;
  font-size: 18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.08));
  border-top: 1px solid rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.action-right { margin-left: auto; display: inline-flex; gap: 8px; align-items: center; }
.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(190, 235, 203, 0.14);
  background: rgba(255,255,255,0.04);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.icon-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.22);
}
.action-icon {
  width: 18px;
  height: 18px;
  display: block;
}
.edit-btn { color: #2dd4bf; }
.edit-btn:hover {
  background: rgba(45, 212, 191, 0.12);
  border-color: rgba(45, 212, 191, 0.28);
}
.delete-btn {
  color: #f87171;
}
.delete-btn:hover {
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.28);
}
.btn.danger {
  background: rgba(248, 113, 113, 0.18);
  color: #fca5a5;
  border: 1px solid rgba(248, 113, 113, 0.34);
}
.toast {
  position: fixed;
  right: 22px;
  top: 22px;
  z-index: 1200;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  border: 1px solid rgba(74, 222, 128, 0.3);
  background: rgba(20, 83, 45, 0.95);
  color: #dcfce7;
  box-shadow: 0 12px 28px rgba(21, 128, 61, 0.28);
}

.toast.success {
  border-color: rgba(74, 222, 128, 0.3);
  background: rgba(20, 83, 45, 0.95);
  color: #dcfce7;
}
.toast.error {
  border-color: rgba(248, 113, 113, 0.34);
  background: rgba(127, 29, 29, 0.95);
  color: #fee2e2;
  box-shadow: 0 12px 28px rgba(153, 27, 27, 0.28);
}
.ig-caption {
  padding: 6px 12px 12px;
  overflow: hidden;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.ig-caption h3 { margin: 0 0 6px; font-size: 14px; color: var(--text-main); }
.ig-caption p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.btn {
  border: 1px solid rgba(190, 235, 203, 0.2);
  border-radius: 999px;
  padding: 11px 16px;
  cursor: pointer;
  background: rgba(255,255,255,0.08);
  color: var(--text-main);
  font-weight: 700;
  font-size: 0.94rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-icon {
  width: 17px;
  height: 17px;
  display: block;
  flex-shrink: 0;
}
.btn.primary {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.25), rgba(34, 197, 94, 0.14));
  color: #dcfce7;
  border-color: rgba(74, 222, 128, 0.34);
}
.btn.primary:hover {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.32), rgba(34, 197, 94, 0.2));
}
.header-btn {
  min-width: 160px;
  min-height: 48px;
  line-height: 1.1;
}
.error {
  margin-top: 12px;
  background: rgba(127, 29, 29, 0.85);
  color: #fecaca;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(248, 113, 113, 0.34);
}

.success {
  margin-top: 12px;
  background: rgba(20, 83, 45, 0.85);
  color: #dcfce7;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(74, 222, 128, 0.32);
}

.muted { color: var(--text-soft); }

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2400;
  background: rgba(2, 6, 23, 0.68);
  display: grid;
  place-items: center;
  padding: 16px;
}
.modal {
  width: min(560px, 100%);
  background: rgba(25, 38, 29, 0.98);
  border: 1px solid rgba(190, 235, 203, 0.2);
  border-radius: 14px;
  padding: 16px;
  max-height: min(90vh, 760px);
  overflow-y: auto;
  box-shadow: 0 18px 38px rgba(0,0,0,0.45);
}
.modal h3 { margin-top: 0; }
.modal label { display: block; margin-top: 8px; font-weight: 600; color: var(--text-muted); }
.modal input, .modal textarea {
  width: 100%;
  box-sizing: border-box;
  margin-top: 6px;
  padding: 9px;
  border-radius: 8px;
  border: 1px solid rgba(190, 235, 203, 0.24);
  background: rgba(0,0,0,0.24);
  color: var(--text-main);
}

.file-name { margin-top: 6px; color: var(--text-soft); font-size: 13px; }
.modal-actions { display: flex; justify-content: end; gap: 8px; margin-top: 12px; }

.image-preview-backdrop {
  z-index: 2600;
  background: rgba(2, 6, 23, 0.78);
}

.image-preview-modal {
  position: relative;
  width: min(760px, 92vw);
  height: min(500px, 76vh);
  display: grid;
  place-items: center;
}

.image-preview-full {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid rgba(190, 235, 203, 0.34);
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 24px 54px rgba(0, 0, 0, 0.58);
}

.image-close-btn {
  position: absolute;
  top: -10px;
  right: -6px;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(190, 235, 203, 0.36);
  background: rgba(15, 23, 17, 0.92);
  color: var(--text-main);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .feed-grid { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); }
}

@media (max-width: 640px) {
  .announcement-page { padding: 16px; }
  .header-card { padding: 18px 16px; border-radius: 18px; }
  .section { padding: 14px; border-radius: 16px; }
  .feed-grid { grid-template-columns: 1fr; }
  .ig-card { height: 372px; }
  .ig-image,
  .ig-image-fallback { height: 154px; }
  .section-tools {
    flex-direction: column;
  }
  .header-btn {
    min-width: 150px;
    min-height: 50px;
    font-size: 0.95rem;
  }
  .header-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>


