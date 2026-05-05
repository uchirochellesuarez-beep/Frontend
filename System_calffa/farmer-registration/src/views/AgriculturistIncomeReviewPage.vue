<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">🌾 Talaan ng Kita at Pamamahagi ng Tulong</h1>
      <p class="page-subtitle">Tuklasin ang mga inaprubang talaan at pamahalaan ang distribusyon ng tulong sa pagsasaka</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'eligible' }"
        @click="activeTab = 'eligible'; fetchRecords()"
      >
        📋 Eligible Records
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'assistance' }"
        @click="activeTab = 'assistance'; fetchDistributions()"
      >
        📦 Pamamahagi ng Tulong
      </button>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="errorMessage" class="alert alert-error">
      <span>❌ {{ errorMessage }}</span>
      <button class="alert-close" @click="errorMessage = ''">&times;</button>
    </div>
    <div v-if="successMessage" class="alert alert-success">
      <span>✅ {{ successMessage }}</span>
      <button class="alert-close" @click="successMessage = ''">&times;</button>
    </div>

    <!-- No barangay warning -->
    <div v-if="!currentUser?.barangay_id" class="alert alert-warning">
      ⚠️ Hindi ka naka-assign sa anumang barangay. Makipag-ugnayan sa admin.
    </div>

    <!-- TAB 1: ELIGIBLE RECORDS -->
    <template v-if="activeTab === 'eligible'">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Kinukuha ang mga talaan...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="eligibleRecords.length === 0 && currentUser?.barangay_id" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Walang eligible na naitatalang kita pa sa iyong barangay.</p>
      </div>

      <!-- Records Grid -->
      <div v-else class="records-grid">
        <div
          v-for="record in eligibleRecords"
          :key="record.id"
          class="record-card"
        >
          <!-- Header -->
          <div class="card-header">
            <div class="farmer-section">
              <div class="farmer-avatar">👨‍🌾</div>
              <div class="farmer-details">
                <div class="farmer-name">{{ record.farmer_name }}</div>
                <div class="farmer-date">📅 {{ formatDate(record.created_at) }}</div>
              </div>
            </div>
            <span class="status-badge eligible">Eligible</span>
          </div>

          <!-- Farm Info -->
          <div class="card-info">
            <div class="info-row">
              <span class="info-label">Lawak:</span>
              <span class="info-value">{{ record.area_hectares }} ektarya</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pagtatanim:</span>
              <span class="info-value">{{ record.planting_method === 'sabog' ? 'Sabog' : 'Talok' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ani:</span>
              <span class="info-value">{{ record.sacks_harvested }} sako</span>
            </div>
          </div>

          <!-- Financials -->
          <div class="card-financials">
            <div class="fin-item">
              <span>Benta:</span>
              <span class="fin-value income">₱{{ parseFloat(record.gross_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="fin-item">
              <span>Gastos:</span>
              <span class="fin-value expense">₱{{ parseFloat(record.total_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="fin-item">
              <span>Net:</span>
              <span class="fin-value" :class="parseFloat(record.net_income || 0) >= 0 ? 'profit' : 'loss'">
                ₱{{ parseFloat(record.net_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="card-actions">
            <button class="btn-details" @click="openRecordDetail(record)">
              👁️ Detalye
            </button>
            <button class="btn-assistance" @click="openAssistanceForm(record)">
              📬 Gumawa ng Tulong
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- TAB 2: PAMAMAHAGI NG TULONG -->
    <template v-if="activeTab === 'assistance'">
      <!-- Loading State -->
      <div v-if="loadingDistributions" class="loading-state">
        <div class="spinner"></div>
        <p>Kinukuha ang mga pamamahagi...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="distributions.length === 0 && currentUser?.barangay_id" class="empty-state">
        <div class="empty-icon">📦</div>
        <p>Walang programa ng pamamahagi pa sa iyong barangay.</p>
      </div>

      <!-- Assistance Records Grid -->
      <div v-else class="distributions-container">
        <!-- Active Distributions -->
        <div v-if="activeAssistance.length > 0">
          <h3 class="section-title">⏳ Naghihintay ng Pagtanggap</h3>
          <div class="records-grid">
            <div v-for="dist in activeAssistance" :key="dist.id" class="record-card">
              <div class="card-header">
                <div class="farmer-section">
                  <div class="farmer-avatar">👨‍🌾</div>
                  <div class="farmer-details">
                    <div class="farmer-name">{{ dist.farmer_name }}</div>
                    <div class="farmer-date">{{ formatDate(dist.created_at) }}</div>
                  </div>
                </div>
                <span class="status-badge pending">Assistance</span>
              </div>

              <div class="card-info">
                <div class="info-row">
                  <span class="info-label">Tulong:</span>
                  <span class="info-value">{{ formatAssistanceType(dist.assistance_type) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Dami:</span>
                  <span class="info-value">{{ dist.notes ? extractQuantityFromNotes(dist.notes) : dist.quantity + ' ' + (dist.unit || 'sako') }}</span>
                </div>
              </div>

              <div class="card-actions">
                <button class="btn-completed" @click="markAsCompleted(dist)">
                  ✅ Tapos na
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed Distributions -->
        <div v-if="completedAssistance.length > 0">
          <h3 class="section-title">✅ Tapos na</h3>
          <div class="records-grid">
            <div v-for="dist in completedAssistance" :key="dist.id" class="record-card completed">
              <div class="card-header">
                <div class="farmer-section">
                  <div class="farmer-avatar">👨‍🌾</div>
                  <div class="farmer-details">
                    <div class="farmer-name">{{ dist.farmer_name }}</div>
                    <div class="farmer-date">{{ formatDate(dist.created_at) }}</div>
                  </div>
                </div>
                <span class="status-badge completed">Completed</span>
              </div>

              <div class="card-info">
                <div class="info-row">
                  <span class="info-label">Tulong:</span>
                  <span class="info-value">{{ formatAssistanceType(dist.assistance_type) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Dami:</span>
                  <span class="info-value">{{ dist.notes ? extractQuantityFromNotes(dist.notes) : dist.quantity + ' ' + (dist.unit || 'sako') }}</span>
                </div>
                <div v-if="dist.distribution_date" class="info-row">
                  <span class="info-label">Tapos:</span>
                  <span class="info-value">{{ formatDate(dist.distribution_date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- DETAIL MODAL -->
  <Teleport to="body">
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container modal-lg">
        <div class="modal-header">
          <h2>📋 Detalye ng Talaan ng Kita</h2>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedRecord">
          <div class="detail-section">
            <h3>👨‍🌾 Impormasyon ng Magsasaka</h3>
            <div class="detail-grid">
              <div><strong>Pangalan:</strong> {{ selectedRecord.farmer_name }}</div>
              <div><strong>Petsa:</strong> {{ formatDate(selectedRecord.created_at) }}</div>
            </div>
          </div>

          <div class="detail-section">
            <h3>🌱 Detalye ng Kalasahan</h3>
            <div class="detail-grid">
              <div><strong>Lawak:</strong> {{ selectedRecord.area_hectares }} ektarya</div>
              <div><strong>Pagtatanim:</strong> {{ selectedRecord.planting_method === 'sabog' ? 'Sabog' : 'Talok' }}</div>
              <div><strong>Ani:</strong> {{ selectedRecord.sacks_harvested }} sako × {{ selectedRecord.kg_per_sack }} kg</div>
            </div>
          </div>

          <div class="detail-section">
            <h3>💰 Buod ng Pinansyal</h3>
            <div class="detail-grid">
              <div><strong>Halaga ng Ani:</strong> ₱{{ parseFloat(selectedRecord.gross_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</div>
              <div><strong>Kabuuang Gastos:</strong> ₱{{ parseFloat(selectedRecord.total_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</div>
              <div><strong>Netong Kita:</strong> ₱{{ parseFloat(selectedRecord.net_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ASSISTANCE FORM MODAL -->
  <Teleport to="body">
    <div v-if="showAssistanceModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container modal-md">
        <div class="modal-header">
          <h2>📬 Lumikha ng Tulong</h2>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedRecord">
          <div class="form-group">
            <label>👨‍🌾 Magsasaka</label>
            <input type="text" :value="selectedRecord.farmer_name" disabled class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>🌾 Pataba (Fertilizer)</label>
              <div class="input-group">
                <input v-model.number="assistanceForm.fertilizer_sacks" type="number" min="0" placeholder="0" class="form-input" />
                <span class="input-unit">sako</span>
              </div>
            </div>
            <div class="form-group">
              <label>🌱 Binhi (Seeds)</label>
              <div class="input-group">
                <input v-model.number="assistanceForm.seed_sacks" type="number" min="0" placeholder="0" class="form-input" />
                <span class="input-unit">sako</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>📝 Tala (opsyonal)</label>
            <textarea v-model="assistanceForm.notes" placeholder="Anumang karagdagang impormasyon..." class="form-input" style="min-height: 80px; font-family: inherit;"></textarea>
          </div>

          <div class="modal-footer">
            <button @click="closeModal" class="btn-cancel">Huwag</button>
            <button @click="submitAssistance" class="btn-submit" :disabled="submittingAssistance">
              {{ submittingAssistance ? '⏳ Sinusubmit...' : '✅ Lumikha' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)

// Tab state
const activeTab = ref('eligible')

// Messages
const errorMessage = ref('')
const successMessage = ref('')

// Record states
const loading = ref(false)
const records = ref([])
const eligibleRecords = computed(() => {
  // Filter eligible records that don't have any distributions yet
  const distributedRecordIds = new Set(distributions.value.map(d => d.income_record_id))
  return records.value.filter(r => r.status === 'Eligible' && !distributedRecordIds.has(r.id))
})

// Distribution states
const loadingDistributions = ref(false)
const distributions = ref([])
const activeAssistance = computed(() => distributions.value.filter(d => d.status === 'Pending' || d.status === 'Ready for Distribution'))
const completedAssistance = computed(() => distributions.value.filter(d => d.status === 'Distributed' || d.status === 'Confirmed Received'))

// Modals
const showDetailModal = ref(false)
const showAssistanceModal = ref(false)
const selectedRecord = ref(null)

// Assistance form
const submittingAssistance = ref(false)
const assistanceForm = ref({
  fertilizer_sacks: 0,
  seed_sacks: 0,
  notes: ''
})

// Fetch records
const fetchRecords = async () => {
  if (!currentUser.value?.barangay_id) return
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch(`/api/farmer-income/by-barangay/${currentUser.value.barangay_id}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Hindi makuha ang mga talaan.')
    records.value = data
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}

// Fetch distributions
const fetchDistributions = async () => {
  if (!currentUser.value?.barangay_id) return
  loadingDistributions.value = true
  errorMessage.value = ''
  try {
    const res = await fetch(`/api/farmer-income/distribution/by-barangay/${currentUser.value.barangay_id}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Hindi makuha ang mga pamamahagi.')
    distributions.value = data
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loadingDistributions.value = false
  }
}

// Modal functions
const openRecordDetail = (record) => {
  selectedRecord.value = record
  showDetailModal.value = true
}

const openAssistanceForm = (record) => {
  selectedRecord.value = record
  assistanceForm.value = {
    fertilizer_sacks: 0,
    seed_sacks: 0,
    notes: ''
  }
  showAssistanceModal.value = true
}

const closeModal = () => {
  showDetailModal.value = false
  showAssistanceModal.value = false
  selectedRecord.value = null
}

// Submit assistance
const submitAssistance = async () => {
  const fertilizer = assistanceForm.value.fertilizer_sacks || 0
  const seeds = assistanceForm.value.seed_sacks || 0
  
  if (fertilizer === 0 && seeds === 0) {
    errorMessage.value = 'Maglagay ng dami para sa Pataba o Binhi.'
    return
  }
  
  submittingAssistance.value = true
  errorMessage.value = ''
  
  try {
    // Determine assistance type based on which values are entered
    let assistanceType = ''
    if (fertilizer > 0 && seeds > 0) {
      assistanceType = 'both'
    } else if (fertilizer > 0) {
      assistanceType = 'fertilizer'
    } else {
      assistanceType = 'seeds'
    }
    
    const quantity = Math.max(fertilizer, seeds)
    
    const res = await fetch('/api/farmer-income/distribution/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        income_record_id: selectedRecord.value.id,
        assistance_type: assistanceType,
        quantity: quantity,
        unit: 'sako',
        notes: `Pataba: ${fertilizer} sako, Binhi: ${seeds} sako${assistanceForm.value.notes ? ' - ' + assistanceForm.value.notes : ''}`
      })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'May problema sa paglikha ng distribution record.')
    
    successMessage.value = 'Matagumpay na lumikha ng tulong!'
    closeModal()
    await fetchDistributions()
  } catch (err) {
    console.error('Assistance submission error:', err)
    errorMessage.value = err.message
  } finally {
    submittingAssistance.value = false
  }
}

// Mark assistance as completed
const markAsCompleted = async (distribution) => {
  if (!confirm('I-confirm na natanggap na ang assistance?')) return
  
  loadingDistributions.value = true
  errorMessage.value = ''
  
  try {
    const res = await fetch(`/api/farmer-income/distribution/${distribution.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ status: 'Distributed' })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'May problema.')
    
    successMessage.value = 'Matagumpay na na-update ang tulong!'
    await fetchDistributions()
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loadingDistributions.value = false
  }
}

// Helpers
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fil-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatAssistanceType = (type) => {
  const map = { 'fertilizer': 'Pataba', 'seeds': 'Binhi', 'both': 'Pataba at Binhi' }
  return map[type] || type
}

const extractQuantityFromNotes = (notes) => {
  // Extract the quantity breakdown from notes (format: "Pataba: X sako, Binhi: Y sako - ...")
  if (!notes) return ''
  const quantityPart = notes.split(' - ')[0] // Get the part before any user notes
  return quantityPart.trim()
}

onMounted(() => {
  fetchRecords()
  fetchDistributions()
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 30px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  color: #2d5016;
  margin: 0 0 10px 0;
}

.page-subtitle {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background-color: white;
  padding: 15px 20px;
  border-radius: 8px;
  border-bottom: 2px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 0.95rem;
  color: #666;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tab-btn.active {
  color: #2d5016;
  border-bottom-color: #2d5016;
}

.tab-btn:hover:not(.active) {
  color: #4a7c1c;
}

/* Alerts */
.alert {
  padding: 12px 16px;
  margin-bottom: 20px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.alert-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
}

/* States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 20px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2d5016;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

/* Records Grid */
.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.record-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.record-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.record-card.completed {
  opacity: 0.8;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.farmer-section {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
}

.farmer-avatar {
  font-size: 2rem;
}

.farmer-details {
  display: flex;
  flex-direction: column;
}

.farmer-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.farmer-date {
  font-size: 0.8rem;
  color: #999;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.eligible {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.status-badge.pending {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-badge.completed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

/* Card Info */
.card-info {
  padding: 16px;
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.info-label {
  color: #999;
  font-weight: 500;
}

.info-value {
  color: #333;
  font-weight: 600;
}

/* Card Financials */
.card-financials {
  padding: 16px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.fin-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.fin-item:last-child {
  margin-bottom: 0;
}

.fin-value {
  font-weight: 600;
}

.fin-value.income {
  color: #388e3c;
}

.fin-value.expense {
  color: #d32f2f;
}

.fin-value.profit {
  color: #2e7d32;
}

.fin-value.loss {
  color: #c62828;
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #eee;
}

.card-actions button {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-details {
  background-color: #f0f0f0;
  color: #333;
}

.btn-details:hover {
  background-color: #ddd;
}

.btn-assistance {
  background-color: #2d5016;
  color: white;
}

.btn-assistance:hover {
  background-color: #1f3a10;
}

.btn-completed {
  background-color: #e8f5e9;
  color: #2e7d32;
  width: 100%;
}

.btn-completed:hover {
  background-color: #c8e6c9;
}

/* Distributions */
.distributions-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d5016;
  margin: 0 0 20px 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 40px rgba(0,0,0,0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-lg {
  width: 90%;
  max-width: 700px;
}

.modal-md {
  width: 90%;
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
}

.modal-header h2 {
  margin: 0;
  color: #2d5016;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h3 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #2d5016;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
}

.detail-grid div {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.detail-grid strong {
  color: #666;
}

/* Forms */
.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #2d5016;
  box-shadow: 0 0 0 3px rgba(45, 80, 22, 0.1);
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-group .form-input {
  flex: 1;
  margin-bottom: 0;
}

.input-unit {
  padding: 8px 12px;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  border-left: none;
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cancel {
  background-color: #f0f0f0;
  color: #333;
}

.btn-cancel:hover {
  background-color: #ddd;
}

.btn-submit {
  background-color: #2d5016;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background-color: #1f3a10;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .records-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: column;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

/* Enhanced dark forest-green theme */
.page-container {
  max-width: 100%;
  padding: 0;
  background: transparent;
  min-height: auto;
}

.page-header,
.tab-navigation,
.record-card,
.loading-state,
.empty-state,
.modal-container,
.detail-section,
.card-financials {
  background: linear-gradient(145deg, rgba(20, 38, 28, 0.95), rgba(14, 29, 21, 0.93)) !important;
  border: 1px solid rgba(126, 184, 145, 0.18) !important;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(6, 12, 9, 0.24) !important;
}

.page-header,
.record-card,
.modal-container,
.detail-section,
.loading-state,
.empty-state {
  position: relative;
  overflow: hidden;
}

.page-header::before,
.record-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), transparent 40%, transparent 100%);
  pointer-events: none;
}

.page-header {
  margin-bottom: 22px;
  padding: 20px 24px;
}

.page-title {
  font-size: clamp(1.8rem, 2.2vw, 2.35rem);
  font-weight: 900;
  color: #86efac;
  letter-spacing: -0.04em;
}

.page-subtitle,
.farmer-date,
.info-label,
.detail-grid strong,
.form-group label,
.input-unit,
.loading-state,
.empty-state {
  color: rgba(220, 252, 231, 0.72) !important;
}

.tab-navigation {
  gap: 12px;
  margin-bottom: 24px;
  padding: 14px 16px;
  border-bottom: none;
}

.tab-btn {
  min-height: 48px;
  padding: 12px 20px;
  background: rgba(148, 166, 158, 0.12);
  border: 1px solid rgba(126, 184, 145, 0.16);
  border-bottom: none;
  border-radius: 14px;
  color: rgba(220, 252, 231, 0.8);
  font-weight: 700;
}

.tab-btn.active {
  color: #f0fdf4;
  background: linear-gradient(145deg, rgba(28, 116, 68, 0.9), rgba(24, 84, 55, 0.9));
  border-bottom: none;
}

.tab-btn:hover:not(.active) {
  color: #f0fdf4;
  background: rgba(255, 255, 255, 0.09);
}

.records-grid {
  gap: 1.25rem;
  margin-bottom: 24px;
}

.record-card {
  border-radius: 18px;
}

.record-card.completed {
  opacity: 0.92;
}

.card-header,
.card-actions,
.detail-grid div,
.modal-header,
.modal-footer {
  border-color: rgba(126, 184, 145, 0.12) !important;
}

.card-header,
.card-info,
.card-financials,
.card-actions,
.modal-header,
.modal-body {
  padding: 18px;
}

.farmer-avatar {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(74, 222, 128, 0.12);
  font-size: 1.7rem;
}

.farmer-name,
.info-value,
.detail-grid div,
.form-group label,
.modal-header h2,
.detail-section h3 {
  color: #ecfdf5;
}

.status-badge {
  padding: 0.45rem 0.85rem;
  font-weight: 700;
}

.status-badge.eligible {
  background-color: rgba(168, 85, 247, 0.16);
  color: #e9d5ff;
}

.status-badge.pending {
  background-color: rgba(251, 191, 36, 0.15);
  color: #fde68a;
}

.status-badge.completed {
  background-color: rgba(74, 222, 128, 0.14);
  color: #bbf7d0;
}

.fin-item {
  padding: 0.65rem 0;
  font-size: 0.92rem;
}

.card-financials {
  background: rgba(255, 255, 255, 0.03) !important;
}

.fin-value {
  font-weight: 800;
}

.btn-details,
.btn-assistance,
.btn-completed,
.btn-cancel,
.btn-submit {
  min-height: 42px;
  border-radius: 10px;
  font-weight: 700;
}

.btn-details,
.btn-cancel {
  background-color: rgba(255, 255, 255, 0.08);
  color: #ecfdf5;
  border: 1px solid rgba(126, 184, 145, 0.16);
}

.btn-details:hover,
.btn-cancel:hover {
  background-color: rgba(255, 255, 255, 0.14);
}

.btn-assistance,
.btn-submit {
  background: linear-gradient(135deg, #166534, #16a34a);
}

.btn-completed {
  background-color: rgba(74, 222, 128, 0.12);
  color: #bbf7d0;
  border: 1px solid rgba(74, 222, 128, 0.22);
}

.btn-completed:hover {
  background-color: rgba(74, 222, 128, 0.2);
}

.modal-overlay {
  background-color: rgba(0, 0, 0, 0.64);
  backdrop-filter: blur(8px);
}

.modal-header {
  background-color: rgba(255, 255, 255, 0.03);
}

.modal-close {
  color: rgba(220, 252, 231, 0.72);
}

.modal-close:hover {
  color: #f0fdf4;
}

.detail-grid {
  gap: 10px;
}

.form-input {
  background: rgba(152, 174, 166, 0.14);
  border: 1px solid rgba(126, 184, 145, 0.18);
  border-radius: 10px;
  color: #ecfdf5;
}

.form-input:disabled {
  background-color: rgba(255, 255, 255, 0.06);
  color: rgba(220, 252, 231, 0.58);
}

.input-unit {
  background-color: rgba(255, 255, 255, 0.06);
  border-color: rgba(126, 184, 145, 0.18);
}

@media (max-width: 768px) {
  .page-header,
  .tab-navigation,
  .card-header,
  .card-info,
  .card-financials,
  .card-actions,
  .modal-header,
  .modal-body {
    padding: 14px;
  }

  .tab-navigation {
    flex-direction: column;
  }

  .tab-btn {
    width: 100%;
  }
}
</style>
