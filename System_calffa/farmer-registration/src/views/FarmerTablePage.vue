<template>
  <div class="farmer-table-page glass-module-page">
    <DashboardHeader :user="authStore.currentUser" />
    <div class="page-inner">
      <div class="page-top-row">
        <h1 class="page-title">Members Management</h1>
        <button
          v-if="canViewMemberSummary"
          @click="goToMembersSummary"
          class="btn-summary"
          type="button"
        >
           <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" class="btn-tab-icon" alt="" />
           Members Summary
        </button>
      </div>
      
      <!-- Tabs -->
      <div class="tabs-container mb-6">
        <button 
          @click="activeTab = 'pending'" 
          :class="['tab-btn', { 'active': activeTab === 'pending' }]"
        >
           <img src="https://cdn-icons-png.flaticon.com/512/13366/13366070.png" class="tab-icon" alt="" />
           Pending Approval ({{ pendingCount }})
        </button>
        <button 
          @click="activeTab = 'registered'" 
          :class="['tab-btn', { 'active': activeTab === 'registered' }]"
        >
           <img src="https://cdn-icons-png.flaticon.com/512/7518/7518748.png" class="tab-icon" alt="" />
           Registered Members ({{ registeredCount }})
        </button>
        <button 
          @click="activeTab = 'rejected'" 
          :class="['tab-btn', { 'active': activeTab === 'rejected' }]"
        >
           <img src="https://cdn-icons-png.flaticon.com/512/6711/6711656.png" class="tab-icon" alt="" />
           Rejected Accounts ({{ rejectedCount }})
        </button>
      </div>

      <!-- Tab Content -->
      <div v-if="activeTab === 'pending'">
        <PendingFarmersTab 
          :farmers="pendingFarmers"
          :loading="loading"
          :error="error"
          @approve="handleApprove"
          @reject="handleReject"
          @delete="handleDelete"
          @update-role="handleUpdateRole"
          @update-membership-status="handleUpdateMembershipStatus"
          @refresh="loadFarmers"
        />
      </div>
      <div v-else-if="activeTab === 'rejected'">
        <div class="rejected-card">
          <h2 class="rejected-title">Rejected Accounts</h2>
          <div v-if="loading" class="state-center">
            <div class="spinner"></div>
            <p class="state-text">Loading...</p>
          </div>
          <div v-else-if="rejectedFarmers.length === 0" class="state-center">
            <p class="state-text">No rejected accounts</p>
          </div>
          <div v-else class="table-wrap">
            <table class="rej-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Reference #</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="farmer in rejectedFarmers" :key="farmer.id">
                  <td class="td-center">
                    <img
                      v-if="farmer.profile_picture"
                      :src="getProfilePictureUrl(farmer.profile_picture)"
                      alt="Profile"
                      class="avatar"
                    />
                    <div v-else class="avatar-placeholder">👤</div>
                  </td>
                  <td class="td-name">{{ farmer.full_name }}</td>
                  <td class="td-muted">{{ farmer.reference_number }}</td>
                  <td class="td-muted">{{ farmer.contact_number }}</td>
                  <td>
                    <span class="role-badge">{{ farmer.role }}</span>
                  </td>
                  <td class="td-actions">
                    <button @click="handleApprove(farmer.id)" class="act-approve">Approve</button>
                    <button @click="handleDelete(farmer.id)" class="act-delete">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div v-else>
        <FarmerTable 
          :farmers="registeredFarmers"
          :loading="loading"
          :error="error"
          :user-barangay-id="userBarangayId"
          :is-president="isPresident"
          @member-updated="loadFarmers"
          @member-deleted="loadFarmers"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import FarmerTable from '../components/FarmerTable.vue'
import PendingFarmersTab from '../components/PendingFarmersTab.vue'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const activeTab = ref('pending')
const allFarmers = ref([])
const loading = ref(false)
const error = ref(null)

// Helper function to get correct profile picture URL
// Handles both external Google URLs and local uploaded pictures
const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return null
  // Check if it's already a full URL (Google profile pictures start with https://)
  if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
    return profilePicture
  }
  // For local uploads (starts with /uploads/), return as-is
  // The /uploads path is proxied to the backend via Vite in development
  // and served directly by the backend in production
  return profilePicture
}

// Check authorization - only admin, president, and treasurer can access
const isAuthorized = computed(() => {
  const user = authStore.currentUser
  return user && ['admin', 'president', 'treasurer'].includes(user.role)
})

const userBarangayId = computed(() => {
  return authStore.currentUser?.barangay_id
})

const isAdmin = computed(() => {
  return authStore.currentUser?.role === 'admin'
})

const isPresident = computed(() => {
  return authStore.currentUser?.role === 'president'
})

const isTreasurer = computed(() => {
  return authStore.currentUser?.role === 'treasurer'
})

const canViewMemberSummary = computed(() => {
  const role = authStore.currentUser?.role
  return ['admin', 'president', 'treasurer'].includes(role)
})

const pendingFarmers = computed(() => {
  return allFarmers.value.filter(f => f.status === 'pending' || !f.status)
})

const registeredFarmers = computed(() => {
  return allFarmers.value.filter(f => f.status === 'approved')
})

const rejectedFarmers = computed(() => {
  return allFarmers.value.filter(f => f.status === 'rejected')
})

const pendingCount = computed(() => pendingFarmers.value.length)

const registeredCount = computed(() => registeredFarmers.value.length)

const rejectedCount = computed(() => rejectedFarmers.value.length)

const loadFarmers = async () => {
  loading.value = true
  error.value = null
  try {
    const token = authStore.token
    // Call root endpoint to get all farmers with all statuses (pending, approved, rejected)
    const response = await fetch('/api/farmers', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    if (response.ok) {
      const data = await response.json()
      if (isAdmin.value) {
        // Admin can see all farmers from all barangays
        allFarmers.value = data.farmers || data || []
      } else if (isPresident.value || isTreasurer.value) {
        // President/Treasurer sees only farmers from their own barangay
        const farmers = data.farmers || data || []
        if (userBarangayId.value) {
          allFarmers.value = farmers.filter(
            f => f.barangay_id === userBarangayId.value
          )
        } else {
          allFarmers.value = farmers
        }
      } else {
        error.value = 'Insufficient permissions to view members'
        allFarmers.value = []
      }
    } else if (response.status === 403) {
      error.value = 'You do not have permission to view members. Only Admins and Presidents can access this page.'
      allFarmers.value = []
    } else {
      error.value = 'Failed to load farmers'
    }
  } catch (err) {
    console.error('Error loading farmers:', err)
    error.value = err.message || 'Failed to load farmers'
  } finally {
    loading.value = false
  }
}

const handleApprove = async (farmerId) => {
  try {
    const token = authStore.token
    const response = await fetch(`/api/farmers/${farmerId}/approve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    const data = await response.json()
    if (response.ok) {
      await loadFarmers()
      alert('Farmer approved successfully!')
    } else {
      alert('Failed to approve farmer: ' + (data.message || 'Unknown error'))
    }
  } catch (err) {
    alert('Error approving farmer: ' + err.message)
  }
}

const handleReject = async (farmerId) => {
  try {
    const token = authStore.token
    const response = await fetch(`/api/farmers/${farmerId}/reject`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
    const data = await response.json()
    if (response.ok) {
      await loadFarmers()
      alert('Farmer rejected successfully!')
    } else {
      alert('Failed to reject farmer: ' + (data.message || 'Unknown error'))
    }
  } catch (err) {
    alert('Error rejecting farmer: ' + err.message)
  }
}

const handleDelete = async (farmerId) => {
  try {
    const response = await fetch(`/api/farmers/${farmerId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.ok) {
      await loadFarmers()
      alert('Farmer deleted successfully!')
    } else {
      const data = await response.json()
      alert('Failed to delete farmer: ' + (data.message || 'Unknown error'))
    }
  } catch (err) {
    alert('Error deleting farmer: ' + err.message)
  }
}

const handleUpdateRole = async ({ memberId, newRole }) => {
  try {
    const response = await fetch(`/api/farmers/${memberId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    })
    if (response.ok) {
      await loadFarmers()
    } else {
      const data = await response.json()
      alert('Failed to update role: ' + (data.message || 'Unknown error'))
      await loadFarmers() // Refresh to reset dropdown
    }
  } catch (err) {
    alert('Error updating role: ' + err.message)
    await loadFarmers() // Refresh to reset dropdown
  }
}

const handleUpdateMembershipStatus = async ({ memberId, membershipStatus }) => {
  try {
    const token = authStore.token
    const response = await fetch(`/api/farmers/${memberId}/membership-status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ membership_status: membershipStatus })
    })
    if (response.ok) {
      await loadFarmers()
    } else {
      const data = await response.json()
      alert('Failed to update membership status: ' + (data.message || 'Unknown error'))
      await loadFarmers() // Refresh to reset dropdown
    }
  } catch (err) {
    alert('Error updating membership status: ' + err.message)
    await loadFarmers() // Refresh to reset dropdown
  }
}

onMounted(() => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }
  // Check authorization
  if (!isAuthorized.value) {
    alert('You do not have permission to access Member Management. Only Admins, Presidents, and Treasurers can access this page.')
    router.push('/dashboard')
    return
  }
  loadFarmers()
})

const goToMembersSummary = () => router.push('/members-summary')
</script>

<style scoped>
/* ============================================
   PAGE — Dark Green Glassmorphic Theme
   ============================================ */
.farmer-table-page {
  --green: #34d399;
  --teal: #2dd4bf;
  --red: #f87171;
  --text-main: #eefde6;
  --text-muted: rgba(220, 238, 211, 0.78);
  --glass-line: rgba(190, 235, 203, 0.13);

  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(145deg, #0f1712 0%, #132119 22%, #1a2b20 45%, #243b2c 72%, #2f4a38 100%);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: var(--text-main);
  position: relative;
  isolation: isolate;
}

.farmer-table-page::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 10% 90%, rgba(17, 94, 41, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 90% 10%, rgba(45, 212, 191, 0.10) 0%, transparent 60%),
    radial-gradient(circle at 75% 75%, rgba(163, 230, 53, 0.08) 0%, transparent 30%);
  pointer-events: none;
  z-index: -1;
}

.page-inner {
  max-width: 1400px;
  margin: 0 auto;
}

/* ============================================
   HEADER ROW
   ============================================ */
.page-top-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: var(--text-main);
}

.btn-summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 2px solid #166534 !important;
  background: #ffffff !important;
  color: #14532d !important;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: none !important;
}

.btn-summary:hover {
  background: #f0fdf4 !important;
  color: #14532d !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 101, 52, 0.16) !important;
}

.btn-tab-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.35)) brightness(1.1);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.btn-summary:hover .btn-tab-icon {
  transform: scale(1.15);
}

/* ============================================
   TABS
   ============================================ */
.tabs-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid var(--glass-line);
  border-radius: 10px;
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.22s ease;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

.tab-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.35)) brightness(1.05);
  flex-shrink: 0;
  transition: transform 0.22s ease, filter 0.22s ease;
}

.tab-btn:hover .tab-icon {
  transform: scale(1.15);
  filter: drop-shadow(0 2px 6px rgba(74,222,128,0.30)) brightness(1.15);
}

.tab-btn.active .tab-icon {
  filter: drop-shadow(0 2px 8px rgba(74,222,128,0.45)) brightness(1.2);
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.09);
  color: var(--text-main);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.22), rgba(34, 197, 94, 0.15));
  border-color: rgba(74, 222, 128, 0.38);
  color: var(--green);
  box-shadow: 0 2px 10px rgba(74, 222, 128, 0.18);
}

/* ============================================
   REJECTED CARD & TABLE
   ============================================ */
.rejected-card {
  background: rgba(28, 42, 33, 0.90);
  border: 1px solid var(--glass-line);
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.30), inset 1px 1px 0 rgba(255,255,255,0.05);
}

.rejected-title {
  margin: 0 0 16px 0;
  font-size: 17px;
  font-weight: 800;
  color: #b6f7cb;
}

.state-center {
  text-align: center;
  padding: 32px 0;
}

.state-text {
  color: var(--text-muted);
  margin-top: 8px;
}

.table-wrap {
  overflow-x: auto;
}

.rej-table {
  width: 100%;
  border-collapse: collapse;
}

.rej-table thead {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.18) 0%, rgba(45, 212, 191, 0.10) 100%);
}

.rej-table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 800;
  color: #b6f7cb;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 1px solid rgba(190, 235, 203, 0.15);
}

.rej-table th:first-child { text-align: center; }

.rej-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 13px;
  color: var(--text-main);
  vertical-align: middle;
}

.rej-table tbody tr:nth-child(even) td {
  background: rgba(255,255,255,0.025);
}

.rej-table tbody tr:hover td {
  background: rgba(74, 222, 128, 0.07);
}

.td-center { text-align: center; }

.td-name { font-weight: 700; }

.td-muted { color: var(--text-muted); }

.td-actions { white-space: nowrap; }

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(74, 222, 128, 0.35);
}

.avatar-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.role-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text-muted);
}

.act-approve {
  background: none;
  border: none;
  color: var(--green);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  margin-right: 12px;
  padding: 0;
}

.act-approve:hover { text-decoration: underline; }

.act-delete {
  background: none;
  border: none;
  color: var(--red);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.act-delete:hover { text-decoration: underline; }

/* spinner reuse */
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(74,222,128,0.18);
  border-top-color: var(--green);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin: 0 auto;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>