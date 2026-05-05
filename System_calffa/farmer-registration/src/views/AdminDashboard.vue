\\\\\\\\\\\\\<template>
  <div class="dashboard-container glass-module-page">
    <!-- Multi-layer background -->
    <div class="dashboard-bg-layer" aria-hidden="true"></div>
    <div class="dashboard-bg-orbs" aria-hidden="true"></div>

    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <!-- Glass header top bar -->
      <div class="header-top">
        <div class="header-left">
          <div class="header-eyebrow">CaLFFA Admin</div>
          <h1 class="dashboard-title">Dashboard</h1>
          <p class="dashboard-subtitle">Agricultural Intelligence &amp; Cooperative Operations</p>
        </div>
        <div class="header-time-card" aria-label="Current time and date">
          <div class="header-time-label">Live Time</div>
          <div class="header-time-value">{{ currentTime }}</div>
          <div class="header-time-day">Day: {{ currentDay }}</div>
          <div class="header-time-date">{{ currentDate }}</div>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="stats-overview">
        <!-- Total Farmers - Green -->
        <div class="stat-card stat-green">
          <div class="stat-icon-wrap stat-icon-green">
            <img src="https://cdn-icons-png.flaticon.com/512/7417/7417717.png" alt="Farmer" class="stat-icon-img" />
          </div>
          <div class="stat-body">
            <div class="stat-label">Total Farmers</div>
            <div class="stat-value">{{ animatedFarmers }}</div>
            <div class="stat-pill stat-pill-green">Active members</div>
          </div>
        </div>

        <!-- Barangays - Teal -->
        <div class="stat-card stat-teal">
          <div class="stat-icon-wrap stat-icon-teal">
            <span class="stat-emoji">📍</span>
          </div>
          <div class="stat-body">
            <div class="stat-label">Barangays</div>
            <div class="stat-value">{{ animatedBarangays }}</div>
            <div class="stat-pill stat-pill-teal">Covered areas</div>
          </div>
        </div>

        <template v-if="isAdmin">
          <!-- Pending Approvals - Yellow -->
          <div class="stat-card stat-yellow">
            <div class="stat-icon-wrap stat-icon-yellow">
              <img src="https://cdn-icons-png.freepik.com/512/13366/13366070.png" alt="Pending" class="stat-icon-img" />
            </div>
            <div class="stat-body">
              <div class="stat-label">Pending Approvals</div>
              <div class="stat-value">{{ animatedPending }}</div>
              <div class="stat-pill stat-pill-yellow">Needs review</div>
            </div>
          </div>

          <!-- Pending Loans - Red/Orange -->
          <div class="stat-card stat-red" @click="goToLoans" style="cursor: pointer;">
            <div class="stat-icon-wrap stat-icon-red">
              <img src="https://cdn-icons-png.flaticon.com/256/11254/11254160.png" alt="Pending Loans" class="stat-icon-img" />
            </div>
            <div class="stat-body">
              <div class="stat-label">Pending Loans</div>
              <div class="stat-value">{{ animatedLoans }}</div>
              <div class="stat-pill stat-pill-red">Awaiting action</div>
            </div>
            <div v-if="pendingLoansCount > 0" class="notification-badge">{{ pendingLoansCount }}</div>
          </div>
        </template>
      </div>
    </div>

    <!-- Analytics & Insights Section - Glassmorphism -->
    <div class="analytics-section">
      <div class="analytics-bg" aria-hidden="true"></div>

      <!-- Section Header -->
      <div class="analytics-header">
        <div class="analytics-title-block">
          <h2 class="analytics-section-title">Analytics &amp; Insights</h2>
          <p class="analytics-section-sub">Real-time cooperative data at a glance</p>
        </div>
        <button class="filter-toggle-btn" @click="filterPanelOpen = !filterPanelOpen" :class="{ active: filterPanelOpen }" aria-label="Toggle filters">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span>Filter</span>
          <span v-if="activeFiltersCount > 0" class="filter-badge">{{ activeFiltersCount }}</span>
        </button>
      </div>

      <!-- Filter Panel -->
      <transition name="filter-slide">
        <div v-if="filterPanelOpen" class="filter-panel">
          <div class="filter-panel-grid">
            <div class="filter-group">
              <label class="filter-label">Barangay</label>
              <select v-model="filterBarangay" class="filter-select">
                <option value="">All Barangays</option>
                <option v-for="b in barangayFilterOptions" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Status</label>
              <select v-model="filterStatus" class="filter-select">
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">From Date</label>
              <input v-model="filterDateFrom" type="date" class="filter-select" />
            </div>
            <div class="filter-group">
              <label class="filter-label">To Date</label>
              <input v-model="filterDateTo" type="date" class="filter-select" />
            </div>
          </div>
          <div class="filter-actions">
            <button class="filter-apply-btn" @click="applyFilters">Apply Filters</button>
            <button class="filter-reset-btn" @click="resetFilters">Reset</button>
          </div>
        </div>
      </transition>

      <!-- Glass Charts Grid -->
      <div class="glass-charts-grid">

        <!-- Members by Status -->
        <div class="glass-chart-card">
          <div class="glass-chart-header">
            <div>
              <h3 class="glass-chart-title">Members by Status</h3>
              <p class="glass-chart-sub">{{ filteredTotalCount }} Total Members</p>
            </div>
            <span class="glass-chart-badge">Status</span>
          </div>
          <div class="donut-wrap">
            <canvas ref="statusChartRef" class="donut-canvas"></canvas>
            <div class="donut-center-label">
              <span class="donut-center-num">{{ filteredTotalCount }}</span>
              <span class="donut-center-text">Total</span>
            </div>
          </div>
          <div class="glass-legend">
            <span class="gl-item"><span class="gl-dot" style="background:#4ade80"></span>Approved <strong>{{ filteredApprovedCount }}</strong></span>
            <span class="gl-item"><span class="gl-dot" style="background:#fbbf24"></span>Pending <strong>{{ filteredPendingCount }}</strong></span>
            <span class="gl-item"><span class="gl-dot" style="background:#f87171"></span>Rejected <strong>{{ filteredRejectedCount }}</strong></span>
          </div>
        </div>

        <!-- Top 10 Barangays -->
        <div class="glass-chart-card">
          <div class="glass-chart-header">
            <div>
              <h3 class="glass-chart-title">Top 10 Barangays</h3>
              <p class="glass-chart-sub">By Member Count</p>
            </div>
            <button class="sort-toggle-btn" @click="toggleBarangaySort" :title="barangaySortDesc ? 'Sort Ascending' : 'Sort Descending'">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path v-if="barangaySortDesc" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
                <path v-else d="M3 20h13M3 16h9m-9-4h9m5 4V4m0 0l-4 4m4-4l4 4"/>
              </svg>
              {{ barangaySortDesc ? 'Desc' : 'Asc' }}
            </button>
          </div>
          <canvas ref="barangayChartRef"></canvas>
        </div>

        <!-- Financial Overview -->
        <div class="glass-chart-card">
          <div class="glass-chart-header">
            <div>
              <h3 class="glass-chart-title">Financial Overview</h3>
              <p class="glass-chart-sub">{{ isAdmin ? 'All Members' : 'My Account' }}</p>
            </div>
            <span class="glass-chart-badge glass-chart-badge--finance">₱ Finance</span>
          </div>
          <canvas ref="financialChartRef"></canvas>
          <div class="glass-legend" style="margin-top:16px">
            <span class="gl-item"><span class="gl-dot" style="background:#60a5fa"></span>Contributions</span>
            <span class="gl-item"><span class="gl-dot" style="background:#fb923c"></span>Outstanding Loans</span>
          </div>
        </div>

      </div>
    </div>

    <div class="fab-wrap">
      <button class="fab-main" @click="toggleFab" aria-label="Quick actions">{{ fabOpen ? '×' : '+' }}</button>
      <div v-if="fabOpen" class="fab-actions">
        <button class="fab-action" @click="goToApprovals">Approve Members</button>
        <button class="fab-action" @click="goToMembers">Add/View Members</button>
        <button class="fab-action" @click="goToLogs">View Logs</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const router = useRouter()
const authStore = useAuthStore()

// State
const allFarmers = ref([])
const barangays = ref([])
const pendingLoans = ref([])
const allApprovedLoans = ref([])
const allActiveLoans = ref([])
const allContributions = ref([])
const loading = ref(false)
const systemActive = ref(true)
const currentTime = ref('')
const currentDay = ref('')
const currentDate = ref('')
const fabOpen = ref(false)

const animatedFarmers = ref(0)
const animatedBarangays = ref(0)
const animatedPending = ref(0)
const animatedLoans = ref(0)

// Farmer-specific financial data
const farmerContributions = ref(0)
const farmerLoans = ref(0)

// Chart refs
const statusChartRef = ref(null)
const barangayChartRef = ref(null)
const financialChartRef = ref(null)

let statusChart = null
let barangayChart = null
let financialChart = null

// Filter & Sort state
const filterPanelOpen = ref(false)
const filterBarangay = ref('')
const filterStatus = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const barangaySortDesc = ref(true)
// Applied filter values (committed on "Apply")
const appliedBarangay = ref('')
const appliedStatus = ref('')
const appliedDateFrom = ref('')
const appliedDateTo = ref('')

// Computed
const isAdmin = computed(() => authStore.currentUser?.role === 'admin')

// Filter computed
const barangayFilterOptions = computed(() => {
  return barangays.value.map(b => ({ id: b.id || b.barangay_id, name: b.name || b.barangay_name || b.barangay || String(b.id) }))
})

const activeFiltersCount = computed(() => {
  let n = 0
  if (appliedBarangay.value) n++
  if (appliedStatus.value) n++
  if (appliedDateFrom.value) n++
  if (appliedDateTo.value) n++
  return n
})

const filteredAnalyticsFarmers = computed(() => {
  let list = filteredFarmers.value.filter(f =>
    f.role === 'farmer' ||
    ['president', 'treasurer', 'auditor', 'operator', 'operation_manager', 'business_manager'].includes(f.role)
  )
  if (appliedBarangay.value) {
    list = list.filter(f => String(f.barangay_id) === String(appliedBarangay.value))
  }
  if (appliedStatus.value) {
    list = list.filter(f => (f.status || 'pending') === appliedStatus.value)
  }
  if (appliedDateFrom.value) {
    list = list.filter(f => f.created_at && f.created_at >= appliedDateFrom.value)
  }
  if (appliedDateTo.value) {
    list = list.filter(f => f.created_at && f.created_at <= appliedDateTo.value + 'T23:59:59')
  }
  return list
})

const filteredApprovedCount = computed(() =>
  filteredAnalyticsFarmers.value.filter(f => f.status === 'approved').length
)
const filteredPendingCount = computed(() =>
  filteredAnalyticsFarmers.value.filter(f => !f.status || f.status === 'pending').length
)
const filteredRejectedCount = computed(() =>
  filteredAnalyticsFarmers.value.filter(f => f.status === 'rejected').length
)
const filteredTotalCount = computed(() => filteredAnalyticsFarmers.value.length)
const userBarangayId = computed(() => authStore.currentUser?.barangay_id)
const userName = computed(() => authStore.currentUser?.full_name || 'Admin User')
const userId = computed(() => authStore.currentUser?.reference_number || 'CALFFA-ADMIN')

// Filter farmers based on user role (barangay restriction for non-admin)
const filteredFarmers = computed(() => {
  if (isAdmin.value) {
    return allFarmers.value
  }
  // Officers and farmers can only see their barangay members
  return allFarmers.value.filter(f => f.barangay_id === userBarangayId.value)
})

// Total farmers count = farmers + officers (excluding agriculturists)
// Based on barangay access control
const totalFarmersCount = computed(() => {
  return filteredFarmers.value.filter(f => 
    f.role === 'farmer' || (
      ['president', 'treasurer', 'auditor', 'operator', 'operation_manager', 'business_manager'].includes(f.role)
    )
  ).length
})

const totalFarmers = computed(() => filteredFarmers.value.length)
const farmersCount = computed(() => filteredFarmers.value.filter(f => f.role === 'farmer').length)
const barangaysCount = computed(() => {
  if (isAdmin.value) {
    return barangays.value.length
  }
  // Non-admin users only see their barangay
  return userBarangayId.value ? 1 : 0
})
const approvedCount = computed(() => filteredFarmers.value.filter(f => 
  (f.role === 'farmer' || ['president', 'treasurer', 'auditor', 'operator', 'operation_manager', 'business_manager'].includes(f.role)) && 
  f.status === 'approved'
).length)
const pendingCount = computed(() => filteredFarmers.value.filter(f => 
  (f.role === 'farmer' || ['president', 'treasurer', 'auditor', 'operator', 'operation_manager', 'business_manager'].includes(f.role)) && 
  (f.status === 'pending' || !f.status)
).length)
const rejectedCount = computed(() => filteredFarmers.value.filter(f => 
  (f.role === 'farmer' || ['president', 'treasurer', 'auditor', 'operator', 'operation_manager', 'business_manager'].includes(f.role)) && 
  f.status === 'rejected'
).length)

// Calculate total contributions from actual contribution records
const totalContributions = computed(() => {
  if (isAdmin.value) {
    return allContributions.value.reduce((sum, contrib) => sum + parseFloat(contrib.amount || 0), 0)
  }
  return farmerContributions.value
})

// Calculate loans from actual approved and active loans
const totalLoans = computed(() => {
  if (isAdmin.value) {
    // Approved loans: full loan amount
    const approvedTotal = allApprovedLoans.value.reduce(
      (sum, loan) => sum + parseFloat(loan.loan_amount || 0), 0
    )
    // Active (partial paid) loans: remaining balance only
    const activeTotal = allActiveLoans.value.reduce(
      (sum, loan) => sum + parseFloat(loan.remaining_balance || 0), 0
    )
    return approvedTotal + activeTotal
  }
  return farmerLoans.value
})

// Calculate actual expenses (disbursed loans minus payments received)
// Pending loans count
const pendingLoansCount = computed(() => pendingLoans.value.length)

// Methods
const loadAllFarmers = async () => {
  try {
    const response = await fetch('/api/farmers')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    allFarmers.value = data.farmers || data || []
  } catch (err) {
    console.error('Error loading farmers:', err)
  }
}

const loadBarangays = async () => {
  try {
    const response = await fetch('/api/barangays')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    barangays.value = data.barangays || []
  } catch (err) {
    console.error('Error loading barangays:', err)
  }
}

// Helper to get device date string for API calls
const getDeviceDate = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const loadPendingLoans = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/loans?status=pending&deviceDate=${getDeviceDate()}`)
    if (response.ok) {
      const data = await response.json()
      pendingLoans.value = data.loans || []
    }
  } catch (err) {
    console.error('Error loading pending loans:', err)
  }
}

const loadApprovedLoans = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/loans?status=approved&deviceDate=${getDeviceDate()}`)
    if (response.ok) {
      const data = await response.json()
      allApprovedLoans.value = data.loans || []
    }
  } catch (err) {
    console.error('Error loading approved loans:', err)
  }
}

const loadActiveLoans = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/loans?status=active&deviceDate=${getDeviceDate()}`)
    if (response.ok) {
      const data = await response.json()
      allActiveLoans.value = data.loans || []
    }
  } catch (err) {
    console.error('Error loading active loans:', err)
  }
}

const loadAllContributions = async () => {
  if (!isAdmin.value) return
  
  try {
    const response = await fetch('http://localhost:3000/api/contributions')
    if (response.ok) {
      const data = await response.json()
      allContributions.value = data.contributions || []
    }
  } catch (err) {
    console.error('Error loading contributions:', err)
  }
}

const loadFarmerFinancialData = async () => {
  if (isAdmin.value) return // Admin uses aggregated data
  
  try {
    const userId = authStore.currentUser?.id
    if (!userId) {
      console.warn('No user ID found for loading financial data')
      return
    }

    console.log('Loading financial data for farmer ID:', userId)

    // Load farmer's contributions
    const contribResponse = await fetch(`http://localhost:3000/api/contributions/farmer/${userId}`)
    console.log('Contributions response status:', contribResponse.status)
    
    if (contribResponse.ok) {
      const contribData = await contribResponse.json()
      console.log('Contributions data:', contribData)
      
      if (contribData.success && contribData.contributions) {
        farmerContributions.value = contribData.contributions.reduce(
          (sum, c) => sum + parseFloat(c.amount || 0), 0
        )
        console.log('Total contributions:', farmerContributions.value)
      }
    } else {
      console.error('Failed to load contributions:', await contribResponse.text())
    }

    // Load farmer's loans (using same endpoint as LoanPage)
    const loansResponse = await fetch(`http://localhost:3000/api/loans?farmer_id=${userId}&deviceDate=${getDeviceDate()}`)
    console.log('Loans response status:', loansResponse.status)
    
    if (loansResponse.ok) {
      const loansData = await loansResponse.json()
      console.log('Loans data:', loansData)
      
      if (loansData.success && loansData.loans) {
        const approvedLoans = loansData.loans.filter(l => 
          l.status === 'approved' || l.status === 'active' || l.status === 'paid'
        )
        console.log('Approved/Active/Paid loans:', approvedLoans)
        
        // Use loan_amount field (not amount)
        farmerLoans.value = approvedLoans.reduce(
          (sum, l) => sum + parseFloat(l.loan_amount || 0), 0
        )
        console.log('Total loans:', farmerLoans.value)
      }
    } else {
      console.error('Failed to load loans:', await loansResponse.text())
    }

    console.log('Final financial data:', {
      contributions: farmerContributions.value,
      loans: farmerLoans.value
    })
  } catch (err) {
    console.error('Error loading farmer financial data:', err)
  }
}

const goToLoans = () => {
  router.push('/admin-loans')
}

const goToApprovals = () => {
  router.push('/farmers-table')
  fabOpen.value = false
}

const goToMembers = () => {
  router.push('/farmers-table')
  fabOpen.value = false
}

const goToLogs = () => {
  router.push('/system-activity')
  fabOpen.value = false
}

const toggleFab = () => {
  fabOpen.value = !fabOpen.value
}

const toggleBarangaySort = () => {
  barangaySortDesc.value = !barangaySortDesc.value
  renderBarangayChart()
}

const applyFilters = () => {
  appliedBarangay.value = filterBarangay.value
  appliedStatus.value = filterStatus.value
  appliedDateFrom.value = filterDateFrom.value
  appliedDateTo.value = filterDateTo.value
  filterPanelOpen.value = false
  nextTick(() => renderCharts())
}

const resetFilters = () => {
  filterBarangay.value = ''
  filterStatus.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  appliedBarangay.value = ''
  appliedStatus.value = ''
  appliedDateFrom.value = ''
  appliedDateTo.value = ''
  filterPanelOpen.value = false
  nextTick(() => renderCharts())
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  currentDay.value = now.toLocaleDateString('en-US', {
    weekday: 'long'
  })
  currentDate.value = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const animateCounter = (targetRef, finalValue, duration = 900) => {
  const start = performance.now()
  const from = 0
  const to = Number(finalValue) || 0

  const step = (time) => {
    const progress = Math.min((time - start) / duration, 1)
    targetRef.value = Math.floor(from + (to - from) * (1 - Math.pow(1 - progress, 3)))
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

const animateOverviewCounters = () => {
  animateCounter(animatedFarmers, totalFarmersCount.value)
  animateCounter(animatedBarangays, barangaysCount.value)
  animateCounter(animatedPending, pendingCount.value)
  animateCounter(animatedLoans, pendingLoansCount.value)
}

const renderCharts = () => {
  renderStatusChart()
  renderBarangayChart()
  renderFinancialChart()
}

const renderStatusChart = () => {
  if (!statusChartRef.value) return
  if (statusChart) statusChart.destroy()

  const ctx = statusChartRef.value.getContext('2d')
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [{
        data: [filteredApprovedCount.value, filteredPendingCount.value, filteredRejectedCount.value],
        backgroundColor: ['#22c55e', '#facc15', '#fb7185'],
        hoverBackgroundColor: ['#16a34a', '#eab308', '#f43f5e'],
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.15)',
        hoverOffset: 10,
        spacing: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '68%',
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1400,
        easing: 'easeOutCubic'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.85)',
          padding: 12,
          titleFont: { size: 13, weight: '700', family: 'Inter, system-ui, sans-serif' },
          bodyFont: { size: 12, family: 'Inter, system-ui, sans-serif' },
          cornerRadius: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed} members`
          }
        }
      }
    }
  })
}

const buildBarangayGradient = (ctx, chartArea) => {
  if (!chartArea) return '#22c55e'
  const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0)
  gradient.addColorStop(0, '#16a34a')
  gradient.addColorStop(0.45, '#4ade80')
  gradient.addColorStop(0.78, '#facc15')
  gradient.addColorStop(1, '#eab308')
  return gradient
}

const renderBarangayChart = () => {
  if (!barangayChartRef.value) return
  if (barangayChart) barangayChart.destroy()

  const barangayCounts = {}
  filteredAnalyticsFarmers.value.forEach(farmer => {
    const barangay = farmer.barangay_id || farmer.address || 'Unknown'
    barangayCounts[barangay] = (barangayCounts[barangay] || 0) + 1
  })

  if (appliedBarangay.value) {
    // When filtered to one barangay, also show all other barangays from full set for context
  }

  const sorted = Object.entries(barangayCounts)
    .sort((a, b) => barangaySortDesc.value ? b[1] - a[1] : a[1] - b[1])
    .slice(0, 10)

  const labels = sorted.map(([id]) => {
    const found = barangays.value.find(b => String(b.id || b.barangay_id) === String(id))
    return found ? (found.name || found.barangay_name || found.barangay || id) : id
  })

  const ctx = barangayChartRef.value.getContext('2d')
  let gradientColor = null

  barangayChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Members',
        data: sorted.map(([, count]) => count),
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx: c, chartArea } = chart
          if (!chartArea) return '#4ade80'
          if (!gradientColor) gradientColor = buildBarangayGradient(c, chartArea)
          return gradientColor
        },
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.72
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 1100,
        easing: 'easeOutQuart',
        onProgress: () => { gradientColor = null }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.85)',
          padding: 12,
          titleFont: { size: 13, weight: '700', family: 'Inter, system-ui, sans-serif' },
          bodyFont: { size: 12, family: 'Inter, system-ui, sans-serif' },
          cornerRadius: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} members`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: 'rgba(240, 253, 244, 0.9)',
            font: { size: 10, family: 'Inter, system-ui, sans-serif', weight: '600' },
            maxRotation: 35
          },
          border: { color: 'rgba(233, 250, 222, 0.22)' }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(220, 252, 231, 0.12)', lineWidth: 1 },
          ticks: {
            stepSize: 1,
            color: 'rgba(240, 253, 244, 0.9)',
            font: { size: 11, family: 'Inter, system-ui, sans-serif' }
          },
          border: { color: 'rgba(233, 250, 222, 0.22)' }
        }
      }
    }
  })
}

const renderFinancialChart = () => {
  if (!financialChartRef.value) return
  if (financialChart) financialChart.destroy()

  const ctx = financialChartRef.value.getContext('2d')
  const contributions = totalContributions.value
  const loans = totalLoans.value

  // Build per-bar gradients (vertical)
  const makeVertGradient = (c, top, bottom) => {
    const height = ctx.canvas.height
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, top)
    grad.addColorStop(1, bottom)
    return grad
  }

  const greenGrad = makeVertGradient(ctx, '#d9f99d', '#15803d')
  const goldGrad = makeVertGradient(ctx, '#fef9c3', '#ca8a04')

  const maxVal = Math.max(contributions, loans, 6000)

  financialChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Contributions', 'Outstanding Loans'],
      datasets: [{
        label: 'Amount (₱)',
        data: [contributions, loans],
        backgroundColor: [greenGrad, goldGrad],
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.55
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 1300,
        easing: 'easeOutQuart',
        from: 0
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.85)',
          padding: 12,
          titleFont: { size: 13, weight: '700', family: 'Inter, system-ui, sans-serif' },
          bodyFont: { size: 12, family: 'Inter, system-ui, sans-serif' },
          cornerRadius: 10,
          callbacks: {
            label: (context) => ` ₱${context.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: 'rgba(240, 253, 244, 0.9)',
            font: { size: 12, family: 'Inter, system-ui, sans-serif', weight: '700' }
          },
          border: { color: 'rgba(233, 250, 222, 0.22)' }
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxVal,
          grid: { color: 'rgba(220, 252, 231, 0.12)', lineWidth: 1 },
          ticks: {
            color: 'rgba(240, 253, 244, 0.9)',
            font: { size: 11, family: 'Inter, system-ui, sans-serif' },
            callback: (value) => '₱' + Number(value).toLocaleString()
          },
          border: { color: 'rgba(233, 250, 222, 0.22)' }
        }
      }
    }
  })
}

// Lifecycle
onMounted(async () => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }

  loading.value = true
  
  // Load data in parallel
  await Promise.all([
    loadAllFarmers(),
    loadBarangays(),
    loadPendingLoans(),
    loadApprovedLoans(),
    loadActiveLoans(),
    loadAllContributions()
  ])
  
  // Load farmer-specific data if not admin
  if (!isAdmin.value) {
    await loadFarmerFinancialData()
  }
  
  loading.value = false

  animateOverviewCounters()
  updateTime()

  await nextTick()
  renderCharts()

  const timer = setInterval(updateTime, 1000)
  onUnmounted(() => {
    clearInterval(timer)
  })
})
</script>

<style scoped>
/* =============================================
   DASHBOARD CONTAINER — Sunset → Green Canvas
   ============================================= */
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(145deg,
    #0f1712 0%,
    #132119 22%,
    #1a2b20 45%,
    #243b2c 72%,
    #2f4a38 100%);
  padding: 28px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* Ambient background layers */
.dashboard-bg-layer {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 10% 90%, rgba(17, 94, 41, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 90% 10%, rgba(234, 179, 8, 0.08) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.dashboard-bg-orbs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.dashboard-bg-orbs::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(250,204,21,0.12) 0%, transparent 70%);
  top: -120px;
  right: -100px;
  animation: orb-drift 20s ease-in-out infinite alternate;
}
.dashboard-bg-orbs::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%);
  bottom: -100px;
  left: -80px;
  animation: orb-drift 25s ease-in-out infinite alternate-reverse;
}

@keyframes orb-drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, 20px) scale(1.08); }
}

/* =============================================
   DASHBOARD HEADER — Frosted Glass Panel
   ============================================= */
.dashboard-header {
  position: relative;
  z-index: 1;
  background: #1d2b21;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 32px 36px;
  box-shadow:
    16px 16px 30px rgba(8, 14, 10, 0.55),
    -14px -14px 28px rgba(42, 61, 46, 0.5),
    inset -1px -1px 0 rgba(0, 0, 0, 0.35);
  margin-bottom: 28px;
  animation: slideDown 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-22px); }
  to   { opacity: 1; transform: translateY(0); }
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  padding-bottom: 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left { flex: 1; }

.header-time-card {
  min-width: 180px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #25382b;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow:
    10px 10px 18px rgba(8, 14, 10, 0.58),
    -8px -8px 16px rgba(44, 63, 48, 0.5),
    inset -1px -1px 0 rgba(0, 0, 0, 0.34);
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
}

.header-time-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.9px;
  text-transform: uppercase;
  color: rgba(220, 238, 211, 0.66);
}

.header-time-value {
  font-size: 24px;
  line-height: 1;
  font-weight: 800;
  color: #f5ffe9;
  letter-spacing: 0.2px;
}

.header-time-date {
  font-size: 11px;
  font-weight: 600;
  color: rgba(220, 238, 211, 0.78);
}

.header-time-day {
  font-size: 11px;
  font-weight: 700;
  color: rgba(220, 238, 211, 0.86);
}

.header-eyebrow {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.4px;
  color: rgba(220, 238, 211, 0.72);
  margin-bottom: 6px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.dashboard-title {
  font-size: 38px;
  font-weight: 900;
  color: #eefde6;
  margin: 0 0 8px 0;
  letter-spacing: -0.8px;
  line-height: 1.05;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.18);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.dashboard-subtitle {
  font-size: 14px;
  color: rgba(220, 238, 211, 0.75);
  margin: 0;
  font-weight: 500;
  letter-spacing: 0.2px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

/* =============================================
   STATS OVERVIEW — Frosted Glass Cards
   ============================================= */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 18px;
  animation: fadeIn 0.6s ease-out 0.1s backwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Base glass card */
.stat-card {
  position: relative;
  background: #202f24;
  border-radius: 18px;
  padding: 20px 22px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    12px 12px 22px rgba(8, 13, 10, 0.5),
    -10px -10px 20px rgba(44, 63, 48, 0.48),
    inset -1px -1px 0 rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

/* Shimmer sweep on hover */
.stat-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: transparent;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.stat-card:hover {
  transform: translateY(-7px) scale(1.015);
  box-shadow:
    16px 16px 28px rgba(7, 12, 9, 0.58),
    -12px -12px 22px rgba(45, 66, 50, 0.56),
    inset -1px -1px 0 rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
  background: #223427;
}

.stat-card:hover::after { opacity: 1; }

/* ---- Color accent stripe (left border) ---- */
.stat-green  { border-left: 3px solid #4ade80; }
.stat-teal   { border-left: 3px solid #2dd4bf; }
.stat-yellow { border-left: 3px solid #fbbf24; }
.stat-red    { border-left: 3px solid #f87171; }

/* ---- Icon Wrap ---- */
.stat-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.stat-emoji {
  font-size: 26px;
  line-height: 1;
  filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));
}

.stat-icon-img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35)) brightness(1.05);
}

.stat-icon-green  { background: linear-gradient(135deg, rgba(74,222,128,0.35) 0%, rgba(22,163,74,0.45) 100%); box-shadow: 0 4px 14px rgba(74,222,128,0.28); }
.stat-icon-teal   { background: linear-gradient(135deg, rgba(45,212,191,0.35) 0%, rgba(13,148,136,0.45) 100%); box-shadow: 0 4px 14px rgba(45,212,191,0.28); }
.stat-icon-yellow { background: linear-gradient(135deg, rgba(251,191,36,0.35) 0%, rgba(217,119,6,0.45) 100%); box-shadow: 0 4px 14px rgba(251,191,36,0.28); }
.stat-icon-red    { background: linear-gradient(135deg, rgba(248,113,113,0.35) 0%, rgba(220,38,38,0.45) 100%); box-shadow: 0 4px 14px rgba(248,113,113,0.28); }

/* ---- Text body ---- */
.stat-body { flex: 1; min-width: 0; }

.stat-label {
  font-size: 10.5px;
  color: rgba(220, 238, 211, 0.7);
  margin-bottom: 4px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.stat-value {
  font-size: 32px;
  font-weight: 900;
  color: #f2ffe8;
  line-height: 1;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.15);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  margin-bottom: 6px;
}

/* Sub-pill tag */
.stat-pill {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  letter-spacing: 0.4px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  text-transform: uppercase;
}

.stat-pill-green  { background: rgba(74,222,128,0.22);  color: #bbf7d0; border: 1px solid rgba(74,222,128,0.35); }
.stat-pill-teal   { background: rgba(45,212,191,0.22);  color: #99f6e4; border: 1px solid rgba(45,212,191,0.35); }
.stat-pill-yellow { background: rgba(251,191,36,0.22);  color: #fef08a; border: 1px solid rgba(251,191,36,0.35); }
.stat-pill-red    { background: rgba(248,113,113,0.22); color: #fecaca; border: 1px solid rgba(248,113,113,0.35); }

/* Notification badge */
.notification-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ef4444;
  color: #fff;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  box-shadow: 0 2px 8px rgba(239,68,68,0.5);
  animation: pulse 2s ease-in-out infinite;
  border: 2px solid rgba(255,255,255,0.3);
}

@keyframes pulse {
  0%, 100% { transform: scale(1);    box-shadow: 0 2px 8px rgba(239,68,68,0.5); }
  50%       { transform: scale(1.12); box-shadow: 0 4px 14px rgba(239,68,68,0.7); }
}

/* =============================
   Analytics & Insights – Glassmorphism
   ============================= */
.analytics-section {
  position: relative;
  margin-bottom: 32px;
  border-radius: 24px;
  overflow: hidden;
  padding: 36px 32px 32px;
  /* Sunset-orange → soft-green gradient backdrop */
  background: linear-gradient(135deg, #17231b 0%, #1f3125 28%, #294032 58%, #345343 100%);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
  animation: fadeIn 0.7s ease-out 0.15s backwards;
}

/* Frosted farm-imagery blur overlay */
.analytics-bg {
  position: absolute;
  inset: 0;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Cellipse cx='120' cy='340' rx='180' ry='80' fill='%2316a34a' fill-opacity='.18'/%3E%3Cellipse cx='480' cy='60' rx='140' ry='60' fill='%23ea580c' fill-opacity='.15'/%3E%3Cellipse cx='300' cy='200' rx='260' ry='100' fill='%2386efac' fill-opacity='.10'/%3E%3C/svg%3E") center/cover no-repeat;
  backdrop-filter: blur(2px);
  pointer-events: none;
  z-index: 0;
}

.analytics-section > *:not(.analytics-bg) {
  position: relative;
  z-index: 1;
}

/* Section Header */
.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.analytics-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.analytics-section-title {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  margin: 0;
  letter-spacing: -0.4px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.18);
}

.analytics-section-sub {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255,255,255,0.82);
  margin: 0;
}

/* Filter Toggle Button */
.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255,255,255,0.35);
  border-radius: 30px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
  position: relative;
  white-space: nowrap;
}

.filter-toggle-btn:hover,
.filter-toggle-btn.active {
  background: rgba(255,255,255,0.28);
  border-color: rgba(255,255,255,0.55);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.16);
}

.filter-badge {
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  margin-left: 2px;
  box-shadow: 0 2px 6px rgba(239,68,68,0.4);
}

/* Filter Panel */
.filter-panel {
  background: #1f3024;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow:
    12px 12px 22px rgba(8, 13, 10, 0.52),
    -10px -10px 20px rgba(43, 62, 47, 0.5),
    inset -1px -1px 0 rgba(0, 0, 0, 0.36);
}

.filter-panel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(220, 238, 211, 0.82);
}

.filter-select {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #111111;
  font-size: 13px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  font-weight: 600;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.2s;
  box-shadow: inset 2px 2px 4px rgba(0,0,0,0.06), inset -2px -2px 4px rgba(255,255,255,0.8);
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: none;
}

.filter-select:focus {
  border-color: #7f9d81;
}

.filter-select option {
  background: #ffffff;
  color: #111111;
}

.filter-select::-webkit-calendar-picker-indicator,
.filter-select::-webkit-clear-button,
.filter-select::-webkit-inner-spin-button,
.filter-select::-webkit-dropdown-arrow {
  display: none !important;
  -webkit-appearance: none;
}

.filter-select option {
  background: #ffffff;
  color: #111111;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.filter-apply-btn {
  padding: 8px 20px;
  background: #ffffff;
  color: #111111;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.filter-apply-btn:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}

.filter-reset-btn {
  padding: 8px 20px;
  background: #f8fafc;
  color: #111111;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-reset-btn:hover {
  background: #2d4333;
  border-color: rgba(255,255,255,0.2);
}

/* Filter slide transition */
.filter-slide-enter-active,
.filter-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.filter-slide-enter-from,
.filter-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Glass Charts Grid */
.glass-charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 28px;
  animation: fadeIn 0.6s ease-out 0.2s backwards;
}

/* Glass Chart Card */
.glass-chart-card {
  background: #1f3024;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 24px 24px 20px;
  box-shadow:
    14px 14px 26px rgba(8, 13, 10, 0.55),
    -12px -12px 24px rgba(43, 62, 47, 0.52),
    inset -1px -1px 0 rgba(0,0,0,0.36);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.glass-chart-card:hover {
  transform: translateY(-6px);
  box-shadow:
    18px 18px 32px rgba(7, 12, 9, 0.6),
    -14px -14px 26px rgba(46, 66, 50, 0.58),
    inset -1px -1px 0 rgba(0,0,0,0.42);
  border-color: rgba(255,255,255,0.1);
  background: #23362a;
}

.glass-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  gap: 8px;
}

.glass-chart-title {
  font-size: 16px;
  font-weight: 800;
  color: #ecfbe2;
  margin: 0 0 3px;
  letter-spacing: -0.2px;
  text-shadow: 0 1px 6px rgba(0,0,0,0.12);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.glass-chart-sub {
  font-size: 12px;
  font-weight: 500;
  color: rgba(236, 252, 231, 0.88);
  margin: 0;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.glass-chart-badge {
  background: rgba(255,255,255,0.22);
  color: #ecfbe2;
  padding: 5px 13px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  border: 1px solid rgba(255,255,255,0.28);
  white-space: nowrap;
  flex-shrink: 0;
}

.glass-chart-badge--finance {
  background: rgba(251,191,36,0.28);
  border-color: rgba(251,191,36,0.4);
  color: #fef9c3;
}

/* Sort Button */
.sort-toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 13px;
  background: rgba(255,255,255,0.18);
  border: 1.5px solid rgba(255,255,255,0.3);
  border-radius: 20px;
  color: #ecfbe2;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.sort-toggle-btn:hover {
  background: rgba(255,255,255,0.28);
  border-color: rgba(255,255,255,0.5);
  transform: translateY(-1px);
}

/* Donut Center Label */
.donut-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 14px;
}

.donut-canvas {
  max-height: 240px;
}

.donut-center-label {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.donut-center-num {
  font-size: 28px;
  font-weight: 900;
  color: #ecfbe2;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0,0,0,0.18);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.donut-center-text {
  font-size: 11px;
  font-weight: 600;
  color: rgba(220, 238, 211, 0.72);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  margin-top: 2px;
}

/* Legend */
.glass-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.gl-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #eaf9e0;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
}

.gl-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(255,255,255,0.3);
}

canvas {
  max-height: 260px;
}

/* FAB Button */
.fab-wrap {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 100;
}

.fab-main {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #53b476 0%, #2f8f53 100%);
  color: white;
  border: none;
  font-size: 28px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(47, 143, 83, 0.35);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-main:hover {
  transform: scale(1.12) translateY(-4px);
  box-shadow: 0 12px 32px rgba(47, 143, 83, 0.5);
}

.fab-main:active {
  transform: scale(1.08);
}

.fab-actions {
  position: absolute;
  bottom: 80px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideUp 0.3s ease-out;
}

.fab-action {
  background: #273a2d;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 12px 18px;
  color: #eaf9e0;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow:
    10px 10px 18px rgba(7, 12, 9, 0.55),
    -8px -8px 16px rgba(43, 62, 47, 0.5),
    inset 1px 1px 0 rgba(255,255,255,0.08),
    inset -1px -1px 0 rgba(0,0,0,0.34);
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.fab-action:hover {
  background: #2d4333;
  border-color: rgba(255,255,255,0.2);
  transform: translateX(-6px);
  box-shadow:
    12px 12px 22px rgba(7, 12, 9, 0.62),
    -10px -10px 20px rgba(47, 68, 51, 0.56),
    inset 1px 1px 0 rgba(255,255,255,0.12),
    inset -1px -1px 0 rgba(0,0,0,0.4);
}

/* Quick Actions */
.quick-actions-section {
  margin-bottom: 28px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  background: #24372a;
  border-radius: 14px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 12px 12px 22px rgba(8, 13, 10, 0.58), -10px -10px 20px rgba(45, 65, 49, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 4px solid transparent;
}

.action-card:hover {
  transform: translateY(-6px);
  box-shadow: 16px 16px 28px rgba(7, 12, 9, 0.64), -12px -12px 24px rgba(47, 68, 51, 0.58);
  border-color: rgba(255, 255, 255, 0.16);
}

.action-icon {
  font-size: 36px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.4);
}

.action-primary {
  border-left-color: #2f8f53;
}

.action-primary .action-icon {
  background: linear-gradient(135deg, #53b476 0%, #2f8f53 100%);
}

.action-success {
  border-left-color: #10b981;
}

.action-success .action-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.action-warning {
  border-left-color: #f59e0b;
}

.action-warning .action-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.action-info {
  border-left-color: #3b82f6;
}

.action-info .action-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.action-danger {
  border-left-color: #ef4444;
}

.action-danger .action-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.action-secondary {
  border-left-color: #6b7280;
}

.action-secondary .action-icon {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-text {
  font-size: 16px;
  font-weight: 800;
  color: #ecfbe2;
  letter-spacing: -0.2px;
}

.action-desc {
  font-size: 13px;
  color: rgba(220, 238, 211, 0.72);
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .dashboard-header {
    padding: 22px 20px;
    border-radius: 18px;
  }

  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 20px;
    padding-bottom: 16px;
  }

  .header-time-card {
    width: 100%;
    align-items: flex-start;
  }

  .dashboard-title {
    font-size: 28px;
  }

  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-value {
    font-size: 26px;
  }

  .glass-charts-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .glass-chart-card {
    padding: 20px;
  }

  .analytics-section {
    padding: 24px 18px 20px;
    border-radius: 18px;
  }

  .analytics-section-title {
    font-size: 22px;
  }

  .filter-panel-grid {
    grid-template-columns: 1fr 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-title {
    font-size: 28px;
  }

  .dashboard-subtitle {
    font-size: 14px;
  }

  .section-title {
    font-size: 20px;
  }

  .fab-wrap {
    bottom: 20px;
    right: 20px;
  }

  .fab-main {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: 16px;
  }

  .dashboard-header {
    padding: 20px;
  }

  .stats-overview {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .stat-card {
    padding: 18px 20px;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    font-size: 32px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-value {
    font-size: 24px;
  }

  .chart-card {
    padding: 16px;
  }

  .dashboard-title {
    font-size: 22px;
  }

  .section-title {
    font-size: 18px;
  }

  .action-card {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .action-icon {
    width: 48px;
    height: 48px;
    font-size: 28px;
  }

  .fab-wrap {
    bottom: 16px;
    right: 16px;
  }
}
</style>
