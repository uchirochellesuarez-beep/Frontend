<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ pageTitle }}</h1>
      <p class="page-subtitle">Apply for and manage your loan applications</p>
    </div>

    <!-- Loan Statistics -->
    <div class="stats-grid">
      <div class="stat-card pending">
        <div class="stat-content">
          <div class="stat-value">{{ pendingLoans.length }}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>
      <div class="stat-card approved">
        <div class="stat-content">
          <div class="stat-value">{{ approvedLoans.length }}</div>
          <div class="stat-label">Approved</div>
        </div>
      </div>
      <div class="stat-card active">
        <div class="stat-content">
          <div class="stat-value">{{ activeLoans.length }}</div>
          <div class="stat-label">Active</div>
        </div>
      </div>
      <div class="stat-card rejected">
        <div class="stat-content">
          <div class="stat-value">{{ rejectedLoans.length }}</div>
          <div class="stat-label">Rejected</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <!-- Loan Application Form -->
      <div class="card application-card">
        <h2 class="card-title">Apply for New Loan</h2>
        
        <!-- Eligibility Message -->
        <div v-if="eligibilityMessage" class="alert" :class="canApplyLoan ? 'alert-info' : 'alert-warning'">
          {{ eligibilityMessage }}
        </div>
        
        <form @submit.prevent="submitLoanApplication" class="loan-form" v-if="canApplyLoan">
          <div class="form-group">
            <label>Loan Type</label>
            <select v-model="loanForm.type" required @change="updateMaxAmount">
              <option value="">Select loan type</option>
              <option value="agricultural">Agricultural Loan (Max: ₱5,000)</option>
              <option value="provident">Provident Loan (Max: ₱3,000)</option>
              <option value="educational">Educational Loan (Max: ₱3,000)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Loan Amount (₱)</label>
            <input
              type="number"
              v-model="loanForm.amount"
              placeholder="Enter amount"
              required
              min="500"
              :max="maxLoanAmount"
              step="100"
            />
            <small v-if="loanForm.type" class="help-text">
              Maximum: ₱{{ maxLoanAmount.toLocaleString() }} | 
              Interest: 1% | 
              Payment Term: 6 months
            </small>
            <small v-if="loanForm.amount" class="calculation-text">
              Principal: ₱{{ parseFloat(loanForm.amount).toLocaleString() }} + 
              Interest (1%): ₱{{ (parseFloat(loanForm.amount) * 0.01).toLocaleString() }} = 
              Total: ₱{{ (parseFloat(loanForm.amount) * 1.01).toLocaleString() }}
            </small>
          </div>
          <div class="form-group">
            <label>Purpose (Optional)</label>
            <input
              type="text"
              v-model="loanForm.purpose"
              placeholder="Enter loan purpose"
              maxlength="200"
            />
          </div>
          <div class="loan-info-box">
            <h4>📋 Loan Terms & Conditions</h4>
            <ul>
              <li>Fixed interest rate: <strong>1%</strong></li>
              <li>Payment period: <strong>6 months</strong></li>
              <li>{{ approvalDescription }}</li>
              <li>You can only apply once every 6 months</li>
            </ul>
          </div>
          <button type="submit" class="submit-btn" :disabled="loading || !canApplyLoan">
            {{ loading ? 'Submitting...' : 'Submit Application' }}
          </button>
        </form>
      </div>

      <!-- My Loans Section with Tabs -->
      <div class="card loans-card">
        <h2 class="card-title">My Loan Applications</h2>
        
        <!-- Tabs -->
        <div class="tabs">
          <button
            :class="['tab', { active: activeTab === 'pending' }]"
            @click="activeTab = 'pending'"
          >
            Pending ({{ pendingLoans.length }})
          </button>
          <button
            :class="['tab', { active: activeTab === 'approved' }]"
            @click="activeTab = 'approved'"
          >
            Approved ({{ approvedLoans.length }})
          </button>
          <button
            :class="['tab', { active: activeTab === 'active' }]"
            @click="activeTab = 'active'"
          >
            Active ({{ activeLoans.length }})
          </button>
          <button
            :class="['tab', { active: activeTab === 'rejected' }]"
            @click="activeTab = 'rejected'"
          >
            Rejected ({{ rejectedLoans.length }})
          </button>
        </div>

        <!-- Loans List -->
        <div class="loans-list">
          <div v-if="filteredLoans.length === 0" class="empty-state">
            <p>No loans in this category</p>
          </div>

          <div
            v-for="loan in filteredLoans"
            :key="loan.id"
            :class="['loan-item', loan.status]"
            @click="selectLoan(loan)"
          >
            <div class="loan-header">
              <div class="loan-type">{{ formatLoanType(loan.loan_type) }}</div>
              <span :class="['status-badge', loan.status]">{{ loan.status }}</span>
            </div>
            <div class="loan-details">
              <span class="amount">₱{{ loan.loan_amount?.toLocaleString() }}</span>
              <span class="date">{{ formatDate(loan.application_date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loan Details Modal -->
    <div v-if="selectedLoan && !editingLoan" class="modal-overlay" @click.self="selectedLoan = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Loan Details</h3>
          <button @click="selectedLoan = null" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="details-grid">
            <div class="detail-item">
              <label>Loan Type</label>
              <p>{{ formatLoanType(selectedLoan.loan_type) }}</p>
            </div>
            <div class="detail-item">
              <label>Loan Amount</label>
              <p class="amount">₱{{ selectedLoan.loan_amount?.toLocaleString() }}</p>
            </div>
            <div class="detail-item">
              <label>Purpose</label>
              <p>{{ formatPurpose(selectedLoan.loan_purpose) }}</p>
            </div>
            <div class="detail-item">
              <label>Payment Term</label>
              <p>{{ selectedLoan.payment_term }} months</p>
            </div>
            <div class="detail-item">
              <label>Interest Rate</label>
              <p>{{ selectedLoan.interest_rate || 0 }}%</p>
            </div>
            <div class="detail-item">
              <label>Application Date</label>
              <p>{{ formatDate(selectedLoan.application_date) }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.approval_date">
              <label>Approval Date</label>
              <p>{{ formatDate(selectedLoan.approval_date) }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.due_date">
              <label>Due Date</label>
              <p>{{ formatDate(selectedLoan.due_date) }}</p>
            </div>
            <div class="detail-item">
              <label>Status</label>
              <p>
                <span :class="['status-badge', selectedLoan.status]">
                  {{ selectedLoan.status }}
                </span>
              </p>
            </div>
            <div class="detail-item" v-if="selectedLoan.approved_by_name">
              <label>Approved By</label>
              <p>{{ selectedLoan.approved_by_name }}</p>
            </div>
          </div>

          <!-- Payment History -->
          <div v-if="selectedLoan.payments && selectedLoan.payments.length > 0" class="payment-history">
            <h4>Payment History</h4>
            <div class="payments-table">
              <div class="table-header">
                <div class="col">Date</div>
                <div class="col">Amount</div>
                <div class="col">Reference</div>
                <div class="col">Method</div>
              </div>
              <div v-for="payment in selectedLoan.payments" :key="payment.id" class="table-row">
                <div class="col">{{ formatDate(payment.payment_date) }}</div>
                <div class="col amt">₱{{ payment.amount?.toLocaleString() }}</div>
                <div class="col">{{ payment.reference_number }}</div>
                <div class="col">{{ payment.payment_method }}</div>
              </div>
            </div>
          </div>

          <!-- Balance Info -->
          <div v-if="selectedLoan.status !== 'rejected'" class="balance-info">
            <p><strong>Total to Pay:</strong> ₱{{ selectedLoan.loan_amount?.toLocaleString() }}</p>
            <p><strong>Total Paid:</strong> ₱{{ (selectedLoan.total_paid || 0).toLocaleString() }}</p>
            <p><strong>Remaining Balance:</strong> ₱{{ (selectedLoan.remaining_balance || selectedLoan.loan_amount).toLocaleString() }}</p>
          </div>

          <div class="modal-actions">
            <button
              v-if="selectedLoan.status === 'pending'"
              @click="openEditModal"
              class="btn btn-primary"
            >
              Edit
            </button>
            <button
              v-if="selectedLoan.status === 'pending'"
              @click="deleteLoan(selectedLoan.id)"
              class="btn btn-danger"
              :disabled="loading"
            >
              {{ loading ? 'Deleting...' : 'Delete' }}
            </button>
            <button @click="selectedLoan = null" class="btn btn-cancel">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Loan Modal -->
    <div v-if="editingLoan" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>✏️ Edit Loan Application</h3>
          <button @click="closeEditModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateLoan" class="edit-loan-form">
            <div class="form-group">
              <label>Loan Type</label>
              <select v-model="editForm.type" required @change="updateEditMaxAmount">
                <option value="">Select loan type</option>
                <option value="agricultural">Agricultural Loan (Max: ₱5,000)</option>
                <option value="provident">Provident Loan (Max: ₱3,000)</option>
                <option value="educational">Educational Loan (Max: ₱3,000)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Loan Amount (₱)</label>
              <input
                type="number"
                v-model="editForm.amount"
                placeholder="Enter amount"
                required
                min="500"
                :max="editMaxAmount"
                step="100"
              />
              <small v-if="editForm.type" class="help-text">
                Maximum: ₱{{ editMaxAmount.toLocaleString() }} | 
                Interest: 1% | 
                Payment Term: 6 months
              </small>
              <small v-if="editForm.amount" class="calculation-text">
                Principal: ₱{{ parseFloat(editForm.amount).toLocaleString() }} + 
                Interest (1%): ₱{{ (parseFloat(editForm.amount) * 0.01).toLocaleString() }} = 
                Total: ₱{{ (parseFloat(editForm.amount) * 1.01).toLocaleString() }}
              </small>
            </div>
            <div class="form-group">
              <label>Purpose (Optional)</label>
              <input
                type="text"
                v-model="editForm.purpose"
                placeholder="Enter loan purpose"
                maxlength="200"
              />
            </div>
            <div class="modal-actions">
              <button type="button" @click="closeEditModal" class="cancel-btn">Cancel</button>
              <button type="submit" class="submit-btn" :disabled="loading">
                {{ loading ? 'Updating...' : 'Update Loan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const route = useRoute()

const LOAN_LIMITS = {
  agricultural: 5000,
  provident: 3000,
  educational: 3000
}

const loanForm = ref({
  type: '',
  amount: '',
  purpose: ''
})

const editForm = ref({
  id: null,
  type: '',
  amount: '',
  purpose: ''
})

const allLoans = ref([])
const selectedLoan = ref(null)
const editingLoan = ref(false)
const activeTab = ref('pending')
const loading = ref(false)
const eligibilityMessage = ref('')

const maxLoanAmount = computed(() => {
  return LOAN_LIMITS[loanForm.value.type] || 0
})

const editMaxAmount = computed(() => {
  return LOAN_LIMITS[editForm.value.type] || 0
})

const pendingLoans = computed(() => allLoans.value.filter(l => l.status === 'pending'))
const approvedLoans = computed(() => allLoans.value.filter(l => l.status === 'approved'))
const activeLoans = computed(() => allLoans.value.filter(l => l.status === 'active'))
const rejectedLoans = computed(() => allLoans.value.filter(l => l.status === 'rejected'))

const filteredLoans = computed(() => {
  switch(activeTab.value) {
    case 'pending': return pendingLoans.value
    case 'approved': return approvedLoans.value
    case 'active': return activeLoans.value
    case 'rejected': return rejectedLoans.value
    default: return allLoans.value
  }
})

const pageTitle = computed(() => {
  const role = authStore.currentUser?.role
  if (role === 'treasurer') return 'My Loans (Treasurer)'
  if (role === 'president') return 'My Loans'
  return 'My Loans'
})

const approvalDescription = computed(() => {
  const role = authStore.currentUser?.role
  if (role === 'treasurer') return 'Your loan will be reviewed by the President'
  if (role === 'president') return 'Your loan will be reviewed by the Treasurer'
  return 'Your loan will be reviewed'
})

const canApplyLoan = computed(() => {
  return eligibilityMessage.value === '' || eligibilityMessage.value.includes('eligible')
})

const loadLoans = async () => {
  loading.value = true
  try {
    const userId = authStore.currentUser?.id
    if (!userId) {
      console.error('No user ID found')
      return
    }

    const response = await fetch(`http://localhost:3000/api/loans?farmer_id=${userId}&deviceDate=${new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      allLoans.value = data.loans || []
      console.log('Loaded loans:', allLoans.value)
    }
  } catch (error) {
    console.error('Error loading loans:', error)
  } finally {
    loading.value = false
  }
}

const checkEligibility = async () => {
  try {
    const userId = authStore.currentUser?.id
    if (!userId) return

    const response = await fetch(`http://localhost:3000/api/loans/eligibility/${userId}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      eligibilityMessage.value = data.allowed 
        ? 'You are eligible to apply for a new loan' 
        : data.reason
    }
  } catch (error) {
    console.error('Error checking eligibility:', error)
  }
}

const submitLoanApplication = async () => {
  if (!authStore.currentUser || !authStore.currentUser.id) {
    alert('Please log in to apply for a loan')
    return
  }
  
  if (!loanForm.value.type) {
    alert('Please select a loan type')
    return
  }
  
  if (!loanForm.value.amount || parseFloat(loanForm.value.amount) <= 0) {
    alert('Please enter a valid loan amount')
    return
  }
  
  if (parseFloat(loanForm.value.amount) > maxLoanAmount.value) {
    alert(`Loan amount cannot exceed ₱${maxLoanAmount.value.toLocaleString()} for ${loanForm.value.type} loan`)
    return
  }
  
  loading.value = true
  try {
    const loanData = {
      farmer_id: authStore.currentUser.id,
      loan_amount: parseFloat(loanForm.value.amount),
      loan_type: loanForm.value.type,
      loan_purpose: loanForm.value.purpose || `${loanForm.value.type} loan`
    }
    
    console.log('Submitting loan application:', loanData)
    
    const response = await fetch('http://localhost:3000/api/loans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(loanData)
    })
    
    const result = await response.json()
    console.log('Loan application response:', result)
    
    if (response.ok) {
      const details = result.details
      alert(`Loan application submitted successfully!\n\nPrincipal: ₱${details.principal.toLocaleString()}\nInterest (1%): ₱${details.interest.toLocaleString()}\nTotal to Pay: ₱${details.total.toLocaleString()}\nPayment Term: ${details.payment_term} months\n\nPlease wait for approval by the ${approvalDescription.value.toLowerCase()}.`)
      loanForm.value = {
        type: '',
        amount: '',
        purpose: ''
      }
      activeTab.value = 'pending'
      await loadLoans()
      await checkEligibility()
    } else {
      alert(result.message || 'Failed to submit loan application')
    }
  } catch (error) {
    console.error('Error submitting loan:', error)
    alert('Failed to submit loan application: ' + error.message)
  } finally {
    loading.value = false
  }
}

const updateMaxAmount = () => {
  loanForm.value.amount = ''
}

const updateEditMaxAmount = () => {
  editForm.value.amount = ''
}

const selectLoan = (loan) => {
  selectedLoan.value = loan
  editingLoan.value = false
}

const openEditModal = () => {
  if (selectedLoan.value) {
    editForm.value = {
      id: selectedLoan.value.id,
      type: selectedLoan.value.loan_type,
      amount: selectedLoan.value.loan_amount,
      purpose: selectedLoan.value.loan_purpose
    }
    editingLoan.value = true
  }
}

const closeEditModal = () => {
  editingLoan.value = false
  editForm.value = { id: null, type: '', amount: '', purpose: '' }
}

const updateLoan = async () => {
  if (!editForm.value.type || !editForm.value.amount) {
    alert('Please fill in all required fields')
    return
  }
  
  loading.value = true
  try {
    const response = await fetch(`http://localhost:3000/api/loans/${editForm.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        loan_amount: parseFloat(editForm.value.amount),
        loan_type: editForm.value.type,
        loan_purpose: editForm.value.purpose
      })
    })
    
    const result = await response.json()
    if (response.ok) {
      alert('Loan updated successfully')
      closeEditModal()
      await loadLoans()
    } else {
      alert(result.message || 'Failed to update loan application')
    }
  } catch (error) {
    console.error('Error updating loan:', error)
    alert('Failed to update loan application: ' + error.message)
  } finally {
    loading.value = false
  }
}

const deleteLoan = async (loanId) => {
  if (!confirm('Are you sure you want to delete this loan application?')) {
    return
  }

  loading.value = true
  try {
    const response = await fetch(`http://localhost:3000/api/loans/${loanId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    const result = await response.json()
    if (response.ok) {
      alert('Loan application deleted successfully')
      selectedLoan.value = null
      await loadLoans()
    } else {
      alert(result.message || 'Failed to delete loan application')
    }
  } catch (error) {
    console.error('Error deleting loan:', error)
    alert('Failed to delete loan application: ' + error.message)
  } finally {
    loading.value = false
  }
}

const formatLoanType = (type) => {
  if (!type) return 'N/A'
  return type.charAt(0).toUpperCase() + type.slice(1) + ' Loan'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatPurpose = (purpose) => {
  if (!purpose) return 'N/A'
  return purpose
}

onMounted(() => {
  loadLoans()
  checkEligibility()
})
</script>

<style scoped>
/* Page Layout */
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 2rem;
  padding: 1.35rem 1.25rem;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(14, 56, 40, 0.9), rgba(18, 76, 53, 0.86));
  border: 1px solid rgba(134, 239, 172, 0.22);
  box-shadow: 0 12px 22px rgba(3, 14, 10, 0.22);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ecfdf5;
  margin: 0 0 0.5rem;
  line-height: 1.2;
}

.page-subtitle {
  color: rgba(220, 252, 231, 0.88);
  font-size: 1rem;
  margin: 0;
  line-height: 1.45;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(145deg, #0f2a1f, #123327);
  border-radius: 16px;
  padding: 1.2rem 1.3rem;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5rem;
  border-left: 4px solid #cbd5e1;
  min-height: 110px;
  transition: transform 180ms ease, box-shadow 200ms ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.12);
}

.stat-card.pending {
  border-left-color: #f59e0b;
}

.stat-card.approved {
  border-left-color: #10b981;
}

.stat-card.active {
  border-left-color: #3b82f6;
}

.stat-card.rejected {
  border-left-color: #ef4444;
}

.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.55rem;
  flex-shrink: 0;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.stat-card.pending .stat-icon {
  background: #fffbeb;
  border-color: #fde68a;
}

.stat-card.approved .stat-icon {
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.stat-card.active .stat-icon {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.stat-card.rejected .stat-icon {
  background: #fef2f2;
  border-color: #fecaca;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  align-items: center;
}

.stat-value {
  font-size: 2.15rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}

.stat-label {
  color: #dcfce7;
  font-size: 1rem;
  font-weight: 700;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

/* Card */
.card {
  background: linear-gradient(145deg, #102a1f, #153629);
  border-radius: 14px;
  padding: 1.6rem;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(167, 243, 208, 0.24);
  height: fit-content;
}

.loans-card {
  height: auto;
}

.card-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 1.5rem;
}

/* Loan Form */
.loan-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 700;
  color: #ecfdf5;
  font-size: 0.96rem;
}

.form-group input,
.form-group select {
  padding: 0.92rem 0.95rem;
  border: 1px solid rgba(167, 243, 208, 0.35);
  border-radius: 10px;
  font-size: 1.02rem;
  color: #ffffff;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.08);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: rgba(134, 239, 172, 0.85);
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.18);
}

.submit-btn {
  padding: 0.95rem 1.2rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #059669;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Help Text */
.help-text {
  display: block;
  margin-top: 0.5rem;
  color: #d1fae5;
  font-size: 0.92rem;
  font-weight: 600;
}

.calculation-text {
  display: block;
  margin-top: 0.5rem;
  color: #bbf7d0;
  font-size: 0.96rem;
  font-weight: 700;
}

/* Loan Info Box */
.loan-info-box {
  background-color: rgba(6, 78, 59, 0.34);
  border: 1px solid rgba(45, 212, 191, 0.45);
  border-radius: 12px;
  padding: 1.05rem 1.1rem;
  margin-bottom: 1rem;
}

.loan-info-box h4 {
  color: #ecfeff;
  font-size: 1.05rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
}

.loan-info-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.loan-info-box li {
  color: #e6fffa;
  font-size: 0.98rem;
  font-weight: 600;
  padding: 0.25rem 0;
}

/* Alert */
.alert {
  padding: 1rem 1.05rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  font-size: 0.98rem;
  font-weight: 700;
}

.alert-info {
  background: rgba(30, 64, 175, 0.28);
  border-left: 4px solid #60a5fa;
  color: #dbeafe;
}

.alert-warning {
  background: rgba(194, 65, 12, 0.26);
  border-left: 4px solid #fb923c;
  color: #ffedd5;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(134, 239, 172, 0.24);
  overflow-x: auto;
  padding-bottom: 0.45rem;
}

.tab {
  padding: 0.55rem 0.95rem;
  background: rgba(15, 37, 28, 0.72);
  border: 1px solid rgba(134, 239, 172, 0.24);
  border-radius: 999px;
  cursor: pointer;
  color: #dcfce7;
  font-weight: 700;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab:hover {
  background: rgba(22, 163, 74, 0.25);
  transform: translateY(-1px);
}

.tab.active {
  color: #052e16;
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  border-color: rgba(187, 247, 208, 0.9);
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.38);
}

/* Loans List */
.loans-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.loan-item {
  padding: 1rem 1.05rem;
  border: 1px solid rgba(167, 243, 208, 0.26);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(15, 42, 31, 0.9), rgba(16, 55, 39, 0.82));
  cursor: pointer;
  transition: all 0.2s;
}

.loan-item:hover {
  border-color: rgba(134, 239, 172, 0.5);
  box-shadow: 0 10px 16px rgba(3, 13, 9, 0.25);
}

.loan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.loan-type {
  font-weight: 600;
  color: #ecfdf5;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.active {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.paid {
  background: #d1fae5;
  color: #065f46;
}

.loan-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
}

.amount {
  font-weight: 800;
  color: #bbf7d0;
}

.date {
  color: #d1fae5;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #d1fae5;
  font-size: 0.98rem;
  font-weight: 600;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
}

.modal-body {
  padding: 1.5rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.detail-item label {
  display: block;
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.detail-item p {
  color: #1e293b;
  margin: 0;
  font-weight: 500;
}

.detail-item .amount {
  color: #10b981;
  font-weight: 700;
  font-size: 1.1rem;
}

/* Payment History */
.payment-history {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.payment-history h4 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1rem;
}

.payments-table {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr 1fr;
  background: #e2e8f0;
  padding: 0.75rem;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr 1fr;
  padding: 0.75rem;
  border-top: 1px solid #cbd5e1;
  font-size: 0.9rem;
  color: #475569;
}

.table-row .col.amt {
  color: #10b981;
  font-weight: 600;
}

/* Balance Info */
.balance-info {
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.balance-info p {
  margin: 0.5rem 0;
  color: #166534;
}

.balance-info p strong {
  color: #15803d;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #e2e8f0;
  color: #475569;
}

.btn-cancel:hover {
  background: #cbd5e1;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: #e2e8f0;
  color: #475569;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: #cbd5e1;
}

.edit-loan-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .card {
    height: auto;
  }

  .modal-actions {
    flex-wrap: wrap;
  }

  .btn {
    flex: 1;
  }

  .table-header,
  .table-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
