<template>
  <div class="barangay-notice-page">
    <!-- Header -->
    <div class="notice-container">
      <div class="notice-card">
        <!-- Icon -->
        <div class="notice-icon">🏢</div>
        
        <!-- Title -->
        <h1 class="notice-title">{{ userBarangay }} Barangay</h1>
        
        <!-- Status Badge -->
        <div class="status-badge sample">{{ statusLabel }}</div>
        
        <!-- Message -->
        <div class="notice-message">
          <p class="primary-message">
            <strong>{{ language === 'tl' ? 'Salamat sa iyong pagpaparehistro!' : 'Thank you for registering!' }}</strong>
          </p>
          <p class="secondary-message">
            {{ message }}
          </p>
        </div>
        
        <!-- Features Status -->
        <div class="features-section">
          <h2 class="features-title">{{ language === 'tl' ? 'Status ng Features' : 'Feature Status' }}</h2>
          <div class="features-list">
            <div class="feature-item disabled">
              <span class="feature-icon">💰</span>
              <span class="feature-name">{{ language === 'tl' ? 'Mga Savings' : 'Savings' }}</span>
              <span class="status-label">{{ language === 'tl' ? 'Hindi Available' : 'Not Available' }}</span>
            </div>
            <div class="feature-item disabled">
              <span class="feature-icon">📋</span>
              <span class="feature-name">{{ language === 'tl' ? 'Mga Loan' : 'Loans' }}</span>
              <span class="status-label">{{ language === 'tl' ? 'Hindi Available' : 'Not Available' }}</span>
            </div>
            <div class="feature-item disabled">
              <span class="feature-icon">📈</span>
              <span class="feature-name">{{ language === 'tl' ? 'Share Capital' : 'Share Capital' }}</span>
              <span class="status-label">{{ language === 'tl' ? 'Hindi Available' : 'Not Available' }}</span>
            </div>
            <div class="feature-item disabled">
              <span class="feature-icon">🌾</span>
              <span class="feature-name">{{ language === 'tl' ? 'Kita ng Magsasaka' : 'Farmer Income' }}</span>
              <span class="status-label">{{ language === 'tl' ? 'Hindi Available' : 'Not Available' }}</span>
            </div>
            <div class="feature-item disabled">
              <span class="feature-icon">⚙️</span>
              <span class="feature-name">{{ language === 'tl' ? 'Machinery' : 'Machinery' }}</span>
              <span class="status-label">{{ language === 'tl' ? 'Hindi Available' : 'Not Available' }}</span>
            </div>
            <div class="feature-item disabled">
              <span class="feature-icon">📊</span>
              <span class="feature-name">{{ language === 'tl' ? 'Financial Overview' : 'Financial Overview' }}</span>
              <span class="status-label">{{ language === 'tl' ? 'Hindi Available' : 'Not Available' }}</span>
            </div>
          </div>
        </div>
        
        <!-- Info Box -->
        <div class="info-box">
          <div class="info-icon">ℹ️</div>
          <div class="info-content">
            <p class="info-title">{{ language === 'tl' ? 'Ano ang Susunod?' : 'What\'s Next?' }}</p>
            <p class="info-text">
              {{ nextStepMessage }}
            </p>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
          <button @click="goToDashboard" class="btn btn-primary">
            <span class="btn-icon">👤</span>
            {{ language === 'tl' ? 'Tingnan ang Profile' : 'View Profile' }}
          </button>
          <button @click="logout" class="btn btn-secondary">
            <span class="btn-icon">🚪</span>
            {{ language === 'tl' ? 'Mag-logout' : 'Logout' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const language = ref('en')

const userBarangay = computed(() => {
  return authStore.currentUser?.barangay_name || 'Unknown'
})

const statusLabel = computed(() => {
  return language.value === 'tl' ? 'Sample Barangay' : 'Sample Barangay'
})

const message = computed(() => {
  if (language.value === 'tl') {
    return `Ang ${userBarangay.value} ay isang sample na barangay. Ang mga transaction module ay hindi pa available para sa barangay na ito. Tiyak kaming magbubukas ng aktibong transactions sa hinaharap kapag naging available ang features.`
  }
  return `${userBarangay.value} is a sample barangay. Transaction modules are not yet available for this barangay. We will enable transactions in the future when the features become available.`
})

const nextStepMessage = computed(() => {
  if (language.value === 'tl') {
    return `Habang naghihintay para sa mga aktibong transactions, maaari mong suriin ang iyong profile at pamilyaridad sa platform. Ang lahat ng transaction-based features ay magiging available sa ${userBarangay.value} sa hinaharap.`
  }
  return `While awaiting active transactions, you can review your profile and familiarize yourself with the platform. All transaction-based features will become available in ${userBarangay.value} in the future.`
})

const goToDashboard = () => {
  router.push('/welcome')
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  // Check if user is authenticated
  if (!authStore.currentUser) {
    router.push('/login')
  }
})
</script>

<style scoped>
.barangay-notice-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.notice-container {
  width: 100%;
  max-width: 600px;
}

.notice-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.5s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notice-icon {
  font-size: 60px;
  text-align: center;
  margin-bottom: 20px;
}

.notice-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 15px;
}

.status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin: 0 auto 20px;
  display: block;
  width: fit-content;
}

.status-badge.sample {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.notice-message {
  background: #f8f9fa;
  border-left: 4px solid #ffc107;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 25px;
}

.primary-message {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.secondary-message {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.features-section {
  margin-bottom: 30px;
}

.features-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.features-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-item.disabled {
  background-color: #f5f5f5;
  opacity: 0.6;
  border-color: #d0d0d0;
}

.feature-item:hover {
  border-color: #999;
}

.feature-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.feature-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.status-label {
  font-size: 11px;
  color: #d32f2f;
  font-weight: 600;
}

.info-box {
  display: flex;
  gap: 15px;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 25px;
}

.info-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-title {
  font-weight: 600;
  color: #1565c0;
  margin: 0 0 5px 0;
  font-size: 14px;
}

.info-text {
  color: #0d47a1;
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #d0d0d0;
}

.btn-secondary:hover {
  background: #eeeeee;
  border-color: #999;
}

.btn-icon {
  font-size: 16px;
}

@media (max-width: 600px) {
  .notice-card {
    padding: 25px;
  }

  .notice-title {
    font-size: 22px;
  }

  .features-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
