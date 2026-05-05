<template>
  <div class="approval-page">
    <section class="header-card">
      <div>
        <p class="eyebrow">President Tools</p>
        <h1>Pending News Approvals</h1>
        <p class="subtitle">Review farmer submissions and decide publish/reject.</p>
      </div>
      <button class="btn header-btn" type="button" @click="goBack">Back to News</button>
    </section>

    <div v-if="toastMessage" class="toast" :class="toastType">{{ toastMessage }}</div>

    <section class="section">
      <div class="section-head">
        <h2>Pending News</h2>
        <span>{{ pendingNews.length }} item(s)</span>
      </div>

      <p v-if="loading" class="muted">Loading pending news...</p>
      <p v-else-if="pendingNews.length === 0" class="muted">No pending news for review.</p>

      <article v-for="item in pendingNews" :key="item.id" class="card">
        <div class="meta">
          <span>{{ formatDate(item.created_at) }}</span>
          <span>{{ item.author_name || item.author_role }}</span>
          <span class="status pending">{{ item.status }}</span>
        </div>

        <h3>{{ item.title }}</h3>
        <p>{{ item.content }}</p>
        <img v-if="item.image" :src="resolveImageUrl(item.image)" alt="News image" class="image" />

        <div class="review-box">
          <input
            v-model="reviewReasons[item.id]"
            type="text"
            placeholder="Rejection reason (required if rejecting)"
          />
          <button class="btn primary" type="button" @click="reviewNews(item.id, 'published')">Approve</button>
          <button class="btn danger" type="button" @click="reviewNews(item.id, 'rejected')">Reject</button>
          <button class="btn danger-soft" type="button" @click="deleteNews(item.id)">Delete</button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const API_ORIGIN = 'http://localhost:3000'

const authStore = useAuthStore()
const router = useRouter()

const token = computed(() => authStore.token)
const userRole = computed(() => (authStore.currentUser?.role || '').toLowerCase())

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer = null
const newsItems = ref([])
const reviewReasons = ref({})

const pendingNews = computed(() => newsItems.value.filter((item) => item.status === 'pending'))

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

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
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token.value}`
})

const handleUnauthorized = (message) => {
  authStore.logout()
  errorMessage.value = message || 'Session expired. Please log in again.'
  setTimeout(() => {
    router.push('/login')
  }, 250)
}

const fetchPendingNews = async () => {
  clearMessages()
  if (userRole.value !== 'president') {
    errorMessage.value = 'President access required.'
    return
  }

  loading.value = true
  try {
    const response = await fetch('/api/news', { headers: authHeaders() })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch pending news')
    }

    newsItems.value = data.data || []
  } catch (err) {
    errorMessage.value = err.message || 'Failed to fetch pending news'
  } finally {
    loading.value = false
  }
}

const reviewNews = async (id, action) => {
  clearMessages()
  if (userRole.value !== 'president') {
    errorMessage.value = 'Only President can review news.'
    return
  }

  const rejection_reason = (reviewReasons.value[id] || '').trim()
  if (action === 'rejected' && !rejection_reason) {
    errorMessage.value = 'Rejection reason is required when rejecting.'
    return
  }

  try {
    const response = await fetch(`/api/news/${id}/review`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ action, rejection_reason: rejection_reason || null })
    })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to review news')
    }

    successMessage.value = data.message || 'Review completed.'
    reviewReasons.value[id] = ''
    await fetchPendingNews()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to review news'
  }
}

const deleteNews = async (id) => {
  clearMessages()
  if (userRole.value !== 'president') {
    errorMessage.value = 'Only President can delete news here.'
    return
  }

  if (!window.confirm('Delete this news post?')) return

  try {
    const response = await fetch(`/api/news/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })
    const data = await response.json()

    if (response.status === 401) {
      handleUnauthorized(data.message || 'Session expired. Please log in again.')
      return
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete news')
    }

    successMessage.value = data.message || 'News deleted successfully.'
    await fetchPendingNews()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to delete news'
  }
}

const goBack = () => {
  router.push('/news')
}

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  const normalized = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${API_ORIGIN}${normalized}`
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

onMounted(fetchPendingNews)
</script>

<style scoped>
.approval-page {
  --green: #4ade80;
  --teal: #2dd4bf;
  --lime: #a3e635;
  --yellow: #fbbf24;
  --red: #f87171;
  --text-main: #eefde6;
  --text-muted: rgba(220, 238, 211, 0.75);
  --text-soft: rgba(220, 238, 211, 0.58);

  max-width: 1220px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 24px 16px 30px;
  background: linear-gradient(145deg, #0f1712 0%, #132119 22%, #1a2b20 45%, #243b2c 72%, #2f4a38 100%);
  color: var(--text-main);
  position: relative;
  isolation: isolate;
}

.approval-page::before {
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
  padding: 24px;
  border-radius: 20px;
  background: rgba(25, 38, 29, 0.92);
  color: var(--text-main);
  border: 1px solid rgba(190, 235, 203, 0.14);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.36), inset 1px 1px 0 rgba(255,255,255,0.06);
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
.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-soft);
}
h1 {
  margin: 0;
  font-size: clamp(2rem, 2.2vw, 2.9rem);
}
.subtitle {
  margin: 14px 0 0;
  font-size: 1rem;
  color: var(--text-muted);
}
.section { margin-top: 22px; }
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 10px;
}
.section-head h2 {
  margin: 0;
  font-size: clamp(1.35rem, 2vw, 1.95rem);
  color: #b6f7cb;
}
.section-head span {
  font-size: 1.02rem;
  color: var(--text-muted);
  font-weight: 700;
}
.card {
  border: 1px solid rgba(190, 235, 203, 0.16);
  border-radius: 18px;
  background: rgba(28, 42, 33, 0.92);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.30), inset 1px 1px 0 rgba(255,255,255,0.05);
}
.meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--text-soft); margin-bottom: 8px; }
.status { text-transform: uppercase; font-weight: 700; }
.status.pending {
  color: #fcd34d;
  background: rgba(251, 191, 36, 0.18);
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 2px 9px;
  border-radius: 999px;
}

.card h3 {
  color: var(--text-main);
}

.card p {
  color: var(--text-muted);
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
}
.btn.primary {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.25), rgba(34, 197, 94, 0.14));
  color: #dcfce7;
  border-color: rgba(74, 222, 128, 0.34);
}

.btn.danger {
  background: rgba(248, 113, 113, 0.18);
  color: #fca5a5;
  border-color: rgba(248, 113, 113, 0.34);
}

.btn.danger-soft {
  background: rgba(127, 29, 29, 0.35);
  color: #fecaca;
  border-color: rgba(248, 113, 113, 0.30);
}
.header-btn {
  min-width: 160px;
  min-height: 48px;
  line-height: 1.1;
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
.muted { color: var(--text-soft); }

.image {
  margin-top: 8px;
  max-width: 240px;
  border-radius: 12px;
  border: 2px solid rgba(190, 235, 203, 0.25);
  padding: 4px;
  background: rgba(255,255,255,0.04);
}

.review-box { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }

.review-box input {
  flex: 1;
  min-width: 220px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(190, 235, 203, 0.24);
  background: rgba(0,0,0,0.24);
  color: var(--text-main);
}

.review-box input::placeholder {
  color: var(--text-soft);
}

@media (max-width: 740px) {
  .header-btn {
    min-width: 150px;
    min-height: 50px;
    font-size: 0.95rem;
  }
  .header-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .section-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>

