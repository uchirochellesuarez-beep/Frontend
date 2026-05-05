<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">📊 Farmer Income Records</h1>
      <p class="page-subtitle">Manage farmer income records and distributions</p>
    </div>

    <!-- Tab Buttons -->
    <div class="tabs-container">
      <!-- For President: Two tabs -->
      <div v-if="isPresident" class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'verify' }"
          @click="activeTab = 'verify'"
        >
          🔍 Verify Income
          <span v-if="pendingCount !== null" class="tab-badge">{{ pendingCount }}</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'eligible' }"
          @click="activeTab = 'eligible'"
        >
          ✅ Eligible Records
          <span v-if="eligibleCount !== null" class="tab-badge">{{ eligibleCount }}</span>
        </button>
      </div>

      <!-- For Officers: One tab -->
      <div v-else-if="isOfficer" class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'eligible' }"
          @click="activeTab = 'eligible'"
        >
          ✅ Eligible Records
          <span v-if="eligibleCount !== null" class="tab-badge">{{ eligibleCount }}</span>
        </button>
      </div>

      <!-- For Agriculturist: One tab -->
      <div v-else-if="isAgriculturist" class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'distribution' }"
          @click="activeTab = 'distribution'"
        >
          🌾 Distribution Management
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Verify Tab (President only) -->
      <PresidentFarmerIncomePage v-if="isPresident && activeTab === 'verify'" />

      <!-- Eligible Records Tab -->
      <OfficerFarmerIncomePage v-if="(isPresident || isOfficer) && activeTab === 'eligible'" />

      <!-- Distribution Tab (Agriculturist only) -->
      <AgriculturistIncomeReviewPage v-if="isAgriculturist && activeTab === 'distribution'" />
    </div>

    <!-- No access message -->
    <div v-if="!isPresident && !isOfficer && !isAgriculturist" class="empty-state">
      <div class="empty-icon">🚫</div>
      <p>No access to Farmer Income Records for your role.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import PresidentFarmerIncomePage from './PresidentFarmerIncomePage.vue'
import OfficerFarmerIncomePage from './OfficerFarmerIncomePage.vue'
import AgriculturistIncomeReviewPage from './AgriculturistIncomeReviewPage.vue'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)

const isPresident = computed(() => currentUser.value?.role === 'president')
const isOfficer = computed(() => ['president', 'treasurer', 'auditor'].includes(currentUser.value?.role))
const isAgriculturist = computed(() => currentUser.value?.role === 'agriculturist')

const activeTab = ref('verify') // President starts with verify, others with eligible
const pendingCount = ref(null)
const eligibleCount = ref(null)

// Set initial active tab based on role
onMounted(() => {
  if (isOfficer.value && !isPresident.value) {
    activeTab.value = 'eligible'
  } else if (isAgriculturist.value) {
    activeTab.value = 'distribution'
  }

  /* Finishing polish */
  
  // Fetch stats for badges
  fetchStats()
})

// Fetch statistics
const fetchStats = async () => {
  if (!currentUser.value?.barangay_id) return
  try {
    const res = await fetch(`/api/farmer-income/by-barangay/${currentUser.value.barangay_id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const data = await res.json()
    if (res.ok) {
      pendingCount.value = data.filter(r => r.status === 'Pending').length
      eligibleCount.value = data.filter(r => r.status === 'Eligible').length
    }
  } catch (err) {
    console.error('Error fetching stats:', err)
  }
}
</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-title {
  font-size: 2.2em;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.page-subtitle {
  font-size: 1em;
  color: #7f8c8d;
  margin: 0;
}

.tabs-container {
  margin: 30px 0;
  display: flex;
  justify-content: center;
}

.tabs {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #ecf0f1;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #7f8c8d;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  bottom: -2px;
}

.tab-btn:hover {
  color: #3498db;
}

.tab-btn.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.tab-badge {
  display: inline-block;
  background: #3498db;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.85em;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.tab-content {
  margin-top: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}


/* Enhanced forest-green shell */
.page-container {
  background: transparent;
}

.page-header {
  margin-bottom: 32px;
  padding: 28px 32px;
  text-align: center;
  background: linear-gradient(145deg, rgba(18, 43, 29, 0.96), rgba(14, 33, 23, 0.95));
  border: 1px solid rgba(126, 184, 145, 0.22);
  border-radius: 26px;
  box-shadow: 0 18px 36px rgba(5, 12, 8, 0.32);
}

.page-title {
  color: #4ade80;
  font-size: clamp(2rem, 2.8vw, 2.6rem);
  font-weight: 900;
  letter-spacing: -0.04em;
}

.page-subtitle {
  color: rgba(220, 252, 231, 0.78);
  font-size: 1.05rem;
}

.tabs-container {
  margin: 28px 0 30px;
  padding: 16px 18px;
  display: flex;
  justify-content: center;
  background: linear-gradient(145deg, rgba(66, 129, 92, 0.16), rgba(41, 88, 61, 0.18));
  border: 1px solid rgba(126, 184, 145, 0.24);
  border-radius: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.tabs {
  display: flex;
  gap: 12px;
  border-bottom: none;
  flex-wrap: wrap;
  justify-content: center;
}

.tab-btn {
  padding: 14px 26px;
  background: linear-gradient(145deg, rgba(111, 85, 37, 0.78), rgba(91, 117, 70, 0.82));
  border: 1px solid rgba(239, 213, 144, 0.26);
  border-radius: 18px;
  color: #f3f4f6;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(20, 25, 20, 0.18);
  bottom: 0;
}

.tab-btn:hover {
  color: #ffffff;
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.tab-btn.active {
  color: #ffffff;
  border-bottom-color: transparent;
  background: linear-gradient(145deg, rgba(125, 92, 40, 0.92), rgba(90, 143, 96, 0.9));
  border-color: rgba(255, 235, 179, 0.36);
  box-shadow: 0 10px 24px rgba(18, 24, 18, 0.26);
}

.tab-badge {
  background: rgba(59, 130, 246, 0.88);
  color: #eff6ff;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 0.82em;
  font-weight: 800;
}

.tab-content {
  margin-top: 18px;
}

.empty-state {
  padding: 56px 24px;
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(18, 43, 29, 0.9), rgba(14, 33, 23, 0.88));
  border: 1px solid rgba(126, 184, 145, 0.2);
  box-shadow: 0 16px 30px rgba(5, 12, 8, 0.24);
}

.empty-state p {
  color: rgba(220, 252, 231, 0.78);
}
.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 1.2em;
  color: #7f8c8d;
  margin: 0;
}
</style>
