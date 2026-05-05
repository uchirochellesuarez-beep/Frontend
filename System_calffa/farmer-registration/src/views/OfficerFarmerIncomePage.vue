<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">🌾 Talaan ng Kita ng mga Magsasaka</h1>
      <p class="page-subtitle">Suriin ang mga naitatalang kita mula sa mga magsasaka sa iyong barangay</p>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'records' }"
        @click="activeTab = 'records'"
      >
        📋 Mga Talaan
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-error">

      /* Finishing polish */
      <span>❌ {{ errorMessage }}</span>
      <button class="alert-close" @click="errorMessage = ''">&times;</button>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="alert alert-success">
      <span>✅ {{ successMessage }}</span>
      <button class="alert-close" @click="successMessage = ''">&times;</button>
    </div>

    <!-- No barangay warning -->
    <div v-if="!currentUser?.barangay_id" class="alert alert-warning">
      ⚠️ Hindi ka naka-assign sa anumang barangay. Makipag-ugnayan sa admin.
    </div>

    <!-- TAB 1: INCOME RECORDS -->
    <template v-if="activeTab === 'records'">
      <!-- Search / Filter -->
      <div class="filter-bar" v-if="records.length > 0">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Hanapin ayon sa pangalan ng magsasaka..."
            class="search-input"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Kinukuha ang mga talaan...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="records.length === 0 && currentUser?.barangay_id" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Wala pang naitatalang kita mula sa mga magsasaka sa iyong barangay.</p>
      </div>

      <!-- Records List -->
      <div v-else class="records-list">
        <div v-if="filteredRecords.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>Walang nahanap na talaan para sa "{{ searchQuery }}"</p>
        </div>
        <div
          v-for="record in filteredRecords"
          :key="record.id"
          class="record-card"
        >
          <div class="record-header">
            <div class="farmer-info">
              <span class="farmer-name">👨‍🌾 {{ record.farmer_name }}</span>
              <span class="record-date">📅 {{ formatDate(record.created_at) }}</span>
            </div>
            <div class="header-actions">
              <span class="status-badge" :class="'status-' + getStatusClass(record.status)">
                {{ record.status }}
              </span>
              <button class="view-btn" @click="openRecordDetail(record)">👁️ Tingnan</button>
            </div>
          </div>
          <div class="record-details">
            <div class="record-detail">
              <span class="detail-label">Lawak:</span>
              <span>{{ record.area_hectares }} ektarya</span>
            </div>
          </div>
          <div class="record-financials">
            <div class="financial-item income">
              <span>Benta:</span>
              <span>₱{{ parseFloat(record.gross_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="financial-item expense">
              <span>Gastos:</span>
              <span>₱{{ parseFloat(record.total_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="financial-item" :class="parseFloat(record.net_income || 0) >= 0 ? 'profit' : 'loss'">
              <span>Net:</span>
              <span>₱{{ parseFloat(record.net_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- VIEW DETAIL MODAL - RECORD -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title-with-status">
              <h2>📋 Buong Detalye ng Talaan</h2>
              <span class="modal-status-badge" :class="'status-' + getStatusClass(selectedRecord.status)">
                {{ selectedRecord.status }}
              </span>
            </div>
            <button class="modal-close" @click="closeDetailModal">&times;</button>
          </div>
          <div class="modal-body" v-if="selectedRecord">

            <!-- Farmer Name Banner -->
            <div class="farmer-banner">
              <span class="banner-icon">👨‍🌾</span>
              <span class="banner-name">{{ selectedRecord.farmer_name }}</span>
            </div>

            <!-- Farm Info -->
            <div class="detail-section">
              <h3 class="detail-section-title">🌱 Detalye ng Taniman</h3>
              <div class="detail-grid">
                <div class="detail-cell">
                  <span class="cell-label">Petsa ng Talaan</span>
                  <span class="cell-value">{{ formatDate(selectedRecord.created_at) }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Lawak (Ektarya)</span>
                  <span class="cell-value">{{ selectedRecord.area_hectares }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Paraan ng Pagtatanim</span>
                  <span class="cell-value">{{ selectedRecord.planting_method === 'sabog' ? 'Sabog' : 'Talok' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Patubig</span>
                  <span class="cell-value">{{ formatIrrigation(selectedRecord.irrigation_type) }}</span>
                </div>
              </div>
            </div>

            <!-- Fertilizers -->
            <div class="detail-section" v-if="selectedRecord.fertilizers && selectedRecord.fertilizers.length > 0">
              <h3 class="detail-section-title">🧪 Mga Ginamit na Abono</h3>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Klase</th>
                    <th>Sako</th>
                    <th>Presyo/Sako</th>
                    <th>Kabuuan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="f in selectedRecord.fertilizers" :key="f.id">
                    <td>{{ f.fertilizer_type }}</td>
                    <td>{{ f.sacks }}</td>
                    <td>₱{{ parseFloat(f.price_per_sack || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td class="amt">₱{{ parseFloat(f.line_total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="foot-label">Kabuuang Abono:</td>
                    <td class="foot-value">₱{{ parseFloat(selectedRecord.total_fertilizer_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="detail-section" v-else>
              <h3 class="detail-section-title">🧪 Mga Ginamit na Abono</h3>
              <p class="no-data">Walang naitalang abono.</p>
            </div>

            <!-- Pesticides -->
            <div class="detail-section" v-if="selectedRecord.pesticides && selectedRecord.pesticides.length > 0">
              <h3 class="detail-section-title">🧴 Mga Ginamit na Lason</h3>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Klase</th>
                    <th>Bilang</th>
                    <th>Presyo/Unit</th>
                    <th>Kabuuan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in selectedRecord.pesticides" :key="p.id">
                    <td>{{ p.pesticide_type }}</td>
                    <td>{{ p.quantity }}</td>
                    <td>₱{{ parseFloat(p.price_per_unit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td class="amt">₱{{ parseFloat(p.line_total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="foot-label">Kabuuang Lason:</td>
                    <td class="foot-value">₱{{ parseFloat(selectedRecord.total_pesticide_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="detail-section" v-else>
              <h3 class="detail-section-title">🧴 Mga Ginamit na Lason</h3>
              <p class="no-data">Walang naitalang lason.</p>
            </div>

            <!-- Labor & Expenses -->
            <div class="detail-section">
              <h3 class="detail-section-title">👷 Gastos sa Labor at Iba Pa</h3>
              <div class="expense-grid">
                <div class="expense-row">
                  <span>Paghahanda ng Lupa</span>
                  <span>₱{{ parseFloat(selectedRecord.land_preparation_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bunot / Talok / Hasik</span>
                  <span>₱{{ parseFloat(selectedRecord.planting_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Pagspray / Pagsabog ng Abono</span>
                  <span>₱{{ parseFloat(selectedRecord.spraying_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bayad sa Harvester</span>
                  <span>₱{{ parseFloat(selectedRecord.harvester_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bayad sa Pagbibilad</span>
                  <span>₱{{ parseFloat(selectedRecord.drying_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bayad sa Paghakot</span>
                  <span>₱{{ parseFloat(selectedRecord.hauling_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Tarasko</span>
                  <span>₱{{ parseFloat(selectedRecord.tarasko_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Krudo</span>
                  <span>₱{{ parseFloat(selectedRecord.fuel_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Iba Pang Gastos</span>
                  <span>₱{{ parseFloat(selectedRecord.other_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row total-row">
                  <span>Kabuuang Labor:</span>
                  <span>₱{{ parseFloat(selectedRecord.total_labor_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </div>

            <!-- Harvest -->
            <div class="detail-section">
              <h3 class="detail-section-title">🌾 Ani</h3>
              <div class="detail-grid">
                <div class="detail-cell">
                  <span class="cell-label">Sako na Naani</span>
                  <span class="cell-value">{{ selectedRecord.sacks_harvested }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Kilo Kada Sako</span>
                  <span class="cell-value">{{ selectedRecord.kg_per_sack }} kg</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Presyo Kada Kilo</span>
                  <span class="cell-value">₱{{ parseFloat(selectedRecord.price_per_kg || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Kabuuang Ani</span>
                  <span class="cell-value">{{ (parseFloat(selectedRecord.sacks_harvested || 0) * parseFloat(selectedRecord.kg_per_sack || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} kg</span>
                </div>
              </div>
            </div>

            <!-- Grand Summary -->
            <div class="detail-section summary-detail-section">
              <h3 class="detail-section-title">📊 Buod</h3>
              <div class="grand-summary">
                <div class="grand-row income-row">
                  <span>Kabuuang Benta</span>
                  <span>₱{{ parseFloat(selectedRecord.gross_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="grand-row expense-summary-row">
                  <span>Kabuuang Gastos</span>
                  <span>₱{{ parseFloat(selectedRecord.total_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="grand-row" :class="parseFloat(selectedRecord.net_income || 0) >= 0 ? 'net-profit-row' : 'net-loss-row'">
                  <span>Netong Kita</span>
                  <span>₱{{ parseFloat(selectedRecord.net_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn-close-modal" @click="closeDetailModal">Isara</button>
          </div>
        </div>
      </div>
    </Teleport>


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)

// Refs
const activeTab = ref('records')
const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(false)
const records = ref([])
const searchQuery = ref('')
const showDetailModal = ref(false)
const selectedRecord = ref(null)



// Filter
const filteredRecords = computed(() => {
  // Only show eligible records
  const eligible = records.value.filter(r => r.status === 'Eligible')
  if (!searchQuery.value.trim()) return eligible
  const q = searchQuery.value.toLowerCase()
  return eligible.filter(r =>
    (r.farmer_name || '').toLowerCase().includes(q)
  )
})



// Fetch records by barangay
const fetchRecords = async () => {
  if (!currentUser.value?.barangay_id) return
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch(`/api/farmer-income/by-barangay/${currentUser.value.barangay_id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
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



// Modal functions
const openRecordDetail = (record) => {
  selectedRecord.value = record
  showDetailModal.value = true
}
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedRecord.value = null
}



// Helper functions
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fil-PH', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

const formatIrrigation = (type) => {
  const map = {
    'NIA': 'NIA',
    'bugsok_waterpump': 'Bugsok na Waterpump',
    'waterpump_irrigation': 'Waterpump na Nakalawit sa Irrigation',
    'waterpump_ilog': 'Waterpump na Nakalawit sa Ilog'
  }
  return map[type] || type
}

const getStatusClass = (status) => {
  const map = {
    'Submitted': 'submitted',
    'Under Review': 'review',
    'Eligible': 'eligible',
    'Upcoming Assistance': 'upcoming',
    'Received': 'received'
  }
  return map[status] || 'default'
}



onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #166534;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

/* TAB NAVIGATION */
.tab-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.tab-btn:hover {
  color: #166534;
}

.tab-btn.active {
  color: #166534;
  border-bottom-color: #16a34a;
}

/* ALERTS */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.alert-warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.alert-success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.alert-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
}

/* SEARCH */
.filter-bar {
  margin-bottom: 1.25rem;
}

.search-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0 0.75rem;
  max-width: 400px;
}

.search-icon {
  font-size: 1rem;
  margin-right: 0.5rem;
}

.search-input {
  flex: 1;
  border: none;
  padding: 0.55rem 0;
  font-size: 0.9rem;
  outline: none;
  background: transparent;
}

/* LOADING / EMPTY */
.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

/* RECORDS LIST */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.record-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.2s;
}

.record-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.farmer-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.farmer-name {
  font-weight: 700;
  color: #166534;
  font-size: 1.1rem;
  letter-spacing: -0.3px;
}

.record-date {
  font-size: 0.85rem;
  color: #7b8295;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-submitted { background: #dbeafe; color: #0c4a6e; }
.status-review { background: #fef3c7; color: #92400e; }
.status-eligible { background: #dcfce7; color: #166534; }
.status-upcoming { background: #fbdba6; color: #92400e; }
.status-received { background: #c6f6d5; color: #22543d; }

.view-btn {
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #166534, #16a34a);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.view-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.3);
}

.record-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem 0;
}

.record-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.detail-label {
  color: #7b8295;
  font-weight: 600;
  min-width: 60px;
}

.record-financials {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.financial-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.financial-item > span:first-child {
  font-size: 0.8rem;
  font-weight: 500;
  color: #7b8295;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.financial-item > span:last-child {
  font-size: 1.1rem;
  font-weight: 700;
}

.financial-item.income > span:last-child { color: #2563eb; }
.financial-item.expense > span:last-child { color: #dc2626; }
.financial-item.profit > span:last-child { color: #16a34a; font-weight: 800; }
.financial-item.loss > span:last-child { color: #dc2626; }

@media (max-width: 768px) {
  .record-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .record-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .record-financials {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* DISTRIBUTIONS */
.distributions-container {
  padding: 1rem 0;
}

.distributions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.distributions-header h2 {
  margin: 0;
  color: #166534;
  font-size: 1.25rem;
}

.btn-add-distribution {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #166534, #16a34a);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-add-distribution:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.3);
}

.distributions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.distribution-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.dist-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.dist-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dist-farmer {
  font-weight: 700;
  color: #166534;
  font-size: 0.95rem;
}

.dist-type {
  font-size: 0.8rem;
  color: #6b7280;
}

.dist-status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.dist-status-pending { background: #dbeafe; color: #0c4a6e; }
.dist-status-ready { background: #fef3c7; color: #92400e; }
.dist-status-distributed { background: #fbdba6; color: #78350f; }
.dist-status-confirmed { background: #c6f6d5; color: #22543d; }

.dist-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.dist-detail {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.dist-detail .label {
  color: #6b7280;
  font-weight: 500;
}

.dist-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small, .btn-confirm {
  flex: 1;
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-small {
  background: #e5e7eb;
  color: #374151;
}

.btn-small:hover {
  background: #d1d5db;
}

.btn-confirm {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.btn-confirm:hover {
  background: #c6f6d5;
}

/* MODALS */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  max-height: 90vh;
  overflow-y: auto;
  max-width: 600px;
  width: 100%;
}

.modal-container.modal-lg {
  max-width: 700px;
}

.modal-container.modal-md {
  max-width: 500px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title-with-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.modal-header h2 {
  margin: 0;
  color: #166534;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-close-modal {
  padding: 0.5rem 1.5rem;
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-close-modal:hover {
  background: #d1d5db;
}

/* STATUS MANAGEMENT */
.status-management-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.section-title {
  margin: 0 0 1rem 0;
  color: #166534;
  font-size: 1rem;
  font-weight: 700;
}

.status-timeline {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
  overflow-x: auto;
}

.status-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 80px;
}

.status-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.2s;
}

.status-step.active .status-circle {
  background: #16a34a;
  color: white;
}

.status-step.completed .status-circle {
  background: #c6f6d5;
  color: #166534;
}

.status-label {
  font-size: 0.7rem;
  text-align: center;
  color: #6b7280;
  font-weight: 500;
}

.status-action {
  text-align: center;
}

.btn-update-status {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #166534, #16a34a);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-update-status:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(22, 101, 52, 0.3);
}

/* FORMS */
.farmer-banner {
  background: linear-gradient(135deg, #166534, #16a34a);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.banner-icon {
  font-size: 1.5rem;
}

.banner-name {
  font-weight: 700;
  font-size: 1.1rem;
}

.detail-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section-title {
  margin: 0 0 1rem 0;
  color: #166534;
  font-size: 1rem;
  font-weight: 700;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cell-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.cell-value {
  font-size: 0.95rem;
  color: #1f2937;
  font-weight: 600;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.detail-table th {
  background: #f3f4f6;
  padding: 0.5rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #d1d5db;
}

.detail-table td {
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-table td.amt {
  text-align: right;
  font-weight: 600;
}

.detail-table tfoot tr {
  background: #f9fafb;
}

.foot-label {
  text-align: right;
  font-weight: 600;
  color: #374151;
}

.foot-value {
  text-align: right;
  font-weight: 700;
  color: #166534;
}

.expense-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.expense-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.expense-row.total-row {
  font-weight: 700;
  color: #166534;
  border-top: 2px solid #16a34a;
  border-bottom: none;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

.summary-detail-section {
  background: #f0fdf4;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #86efac;
}

.grand-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.grand-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  font-weight: 600;
}

.income-row {
  color: #2563eb;
}

.expense-summary-row {
  color: #dc2626;
}

.net-profit-row {
  color: #16a34a;
  background: #dcfce7;
  padding: 0.75rem;
  border-radius: 6px;
}

.net-loss-row {
  color: #dc2626;
  background: #fee2e2;
  padding: 0.75rem;
  border-radius: 6px;
}

.no-data {
  color: #9ca3af;
  font-size: 0.9rem;
}

/* DISTRIBUTION FORM */
.distribution-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.form-group input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.btn-primary {
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #166534, #16a34a);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(22, 101, 52, 0.3);
}

.btn-cancel {
  padding: 0.5rem 1.5rem;
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #d1d5db;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .distributions-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .status-timeline {
    gap: 0.25rem;
  }

  .status-step {
    min-width: 60px;
  }

  .status-label {
    font-size: 0.65rem;
  }
}

/* Enhanced readability for embedded hub content */
.page-container {
  max-width: 100%;
  padding: 0;
  background: transparent;
}

.page-header {
  margin-bottom: 22px;
  padding: 18px 22px;
  background: linear-gradient(145deg, rgba(18, 43, 29, 0.94), rgba(13, 32, 23, 0.92));
  border: 1px solid rgba(126, 184, 145, 0.18);
  border-radius: 22px;
}

.page-title,
.distributions-header h2,
.section-title,
.detail-section-title,
.modal-header h2,
.farmer-name,
.dist-farmer {
  color: #86efac;
}

.page-subtitle,
.record-date,
.detail-label,
.cell-label,
.dist-type,
.dist-detail .label,
.no-data,
.loading-state,
.empty-state {
  color: rgba(220, 252, 231, 0.7);
}

.tab-navigation,
.filter-bar,
.status-management-section,
.summary-detail-section,
.distribution-card,
.record-card,
.modal-container,
.detail-section,
.empty-state {
  background: linear-gradient(145deg, rgba(20, 38, 28, 0.95), rgba(14, 29, 21, 0.93));
  border: 1px solid rgba(126, 184, 145, 0.18);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(6, 12, 9, 0.24);
}

.tab-navigation {
  padding: 10px 12px;
  border-bottom: none;
}

.tab-btn {
  padding: 0.9rem 1.4rem;
  background: rgba(148, 166, 158, 0.12);
  border: 1px solid rgba(126, 184, 145, 0.16);
  border-bottom: none;
  border-radius: 14px;
  color: rgba(220, 252, 231, 0.78);
}

.tab-btn.active {
  color: #f0fdf4;
  background: linear-gradient(145deg, rgba(28, 116, 68, 0.9), rgba(24, 84, 55, 0.9));
  border-bottom: none;
}

.search-box,
.form-group input,
.form-group select,
.form-group textarea {
  background: rgba(152, 174, 166, 0.16);
  border: 1px solid rgba(126, 184, 145, 0.18);
  color: #ecfdf5;
  border-radius: 14px;
}

.search-input,
.search-input::placeholder,
.form-group label,
.detail-cell,
.cell-value,
.detail-table td,
.record-detail,
.record-financials,
.expense-row,
.grand-row,
.modal-body,
.modal-footer {
  color: #ecfdf5;
}

.record-header,
.record-financials,
.dist-details,
.detail-section,
.modal-header,
.modal-footer,
.form-actions {
  border-color: rgba(126, 184, 145, 0.12);
}

.record-card:hover,
.distribution-card:hover {
  box-shadow: 0 16px 34px rgba(5, 10, 8, 0.32);
}

.detail-table th {
  background: rgba(148, 166, 158, 0.14);
  color: #d1fae5;
  border-bottom: 1px solid rgba(126, 184, 145, 0.18);
}

.detail-table tfoot tr,
.status-management-section {
  background: rgba(255, 255, 255, 0.03);
}

.status-circle {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(220, 252, 231, 0.74);
}

.status-step.completed .status-circle {
  background: rgba(74, 222, 128, 0.18);
  color: #86efac;
}

.btn-small,
.btn-close-modal,
.btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: #ecfdf5;
  border: 1px solid rgba(126, 184, 145, 0.16);
}

.btn-small:hover,
.btn-close-modal:hover,
.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.14);
}
</style>
