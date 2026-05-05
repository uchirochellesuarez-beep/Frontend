<template>
  <div class="page-container glass-module-page">
    <div class="page-header">
      <h1 class="page-title">Share Capital</h1>
      <p class="page-subtitle">
        ₱50 every 6 months (₱100/year) • Barangay-based visibility
      </p>
    </div>

    <div v-if="!isAllowedRole" class="card">
      <div class="empty-state">
        <div class="empty-title">Access limited</div>
        <div class="empty-text">This module is available to Farmers, Treasurers, and Presidents.</div>
      </div>
    </div>

    <div v-else>
      <div v-if="error" class="card error-card">
        <div class="error-title">⚠️ Error Loading Share Capital</div>
        <div class="error-text">{{ error }}</div>
        <div v-if="error.includes('tables not found')" class="error-hint">
          <strong>Fix needed:</strong> Run the database migration by opening a terminal and executing:
          <div class="code-block">mysql -u root -p calffa < backend/migrations/create_share_capital_module.sql</div>
          Then restart the backend server. See SHARE_CAPITAL_SETUP.md for details.
        </div>
      </div>

      <div v-if="isAdmin" class="card">
        <div class="empty-state">
          <div class="empty-title">Barangay-based module</div>
          <div class="empty-text">Login as a barangay Treasurer/President or as a Farmer to use Share Capital.</div>
        </div>
      </div>

      <!-- Farmer view -->
      <div v-else-if="isFarmer">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Shares Contributed</div>
            <div class="stat-value">₱{{ meTotals.total_contributed.toLocaleString() }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Withdrawn</div>
            <div class="stat-value">₱{{ meTotals.total_withdrawn.toLocaleString() }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Current Total Balance</div>
            <div class="stat-value">₱{{ meTotals.balance.toLocaleString() }}</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Payment History</h2>
              <button class="btn" @click="loadMe" :disabled="loading">Refresh</button>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="3">Loading...</td>
                  </tr>
                  <tr v-else-if="meContributions.length === 0">
                    <td colspan="3">No contributions recorded</td>
                  </tr>
                  <tr v-else v-for="c in meContributions" :key="c.id">
                    <td>{{ formatDate(c.contribution_date) }}</td>
                    <td class="amount">₱{{ formatMoney(c.amount) }}</td>
                    <td>
                      <span class="badge" :class="c.status === 'confirmed' ? 'badge-success' : 'badge-muted'">{{ c.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Withdrawals</h2>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="3">Loading...</td>
                  </tr>
                  <tr v-else-if="meWithdrawals.length === 0">
                    <td colspan="3">No withdrawals</td>
                  </tr>
                  <tr v-else v-for="w in meWithdrawals" :key="w.id">
                    <td>{{ formatDate(w.withdrawal_date) }}</td>
                    <td class="amount">₱{{ formatMoney(w.amount) }}</td>
                    <td>{{ w.remarks || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Treasurer/President view -->
      <div v-else>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Farmers</div>
            <div class="stat-value">{{ overviewTotals.total_farmers.toLocaleString() }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Shares Collected</div>
            <div class="stat-value">₱{{ overviewTotals.total_collected.toLocaleString() }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Withdrawn</div>
            <div class="stat-value">₱{{ overviewTotals.total_withdrawn.toLocaleString() }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Balance</div>
            <div class="stat-value">₱{{ overviewTotals.total_balance.toLocaleString() }}</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Farmers (Your Barangay)</h2>
              <button class="btn" @click="loadOverview" :disabled="loading">Refresh</button>
            </div>
            
            <!-- Filter Input -->
            <div class="filter-section">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by reference number or farmer name..."
                class="input filter-input"
              />
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref No.</th>
                    <th>Farmer</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Balance</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="6">Loading...</td>
                  </tr>
                  <tr v-else-if="farmers.length === 0">
                    <td colspan="6">No farmers found for your barangay</td>
                  </tr>
                  <tr v-else-if="filteredFarmers.length === 0">
                    <td colspan="6">No farmers match the search criteria</td>
                  </tr>
                  <tr
                    v-else
                    v-for="f in filteredFarmers"
                    :key="f.id"
                    :class="{ selected: selectedFarmer?.id === f.id }"
                    @click="selectFarmer(f)"
                  >
                    <td>{{ f.reference_number || '—' }}</td>
                    <td class="name">{{ f.full_name }}</td>
                    <td>
                      <span class="badge" :class="String(f.status).toLowerCase() === 'inactive' ? 'badge-muted' : 'badge-success'">{{ f.status || 'approved' }}</span>
                    </td>
                    <td class="amount">₱{{ formatMoney(f.total_contributed) }}</td>
                    <td class="amount">₱{{ formatMoney(f.balance) }}</td>
                    <td class="actions" @click.stop>
                      <button class="btn btn-small" @click="selectFarmer(f)">View</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Farmer Shares</h2>
            </div>

            <div v-if="!selectedFarmer" class="empty-state">
              <div class="empty-title">Select a farmer</div>
              <div class="empty-text">Choose a farmer from the list to view share capital records.</div>
            </div>

            <div v-else>
              <div class="farmer-summary">
                <div class="farmer-name">{{ selectedFarmer.full_name }}</div>
                <div class="farmer-meta">Ref: {{ selectedFarmer.reference_number || '—' }}</div>
              </div>

              <div class="stats-grid compact">
                <div class="stat-card">
                  <div class="stat-label">Total Contributed</div>
                  <div class="stat-value">₱{{ selectedTotals.total_contributed.toLocaleString() }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Total Withdrawn</div>
                  <div class="stat-value">₱{{ selectedTotals.total_withdrawn.toLocaleString() }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">Balance</div>
                  <div class="stat-value">₱{{ selectedTotals.balance.toLocaleString() }}</div>
                </div>
              </div>

              <!-- Treasurer actions -->
              <div v-if="canEdit" class="action-row">
                <div class="form-inline">
                  <label class="inline-label">Contribution Date</label>
                  <input class="input" type="date" v-model="newContributionDate" />
                  <label class="inline-label">Amount</label>
                  <input class="input" type="number" :value="50" disabled />
                  <button class="btn" @click="recordContribution" :disabled="loading">Record</button>
                </div>

                <button class="btn btn-danger" @click="processWithdrawal" :disabled="loading || selectedTotals.balance <= 0">
                  Withdraw / Exit
                </button>
              </div>

              <div class="section-title">Contributions</div>
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th v-if="canEdit"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loadingFarmer">
                      <td colspan="4">Loading...</td>
                    </tr>
                    <tr v-else-if="selectedContributions.length === 0">
                      <td colspan="4">No contributions recorded</td>
                    </tr>
                    <tr v-else v-for="c in selectedContributions" :key="c.id">
                      <td>
                        <template v-if="editingId === c.id">
                          <input class="input" type="date" v-model="editDate" />
                        </template>
                        <template v-else>
                          {{ formatDate(c.contribution_date) }}
                        </template>
                      </td>
                      <td class="amount">₱{{ formatMoney(c.amount) }}</td>
                      <td>
                        <template v-if="editingId === c.id">
                          <select class="input" v-model="editStatus">
                            <option value="confirmed">confirmed</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </template>
                        <template v-else>
                          <span class="badge" :class="c.status === 'confirmed' ? 'badge-success' : 'badge-muted'">{{ c.status }}</span>
                        </template>
                      </td>
                      <td v-if="canEdit" class="actions">
                        <template v-if="editingId === c.id">
                          <button class="btn btn-small" @click="saveEdit(c.id)" :disabled="loading">Save</button>
                          <button class="btn btn-small btn-muted" @click="cancelEdit" :disabled="loading">Cancel</button>
                        </template>
                        <template v-else>
                          <button class="btn btn-small" @click="startEdit(c)">Edit</button>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="section-title">Withdrawals</div>
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="loadingFarmer">
                      <td colspan="3">Loading...</td>
                    </tr>
                    <tr v-else-if="selectedWithdrawals.length === 0">
                      <td colspan="3">No withdrawals</td>
                    </tr>
                    <tr v-else v-for="w in selectedWithdrawals" :key="w.id">
                      <td>{{ formatDate(w.withdrawal_date) }}</td>
                      <td class="amount">₱{{ formatMoney(w.amount) }}</td>
                      <td>{{ w.remarks || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

const role = computed(() => authStore.currentUser?.role)
const isAdmin = computed(() => role.value === 'admin')
const isFarmer = computed(() => role.value === 'farmer')
const isTreasurer = computed(() => role.value === 'treasurer')
const isPresident = computed(() => role.value === 'president')
const isAllowedRole = computed(() => ['admin', 'farmer', 'treasurer', 'president'].includes(role.value))
const canEdit = computed(() => isTreasurer.value || isAdmin.value)

const filteredFarmers = computed(() => {
  if (!searchQuery.value.trim()) return farmers.value
  
  const query = searchQuery.value.toLowerCase()
  return farmers.value.filter(f => 
    (f.reference_number && f.reference_number.toLowerCase().includes(query)) ||
    (f.full_name && f.full_name.toLowerCase().includes(query))
  )
})

const loading = ref(false)
const loadingFarmer = ref(false)
const error = ref('')

const farmers = ref([])
const overviewTotals = ref({ total_farmers: 0, total_collected: 0, total_withdrawn: 0, total_balance: 0 })
const selectedFarmer = ref(null)
const selectedContributions = ref([])
const selectedWithdrawals = ref([])
const selectedTotals = ref({ total_contributed: 0, total_withdrawn: 0, balance: 0 })

const meContributions = ref([])
const meWithdrawals = ref([])
const meTotals = ref({ total_contributed: 0, total_withdrawn: 0, balance: 0 })

const newContributionDate = ref(todayISO())

const editingId = ref(null)
const editDate = ref('')
const editStatus = ref('confirmed')
const searchQuery = ref('')

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatMoney(value) {
  const n = parseFloat(value || 0)
  return Number.isFinite(n) ? n.toLocaleString() : '0'
}

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
    'Authorization': `Bearer ${authStore.token}`
  }
  const response = await fetch(path, { ...options, headers })
  if (response.status === 401) {
    error.value = 'Session expired. Please login again.'
    throw new Error('Unauthorized')
  }
  return response
}

async function loadOverview() {
  if (!(isTreasurer.value || isPresident.value || isAdmin.value)) return

  error.value = ''
  loading.value = true
  try {
    const res = await apiFetch('/api/share-capital/overview')
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Failed to load overview')
    }
    farmers.value = data.farmers || []
    overviewTotals.value = data.totals || overviewTotals.value

    // Keep selection valid
    if (selectedFarmer.value) {
      const stillThere = farmers.value.find(f => f.id === selectedFarmer.value.id)
      if (stillThere) {
        selectedFarmer.value = stillThere
      }
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadFarmerDetails(farmerId) {
  error.value = ''
  loadingFarmer.value = true
  try {
    const res = await apiFetch(`/api/share-capital/farmer/${farmerId}`)
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Failed to load farmer records')
    }
    selectedTotals.value = data.totals || selectedTotals.value
    selectedContributions.value = data.contributions || []
    selectedWithdrawals.value = data.withdrawals || []
  } catch (e) {
    error.value = e.message
  } finally {
    loadingFarmer.value = false
  }
}

async function selectFarmer(f) {
  selectedFarmer.value = f
  editingId.value = null
  await loadFarmerDetails(f.id)
}

async function recordContribution() {
  if (!selectedFarmer.value) return
  if (!newContributionDate.value) {
    alert('Please select a contribution date')
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch('/api/share-capital/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_id: selectedFarmer.value.id,
        contribution_date: newContributionDate.value,
        amount: 50
      })
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Failed to record contribution')
    }
    await loadFarmerDetails(selectedFarmer.value.id)
    await loadOverview()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function startEdit(c) {
  editingId.value = c.id
  editDate.value = String(c.contribution_date || '').slice(0, 10)
  editStatus.value = c.status || 'confirmed'
}

function cancelEdit() {
  editingId.value = null
  editDate.value = ''
  editStatus.value = 'confirmed'
}

async function saveEdit(id) {
  if (!editDate.value) {
    alert('Please select a date')
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch(`/api/share-capital/contributions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contribution_date: editDate.value,
        amount: 50,
        status: editStatus.value
      })
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Failed to update contribution')
    }
    cancelEdit()
    if (selectedFarmer.value) {
      await loadFarmerDetails(selectedFarmer.value.id)
      await loadOverview()
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function processWithdrawal() {
  if (!selectedFarmer.value) return

  const ok = confirm(
    `Process withdrawal for ${selectedFarmer.value.full_name}?\n\nThis will withdraw the remaining balance and mark the farmer as inactive.`
  )
  if (!ok) return

  const remarks = prompt('Remarks (optional):')

  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch('/api/share-capital/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmer_id: selectedFarmer.value.id,
        withdrawal_date: todayISO(),
        remarks: remarks || null
      })
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Failed to process withdrawal')
    }
    await loadFarmerDetails(selectedFarmer.value.id)
    await loadOverview()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadMe() {
  error.value = ''
  loading.value = true
  try {
    const res = await apiFetch('/api/share-capital/me')
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Failed to load share capital data')
    }
    meTotals.value = data.totals || meTotals.value
    meContributions.value = data.contributions || []
    meWithdrawals.value = data.withdrawals || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!authStore.token) return
  if (isFarmer.value) {
    await loadMe()
  } else if (isTreasurer.value || isPresident.value) {
    await loadOverview()
  }
})
</script>

<style scoped>
/* ============================================
   PAGE — Dark Green Glassmorphic Theme
   ============================================ */
.page-container {
  --green: #34d399;
  --teal: #2dd4bf;
  --lime: #a3e635;
  --yellow: #86efac;
  --red: #f87171;
  --text-main: #eefde6;
  --text-muted: rgba(220, 238, 211, 0.78);
  --text-soft: rgba(220, 238, 211, 0.55);
  --glass-bg: rgba(28, 42, 33, 0.90);
  --glass-line: rgba(190, 235, 203, 0.13);

  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 28px;
  background: linear-gradient(145deg, #0f1712 0%, #132119 22%, #1a2b20 45%, #243b2c 72%, #2f4a38 100%);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: var(--text-main);
  position: relative;
  isolation: isolate;
}

.page-container::before {
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

/* ============================================
   PAGE HEADER
   ============================================ */
.page-header {
  background: rgba(25, 38, 29, 0.92);
  border: 1px solid var(--glass-line);
  border-radius: 20px;
  padding: 32px 38px;
  margin-bottom: 24px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.35), inset 1px 1px 0 rgba(255,255,255,0.06);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 220px; height: 220px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.13) 0%, transparent 65%);
  pointer-events: none;
}

.page-title {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  color: var(--text-main);
}

.page-subtitle {
  margin: 6px 0 0 0;
  color: var(--text-muted);
  font-size: 17px;
}

/* ============================================
   CARDS
   ============================================ */
.card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-line);
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.28), inset 1px 1px 0 rgba(255,255,255,0.05);
  padding: 18px;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #b6f7cb;
}

/* ============================================
   ERROR CARD
   ============================================ */
.error-card {
  border-color: rgba(248, 113, 113, 0.30);
  background: linear-gradient(145deg, rgba(248,113,113,0.08), var(--glass-bg));
}

.error-title {
  font-weight: 700;
  color: var(--red);
  margin-bottom: 6px;
}

.error-text { color: var(--text-muted); }

.error-hint {
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(74, 222, 128, 0.07);
  border: 1px solid rgba(74, 222, 128, 0.18);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.code-block {
  margin-top: 6px;
  padding: 8px 10px;
  background: rgba(0,0,0,0.25);
  border: 1px solid var(--glass-line);
  border-radius: 6px;
  font-family: Consolas, monospace;
  font-size: 12px;
  overflow-x: auto;
  color: var(--green);
}

/* ============================================
   STATS GRID
   ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.stats-grid.compact {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  margin: 12px 0;
}

.stat-card {
  background: rgba(28, 42, 33, 0.90);
  border: 1px solid var(--glass-line);
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.24), inset 1px 1px 0 rgba(255,255,255,0.05);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-label {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 22px;
  font-weight: 900;
  color: var(--green);
  margin-top: 6px;
  font-family: monospace;
}

/* ============================================
   GRID LAYOUT
   ============================================ */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

@media (max-width: 1024px) {
  .grid-2 { grid-template-columns: 1fr; }
}

/* ============================================
   FILTER SECTION
   ============================================ */
.filter-section {
  padding: 14px 16px;
  border-bottom: 1px solid var(--glass-line);
  background: rgba(255,255,255,0.025);
  border-radius: 10px 10px 0 0;
}

.filter-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--glass-line);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(0,0,0,0.25);
  color: var(--text-main);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.filter-input:focus {
  outline: none;
  border-color: rgba(74, 222, 128, 0.45);
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.10);
}

.filter-input::placeholder { color: var(--text-soft); }

/* ============================================
   TABLE
   ============================================ */
.table-container {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.18) 0%, rgba(45, 212, 191, 0.10) 100%);
}

.data-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 800;
  color: #b6f7cb;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 1px solid rgba(190, 235, 203, 0.15);
}

.data-table td {
  padding: 11px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 13px;
  color: var(--text-main);
}

.data-table tbody tr:nth-child(even) td {
  background: rgba(255,255,255,0.025);
}

.data-table tbody tr:hover td {
  background: rgba(74, 222, 128, 0.07);
}

.data-table tr.selected td {
  background: rgba(74, 222, 128, 0.10);
}

/* ============================================
   BADGES
   ============================================ */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  border: 1px solid rgba(255,255,255,0.12);
}

.badge-success {
  color: var(--green);
  background: rgba(74, 222, 128, 0.12);
  border-color: rgba(74, 222, 128, 0.28);
}

.badge-muted {
  color: var(--text-muted);
  background: rgba(255,255,255,0.06);
}

/* ============================================
   BUTTONS
   ============================================ */
.btn {
  border: 1px solid var(--glass-line);
  background: rgba(255,255,255,0.07);
  color: var(--text-main);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.2s ease;
}

.btn:hover { background: rgba(255,255,255,0.12); }

.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-small { padding: 5px 9px; border-radius: 8px; font-size: 12px; }

.btn-muted { color: var(--text-muted); }

.btn-danger {
  border-color: rgba(248, 113, 113, 0.35);
  color: var(--red);
}

.btn-danger:hover { background: rgba(248, 113, 113, 0.10); }

/* ============================================
   EMPTY / ACCESS STATES
   ============================================ */
.empty-state { padding: 18px 10px; }

.empty-title { font-weight: 800; color: var(--text-main); }

.empty-text { margin-top: 6px; color: var(--text-muted); font-size: 14px; }

/* ============================================
   FARMER DETAILS
   ============================================ */
.farmer-summary { margin-bottom: 10px; }

.farmer-name { font-weight: 900; color: var(--text-main); }

.farmer-meta { margin-top: 4px; color: var(--text-muted); font-size: 13px; }

/* ============================================
   SECTION TITLE / FORMS
   ============================================ */
.section-title {
  margin: 12px 0 8px 0;
  font-size: 12px;
  font-weight: 900;
  color: #b6f7cb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin: 12px 0;
}

.form-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.inline-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 800;
}

.input {
  padding: 8px 10px;
  border-radius: 9px;
  border: 1px solid var(--glass-line);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-main);
  font-size: 13px;
}

.input:focus {
  outline: none;
  border-color: rgba(74, 222, 128, 0.45);
}

.amount { font-weight: 700; color: #4ade80; font-family: monospace; }

.name { font-weight: 700; }

.actions { white-space: nowrap; }
</style>
