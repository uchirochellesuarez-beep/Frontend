<template>
  <header :class="['top-header', { 'farmer-theme': isFarmer }]">
    <div class="header-content">
      <!-- Right: User Controls -->
      <div class="user-controls">
        <!-- Notifications -->
        <div class="notification-container">
          <button class="icon-btn notification-btn" :class="{ 'has-unread': notificationCount > 0 }" @click="toggleNotifications" title="Notifications">
            <svg class="notification-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 9.5C18 6.55 15.87 4 12.9 4H11.1C8.13 4 6 6.55 6 9.5V13.28L4.86 15.34C4.37 16.23 4.95 17.33 5.97 17.33H18.03C19.05 17.33 19.63 16.23 19.14 15.34L18 13.28V9.5Z" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9.7 18.25C10.16 19.37 11.09 20 12 20C12.91 20 13.84 19.37 14.3 18.25" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
            </svg>
            <span v-if="notificationCount > 0" class="badge">{{ notificationCount }}</span>
          </button>
        </div>

        <!-- Logout -->
        <button class="icon-btn logout-btn" @click="handleLogout" title="Logout">
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="logout-icon"
          >
            <path
              d="M9.5 4.5H7.1C6.27 4.5 5.6 5.17 5.6 6V18C5.6 18.83 6.27 19.5 7.1 19.5H9.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M13.2 8L17.2 12L13.2 16"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M17.2 12H9.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <!-- User Profile -->
        <div class="user-profile" @click="goToSettings" title="Edit Profile">
          <div class="profile-avatar-shell">
            <img :src="userAvatar" class="profile-avatar" alt="User Avatar" />
            <span class="profile-online-dot" aria-hidden="true"></span>
          </div>
          <div class="profile-info">
            <div class="profile-name">{{ userName }}</div>
            <div class="profile-meta">
              <div class="profile-id">ID: {{ userId }}</div>
              <span class="profile-status">Online</span>
            </div>
          </div>
          <svg class="profile-chevron" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Notifications Modal (teleported to body to center on page) -->
    <Teleport to="body">
      <div v-if="showNotifications" class="notifications-modal-overlay" @click="showNotifications = false">
        <div class="notifications-modal" @click.stop ref="notificationsRef">
          <div class="notifications-header">
            <h3>Notifications</h3>
            <div class="notifications-header-actions">
              <button v-if="unreadCount > 0" class="mark-read-btn" @click="markAllAsRead">Mark all read</button>
              <button class="modal-close" @click="showNotifications = false">&times;</button>
            </div>
          </div>

          <div class="notifications-list">
            <div 
              v-for="notification in notifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.is_read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon">{{ notification.icon }}</div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-message">{{ notification.message }}</div>
                <div class="notification-date">{{ formatNotificationDate(notification.trigger_date) }}</div>
              </div>
              <div v-if="!notification.is_read" class="unread-indicator"></div>
            </div>
            <div v-if="notifications.length === 0" class="no-notifications">
              <span class="empty-icon">✅</span>
              <span>All caught up!</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Logout Confirmation Modal (teleported to body to avoid parent transform breaking fixed positioning) -->
    <Teleport to="body">
      <div v-if="showLogoutConfirm" class="logout-modal-overlay" @click="showLogoutConfirm = false">
        <div class="logout-modal" @click.stop>
          <div class="modal-header">
            <h3>Confirm Logout</h3>
            <button class="modal-close" @click="showLogoutConfirm = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to logout?</p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showLogoutConfirm = false">No, Stay</button>
            <button class="btn-logout" @click="confirmLogout">Yes, Logout</button>
          </div>
        </div>
      </div>
    </Teleport>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const systemStatus = ref(true)
const showNotifications = ref(false)
const notificationsRef = ref(null)
const showLogoutConfirm = ref(false)

// Unified notifications array (Facebook-style)
const notifications = ref([])
const unreadCount = ref(0)

// Role check
const userRole = computed(() => authStore.currentUser?.role)
const isFarmer = computed(() => userRole.value === 'farmer')
const isAdminRole = computed(() => ['admin', 'treasurer', 'president'].includes(userRole.value))

const userName = computed(() => authStore.currentUser?.full_name || 'Juan Dela Cruz')
const userId = computed(() => authStore.currentUser?.reference_number || 'CALFFA-00123')

const userInitials = computed(() => {
  const name = userName.value
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

const userAvatar = computed(() => {
  // Use actual profile picture if available, otherwise generate initials avatar
  if (authStore.currentUser?.profile_picture) {
    const profilePicture = authStore.currentUser.profile_picture
    // Check if it's already a full URL (Google profile pictures start with https://)
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture
    }
    // For local uploads (starts with /uploads/), return as-is
    // The /uploads path is proxied to the backend via Vite in development
    // and served directly by the backend in production
    return profilePicture
  }
  // Fallback to generated initials avatar if no profile picture
  return (
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(userName.value) +
    "&background=4CAF50&color=fff&size=128"
  )
})

// ─── Unified Notifications (Due date + System) ───
const notificationCount = computed(() => unreadCount.value)

const getAuthHeaders = () => {
  const token = authStore.token || localStorage.getItem('token')
  const hasToken = !!token
  
  if (!hasToken) {
    console.warn('⚠️ No token found in authStore or localStorage')
    console.log('authStore.token:', authStore.token ? 'exists' : 'null')
    console.log('localStorage.token:', localStorage.getItem('token') ? 'exists' : 'null')
  }
  
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Load all due-date notifications
const loadNotifications = async () => {
  try {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    if (!headers.Authorization) {
      console.warn('⚠️ [loadNotifications] No authorization token available')
      return
    }

    console.log('📬 [loadNotifications] Fetching notifications with token...')
    console.log('🔐 Token preview:', headers.Authorization.substring(0, 30) + '...')

    // Get device date in YYYY-MM-DD format
    const today = new Date()
    const deviceDateStr = today.getFullYear() + '-' + 
                          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(today.getDate()).padStart(2, '0')
    
    // Send device date to backend for proper notification filtering
    const [notifRes, countRes] = await Promise.all([
      fetch(`/api/notifications?deviceDate=${deviceDateStr}`, { method: 'GET', headers }),
      fetch(`/api/notifications/unread-count?deviceDate=${deviceDateStr}`, { method: 'GET', headers })
    ])

    if (!notifRes.ok) {
      const responseText = await notifRes.text()
      console.error(`❌ [/api/notifications] Status: ${notifRes.status} ${notifRes.statusText}`)
      console.error('Response:', responseText.substring(0, 200))
      if (notifRes.status === 401) {
        console.error('🔐 Authentication failed - Please login again')
        authStore.logout()
        router.push('/login')
      }
      return
    }

    if (!countRes.ok) {
      console.error(`❌ [/api/notifications/unread-count] Status: ${countRes.status}`)
      return
    }

    const data = await notifRes.json()
    const notifs = data.notifications || []
    
    // Transform to unified format with icons
    notifications.value = notifs.map(n => ({
      ...n,
      icon: getNotificationIcon(n.reference_type)
    }))
    
    console.log(`✅ [loadNotifications] Loaded ${notifs.length} notifications`)

    const countData = await countRes.json()
    unreadCount.value = countData.count || 0
  } catch (error) {
    console.error('❌ [loadNotifications] Exception:', error)
  }
}

const getNotificationIcon = (referenceType) => {
  const icons = {
    'loan': '💰',
    'machinery_booking': '🚜'
  }
  return icons[referenceType] || '🔔'
}

const formatNotificationDate = (dateStr) => {
  if (!dateStr) return 'No date'
  
  try {
    let d;
    
    // Handle string dates
    if (typeof dateStr === 'string') {
      // Remove time portion if present
      const dateOnly = dateStr.split('T')[0]
      
      // Parse YYYY-MM-DD format
      if (dateOnly.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateOnly.split('-').map(Number)
        d = new Date(year, month - 1, day, 0, 0, 0, 0)
      } else {
        d = new Date(dateStr)
      }
    } else {
      d = new Date(dateStr)
    }
    
    // Validate date
    if (isNaN(d.getTime())) {
      console.warn('⚠️ Invalid date:', dateStr)
      return dateStr ? dateStr.substring(0, 10) : 'Invalid date'
    }
    
    // Calculate difference using only date parts (no time component)
    const now = new Date()
    const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    const notifMs = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
    const diffDays = Math.round((notifMs - todayMs) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`
    if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch (err) {
    console.error('Error formatting notification date:', err)
    return dateStr ? String(dateStr).substring(0, 10) : 'Invalid date'
  }
}

// ─── Click handler: mark as read and navigate ───
const handleNotificationClick = async (notification) => {
  // Mark as read
  try {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    const response = await fetch(`/api/notifications/${notification.id}/read`, { method: 'PUT', headers })
    if (!response.ok) {
      console.error(`Failed to mark notification as read: ${response.status}`)
      return
    }
    notification.is_read = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (e) {
    console.error('Error marking notification read:', e)
    return
  }

  showNotifications.value = false

  // Navigate based on reference type
  if (notification.reference_type === 'loan') {
    const role = authStore.currentUser?.role
    if (['admin', 'treasurer', 'president'].includes(role)) {
      router.push({ path: '/admin-loans', query: { highlight: notification.reference_id, type: 'loan' } })
    } else {
      router.push({ path: '/loan', query: { highlight: notification.reference_id, type: 'loan' } })
    }
  } else if (notification.reference_type === 'machinery_booking') {
    const role = authStore.currentUser?.role
    if (['admin', 'treasurer', 'president'].includes(role)) {
      router.push({ path: '/machinery-financial', query: { highlight: notification.reference_id, type: 'booking' } })
    } else {
      router.push({ path: '/machinery-booking', query: { highlight: notification.reference_id, type: 'booking' } })
    }
  }
}

const markAllAsRead = async () => {
  try {
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    
    // Get device date in YYYY-MM-DD format
    const today = new Date()
    const deviceDateStr = today.getFullYear() + '-' + 
                          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(today.getDate()).padStart(2, '0')
    
    const response = await fetch(`/api/notifications/read-all?deviceDate=${deviceDateStr}`, { method: 'PUT', headers })
    if (!response.ok) {
      console.error(`Failed to mark all as read: ${response.status}`)
      return
    }
    notifications.value.forEach(n => n.is_read = 1)
    unreadCount.value = 0
  } catch (e) {
    console.error('Error marking all as read:', e)
  }
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    loadNotifications() // Refresh notifications when opened
  }
}

const handleClickOutside = (event) => {
  if (
    notificationsRef.value &&
    !notificationsRef.value.contains(event.target) &&
    !event.target.closest('.notification-btn')
  ) {
    showNotifications.value = false
  }
}

const goToSettings = () => {
  router.push('/settings')
}

const handleLogout = () => {
  showLogoutConfirm.value = true
}

const confirmLogout = () => {
  showLogoutConfirm.value = false
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  // Load notifications on mount
  loadNotifications()
  
  // Refresh notifications every 60 seconds
  const notifInterval = setInterval(loadNotifications, 60000)
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    clearInterval(notifInterval)
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<style scoped>
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: linear-gradient(110deg, rgba(16, 58, 41, 0.92) 0%, rgba(12, 47, 34, 0.88) 52%, rgba(10, 40, 29, 0.9) 100%);
  border-bottom: 1px solid rgba(126, 182, 149, 0.32);
  box-shadow:
    0 10px 32px rgba(4, 12, 8, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px) saturate(125%);
  -webkit-backdrop-filter: blur(12px) saturate(125%);
  z-index: 1000;
  /* Ensure header stays fixed and doesn't move */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
  position: fixed !important;
}

.top-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 42%;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, transparent 100%);
  opacity: 0.85;
}

.top-header.farmer-theme {
  background: linear-gradient(110deg, rgba(92, 60, 37, 0.92) 0%, rgba(74, 50, 33, 0.88) 52%, rgba(58, 40, 27, 0.9) 100%);
  border-bottom: 1px solid rgba(210, 170, 125, 0.34);
  box-shadow:
    0 10px 32px rgba(24, 15, 10, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
}

.header-content {
  max-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: relative;
  z-index: 2;
  gap: 16px;
  pointer-events: auto;
}

/* Mobile Header Responsive */
@media (max-width: 1024px) {
  .header-content {
    padding: 0 14px;
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 10px;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 8px;
    gap: 4px;
  }
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

@media (max-width: 1024px) {
  .logo-section {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .logo-section {
    gap: 10px;
    flex-shrink: 1;
  }
}

@media (max-width: 480px) {
  .logo-section {
    gap: 8px;
    flex-shrink: 1;
    min-width: 0;
  }
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-radius: 10px;
  flex-shrink: 0;
}

.logo-text-container {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.calffa-logo {
  font-size: 20px;
  font-weight: 800;
  color: #166534;
  letter-spacing: 0.5px;
  line-height: 1.2;
  font-family: 'Poppins', sans-serif;
}

.logo-text {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .logo-container {
    gap: 10px;
  }

  .logo-icon {
    font-size: 24px;
    width: 36px;
    height: 36px;
  }

  .calffa-logo {
    font-size: 16px;
  }

  .logo-text {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .logo-container {
    gap: 8px;
  }

  .logo-icon {
    font-size: 20px;
    width: 32px;
    height: 32px;
  }

  .calffa-logo {
    font-size: 14px;
  }

  .logo-text {
    font-size: 8px;
  }
}

/* Notifications */
.notification-container {
  position: relative;
}

.user-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
  flex-shrink: 0;
}

@media (max-width: 1024px) {
  .user-controls {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .user-controls {
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .user-controls {
    gap: 4px;
  }
}

.role-dropdown {
  position: relative;
}

.role-select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.role-select:hover {
  border-color: #9ca3af;
}

.role-select:focus {
  border-color: #166534;
  box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.1);
}

.icon-btn {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(120, 180, 145, 0.38);
  background: linear-gradient(140deg, rgba(14, 43, 31, 0.94), rgba(10, 30, 22, 0.94));
  border-radius: 14px;
  color: #d4e9dc;
  cursor: pointer;
  box-shadow:
    8px 8px 16px rgba(8, 12, 10, 0.54),
    -6px -6px 12px rgba(40, 58, 47, 0.38),
    inset 1px 1px 0 rgba(153, 188, 166, 0.12);
  transition: background 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease, filter 0.28s ease;
  flex-shrink: 0;
}

.top-header.farmer-theme .icon-btn {
  border: 1px solid rgba(212, 178, 138, 0.4);
  background: linear-gradient(140deg, rgba(76, 49, 31, 0.95), rgba(58, 37, 24, 0.95));
  color: #f7e9d8;
  box-shadow:
    8px 8px 16px rgba(20, 12, 8, 0.56),
    -6px -6px 12px rgba(108, 75, 48, 0.28),
    inset 1px 1px 0 rgba(233, 206, 173, 0.12);
}

.icon-btn:hover {
  background: linear-gradient(140deg, rgba(19, 54, 39, 0.98), rgba(14, 39, 29, 0.98));
  border-color: rgba(167, 218, 188, 0.56);
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow:
    10px 10px 18px rgba(7, 11, 9, 0.6),
    -8px -8px 14px rgba(46, 67, 54, 0.44),
    inset 1px 1px 0 rgba(175, 208, 188, 0.16),
    0 0 22px rgba(74, 222, 128, 0.22);
}

.top-header.farmer-theme .icon-btn:hover {
  background: linear-gradient(140deg, rgba(88, 58, 37, 0.98), rgba(67, 45, 29, 0.98));
  border-color: rgba(234, 201, 160, 0.62);
  filter: brightness(1.06);
  box-shadow:
    10px 10px 18px rgba(18, 10, 7, 0.6),
    -8px -8px 14px rgba(117, 80, 53, 0.32),
    inset 1px 1px 0 rgba(242, 216, 186, 0.17),
    0 0 22px rgba(252, 211, 77, 0.18);
}

.icon-btn:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.45);
  outline-offset: 1px;
}

.icon-btn:active {
  transform: translateY(0);
}

.notification-btn .notification-icon {
  width: 21px;
  height: 21px;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.35));
}

.notification-btn.has-unread {
  color: #9eead4;
  border-color: rgba(20, 184, 166, 0.45);
  background: rgba(18, 53, 44, 0.95);
}

.top-header.farmer-theme .notification-btn.has-unread {
  color: #ffe6b8;
  border-color: rgba(245, 179, 86, 0.5);
  background: rgba(95, 62, 35, 0.96);
}

.notification-btn.has-unread:hover {
  background: rgba(23, 69, 57, 0.95);
}

.top-header.farmer-theme .notification-btn.has-unread:hover {
  background: rgba(117, 76, 44, 0.96);
}

@media (max-width: 768px) {
  .icon-btn {
    width: 36px;
    height: 36px;
  }

  .notification-btn .notification-icon {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .icon-btn {
    width: 32px;
    height: 32px;
  }

  .notification-btn .notification-icon {
    width: 16px;
    height: 16px;
  }
}

.logout-icon {
  transition: transform 0.2s ease;
}

.logout-btn {
  color: #fca5a5;
}

.logout-btn:hover {
  color: #fecaca;
  border-color: rgba(248, 113, 113, 0.56);
  background: rgba(63, 25, 25, 0.95);
  box-shadow: 0 10px 18px rgba(127, 29, 29, 0.45);
}

.logout-btn:hover .logout-icon {
  transform: translateX(1px) scale(1.05);
}

.notification-btn {
  position: relative;
}

.badge {
  position: absolute;
  top: 1px;
  right: 1px;
  background: #ef4444;
  border: 2px solid rgba(255, 255, 255, 0.9);
  color: white;
  font-size: 9px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 999px;
  min-width: 17px;
  text-align: center;
  line-height: 1.4;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px 6px 8px;
  border-radius: 16px;
  border: 1px solid rgba(118, 176, 142, 0.42);
  background: linear-gradient(145deg, rgba(13, 36, 27, 0.98), rgba(10, 28, 21, 0.97));
  box-shadow:
    10px 10px 18px rgba(5, 10, 8, 0.62),
    -8px -8px 14px rgba(22, 49, 36, 0.46),
    inset 1px 1px 0 rgba(171, 224, 193, 0.12);
  transition: background 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease, filter 0.28s ease;
  cursor: pointer;
  flex-shrink: 0;
  min-height: 56px;
}

.top-header.farmer-theme .user-profile {
  border: 1px solid rgba(212, 180, 141, 0.46);
  background: linear-gradient(145deg, rgba(70, 45, 30, 0.98), rgba(55, 35, 24, 0.98));
  box-shadow:
    10px 10px 18px rgba(19, 12, 8, 0.62),
    -8px -8px 14px rgba(100, 70, 46, 0.35),
    inset 1px 1px 0 rgba(237, 211, 179, 0.13);
}

.user-profile:hover {
  background: linear-gradient(145deg, rgba(18, 45, 33, 0.99), rgba(14, 33, 25, 0.98));
  transform: translateY(-2px);
  border-color: rgba(162, 214, 184, 0.58);
  filter: brightness(1.04);
  box-shadow:
    12px 12px 20px rgba(5, 10, 8, 0.68),
    -9px -9px 16px rgba(26, 56, 41, 0.56),
    inset 1px 1px 0 rgba(194, 236, 211, 0.18),
    0 0 24px rgba(74, 222, 128, 0.16);
}

.top-header.farmer-theme .user-profile:hover {
  background: linear-gradient(145deg, rgba(82, 54, 35, 0.99), rgba(64, 42, 28, 0.99));
  border-color: rgba(236, 204, 163, 0.62);
  filter: brightness(1.05);
  box-shadow:
    12px 12px 20px rgba(18, 11, 8, 0.66),
    -9px -9px 16px rgba(116, 81, 53, 0.4),
    inset 1px 1px 0 rgba(242, 219, 188, 0.18),
    0 0 22px rgba(252, 211, 77, 0.14);
}

.profile-avatar-shell {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(145deg, #9eead4 0%, #4ade80 100%);
  box-shadow: 0 0 0 2px rgba(18, 53, 44, 0.7), 0 8px 14px rgba(8, 12, 10, 0.44);
  flex-shrink: 0;
}

.top-header.farmer-theme .profile-avatar-shell {
  background: linear-gradient(145deg, #f1d2a1 0%, #d39b58 100%);
  box-shadow: 0 0 0 2px rgba(75, 47, 28, 0.72), 0 8px 14px rgba(20, 12, 8, 0.44);
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: contain;
  object-position: center center;
  background: radial-gradient(circle at 50% 35%, rgba(232, 248, 238, 0.32), rgba(14, 28, 22, 0.94));
  border: 2px solid rgba(16, 26, 21, 0.82);
  box-shadow:
    0 4px 10px rgba(8, 12, 10, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.06) inset;
  filter: contrast(1.06) saturate(1.05);
}

.profile-online-dot {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 28%, #bbf7d0 0%, #22c55e 45%, #15803d 100%);
  border: 2px solid rgba(18, 30, 24, 0.95);
  box-shadow:
    0 0 0 2px rgba(74, 222, 128, 0.35),
    0 0 12px rgba(52, 211, 153, 0.65);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-name {
  font-size: 14px;
  font-weight: 800;
  color: #f0fdf4;
  line-height: 1.2;
  letter-spacing: 0.2px;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-id {
  font-size: 12px;
  color: #d6f1e2;
  background: rgba(10, 34, 24, 0.78);
  border: 1px solid rgba(132, 194, 159, 0.3);
  border-radius: 999px;
  padding: 1px 8px;
  line-height: 1.2;
}

.top-header.farmer-theme .profile-id {
  color: #ffedd2;
  background: rgba(67, 43, 28, 0.85);
  border: 1px solid rgba(223, 188, 145, 0.35);
}

.profile-status {
  font-size: 11px;
  font-weight: 700;
  color: #ecfdf5;
  background: linear-gradient(135deg, rgba(6, 95, 70, 0.85), rgba(21, 128, 61, 0.78));
  border: 1px solid rgba(110, 231, 183, 0.55);
  padding: 2px 9px;
  border-radius: 999px;
  line-height: 1.4;
  box-shadow: 0 0 14px rgba(52, 211, 153, 0.25);
}

.top-header.farmer-theme .profile-status {
  color: #fffbeb;
  background: linear-gradient(135deg, rgba(146, 90, 36, 0.88), rgba(180, 110, 42, 0.82));
  border: 1px solid rgba(253, 224, 71, 0.55);
  box-shadow: 0 0 14px rgba(250, 204, 21, 0.22);
}

.top-header.farmer-theme .profile-name {
  color: #fff5e8;
}

.top-header.farmer-theme .profile-chevron {
  color: #deb486;
}

.profile-chevron {
  width: 16px;
  height: 16px;
  color: #9ac5ae;
}

@media (max-width: 768px) {
  .profile-avatar-shell {
    width: 38px;
    height: 38px;
  }

  .profile-info {
    display: none;
  }

  .profile-chevron {
    display: none;
  }
}

@media (max-width: 480px) {
  .profile-avatar-shell {
    width: 34px;
    height: 34px;
  }
}

@media (max-width: 768px) {
  .logo-text {
    display: none;
  }

  .logo-container {
    gap: 8px;
  }

  .logo-icon {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }

  .calffa-logo {
    font-size: 16px;
  }

  .profile-info {
    display: none;
  }
}
</style>

<style>
/* Notifications Modal - unscoped because it's teleported to body */
.notifications-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(8, 12, 10, 0.62);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.notifications-modal {
  position: relative;
  background: linear-gradient(155deg,
    rgba(24, 34, 29, 0.96) 0%,
    rgba(22, 31, 27, 0.94) 45%,
    rgba(19, 28, 24, 0.96) 100%);
  border-radius: 20px;
  border: 1px solid rgba(116, 150, 128, 0.35);
  box-shadow:
    20px 20px 40px rgba(6, 10, 8, 0.62),
    -12px -12px 24px rgba(53, 72, 61, 0.28),
    inset 1px 1px 0 rgba(152, 186, 164, 0.1),
    inset -1px -1px 0 rgba(6, 10, 8, 0.5);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  width: 90%;
  max-width: 420px;
  max-height: 80vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  display: flex;
  flex-direction: column;
}

.notifications-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg,
    rgba(174, 204, 186, 0.08) 0%,
    rgba(107, 191, 89, 0.06) 36%,
    rgba(255, 145, 77, 0.04) 70%,
    transparent 100%);
  pointer-events: none;
}

.notifications-modal .notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(152, 186, 164, 0.22);
  background: rgba(18, 27, 23, 0.65);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.notifications-modal .notifications-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #f2eee4;
  margin: 0;
}

.notifications-modal .notifications-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notifications-modal .mark-read-btn {
  padding: 5px 12px;
  background: rgba(14, 40, 24, 0.45);
  border: 1px solid rgba(107, 191, 89, 0.42);
  color: #d9f9e2;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 999px;
  transition: all 0.2s;
}

.notifications-modal .mark-read-btn:hover {
  background: rgba(16, 58, 34, 0.58);
  border-color: rgba(134, 239, 172, 0.55);
}

.notifications-modal .modal-close {
  background: rgba(30, 43, 36, 0.82);
  border: 1px solid rgba(126, 164, 141, 0.35);
  border-radius: 10px;
  font-size: 22px;
  color: #d7cfbf;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.notifications-modal .modal-close:hover {
  color: #fff8ef;
  background: rgba(42, 56, 48, 0.88);
}

.notifications-modal .notifications-list {
  overflow-y: auto;
  flex: 1;
  position: relative;
  z-index: 1;
}

.notifications-modal .notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(127, 177, 145, 0.14);
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.notifications-modal .notification-item:hover {
  background: rgba(29, 40, 35, 0.7);
}

.notifications-modal .notification-item.unread {
  background: rgba(22, 52, 38, 0.72);
  box-shadow: inset 3px 0 0 rgba(107, 191, 89, 0.9);
  font-weight: 500;
}

.notifications-modal .notification-item.unread:hover {
  background: rgba(27, 64, 45, 0.76);
}

.notifications-modal .unread-indicator {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #86efac;
  box-shadow: 0 0 0 2px rgba(16, 58, 34, 0.95);
  flex-shrink: 0;
}

.notifications-modal .notification-icon {
  width: 30px;
  height: 30px;
  font-size: 16px;
  border-radius: 10px;
  background: rgba(15, 27, 22, 0.76);
  border: 1px solid rgba(126, 164, 141, 0.28);
  color: #e5f3ea;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 30px;
}

.notifications-modal .notification-content {
  flex: 1;
  min-width: 0;
}

.notifications-modal .notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #f2eee4;
  margin-bottom: 2px;
  line-height: 1.3;
}

.notifications-modal .notification-message {
  font-size: 13px;
  color: rgba(231, 225, 211, 0.84);
  line-height: 1.4;
  word-break: break-word;
}

.notifications-modal .notification-date {
  font-size: 11px;
  color: rgba(198, 221, 206, 0.75);
  margin-top: 4px;
  font-weight: 500;
}

.notifications-modal .no-notifications {
  padding: 40px 20px;
  text-align: center;
  color: rgba(231, 225, 211, 0.84);
  font-size: 14px;
}

.notifications-modal .empty-icon {
  display: block;
  font-size: 32px;
  margin-bottom: 8px;
}

@media (max-width: 480px) {
  .notifications-modal {
    width: 95%;
    max-width: none;
  }
}

/* Logout Confirmation Modal - unscoped because it's teleported to body */
.logout-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(8, 12, 10, 0.62);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.logout-modal {
  position: relative;
  background: linear-gradient(155deg,
    rgba(24, 34, 29, 0.96) 0%,
    rgba(22, 31, 27, 0.94) 45%,
    rgba(19, 28, 24, 0.96) 100%);
  border-radius: 18px;
  border: 1px solid rgba(116, 150, 128, 0.35);
  box-shadow:
    20px 20px 40px rgba(6, 10, 8, 0.62),
    -12px -12px 24px rgba(53, 72, 61, 0.28),
    inset 1px 1px 0 rgba(152, 186, 164, 0.1),
    inset -1px -1px 0 rgba(6, 10, 8, 0.5);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.logout-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg,
    rgba(174, 204, 186, 0.08) 0%,
    rgba(107, 191, 89, 0.06) 36%,
    rgba(255, 145, 77, 0.04) 70%,
    transparent 100%);
  pointer-events: none;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.logout-modal .modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(152, 186, 164, 0.22);
  background: rgba(18, 27, 23, 0.65);
  position: relative;
  z-index: 1;
}

.logout-modal .modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #f2eee4;
}

.logout-modal .modal-close {
  background: rgba(30, 43, 36, 0.82);
  border: 1px solid rgba(126, 164, 141, 0.35);
  border-radius: 10px;
  font-size: 24px;
  color: #d7cfbf;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.logout-modal .modal-close:hover {
  color: #fff8ef;
  background: rgba(42, 56, 48, 0.88);
}

.logout-modal .modal-body {
  padding: 20px;
  position: relative;
  z-index: 1;
}

.logout-modal .modal-body p {
  margin: 0;
  font-size: 15px;
  color: rgba(231, 225, 211, 0.88);
  line-height: 1.6;
}

.logout-modal .modal-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(152, 186, 164, 0.22);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: rgba(18, 27, 23, 0.65);
  position: relative;
  z-index: 1;
}

.logout-modal .btn-cancel,
.logout-modal .btn-logout {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-modal .btn-cancel {
  background: rgba(30, 43, 36, 0.72);
  border: 1px solid rgba(126, 164, 141, 0.42);
  color: #e5f3ea;
}

.logout-modal .btn-cancel:hover {
  background: rgba(40, 55, 48, 0.88);
  border-color: rgba(134, 239, 172, 0.54);
}

.logout-modal .btn-logout {
  background: linear-gradient(135deg,
    rgba(220, 38, 38, 0.9) 0%,
    rgba(185, 28, 28, 0.88) 100%);
  border: 1px solid rgba(239, 68, 68, 0.54);
  color: #fef2f2;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.logout-modal .btn-logout:hover {
  background: linear-gradient(135deg,
    rgba(220, 38, 38, 0.98) 0%,
    rgba(185, 28, 28, 0.96) 100%);
  border-color: rgba(255, 100, 100, 0.68);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

@media (max-width: 480px) {
  .logout-modal {
    width: 95%;
    max-width: none;
  }

  .logout-modal .modal-header {
    padding: 16px;
  }

  .logout-modal .modal-body {
    padding: 16px;
  }

  .logout-modal .modal-footer {
    padding: 12px 16px;
    flex-direction: column-reverse;
  }

  .logout-modal .btn-cancel,
  .logout-modal .btn-logout {
    width: 100%;
  }
}
</style>


