<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ pageTitle }}</h1>
      <p class="page-subtitle">{{ pageSubtitle }}</p>
    </div>

    <!-- Loan Statistics -->
    <div class="stats-grid">
      <div class="stat-card pending">
        <div class="stat-icon">
          <img :src="pendingApplicationsIcon" alt="" class="stat-icon-image" aria-hidden="true" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">Pending Applications</div>
        </div>
      </div>
      <div class="stat-card approved">
        <div class="stat-icon">
          <img :src="approvedLoansIcon" alt="" class="stat-icon-image" aria-hidden="true" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.approved }}</div>
          <div class="stat-label">Approved Loans</div>
        </div>
      </div>
      <div class="stat-card active">
        <div class="stat-icon">
          <img :src="partialPaidIcon" alt="" class="stat-icon-image" aria-hidden="true" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.active }}</div>
          <div class="stat-label">Partial Paid</div>
        </div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white;">
        <div class="stat-icon">
          <img :src="overdueLoansIcon" alt="" class="stat-icon-image" aria-hidden="true" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.overdue }}</div>
          <div class="stat-label">Overdue Loans</div>
        </div>
      </div>
      <div class="stat-card paid">
        <div class="stat-icon">
          <img :src="fullPaidIcon" alt="" class="stat-icon-image" aria-hidden="true" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.paid }}</div>
          <div class="stat-label">Full Paid</div>
        </div>
      </div>
      <div class="stat-card rejected">
        <div class="stat-icon">
          <img :src="rejectedApplicationsIcon" alt="" class="stat-icon-image" aria-hidden="true" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.rejected }}</div>
          <div class="stat-label">Rejected Applications</div>
        </div>
      </div>
      <div class="stat-card total">
        <div class="stat-icon">
          <img :src="totalLoanAmountIcon" alt="" class="stat-icon-image" aria-hidden="true" />
        </div>
        <div class="stat-content">
          <div class="stat-value">₱{{ stats.totalAmount.toLocaleString() }}</div>
          <div class="stat-label">Total Loan Amount</div>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button
        :class="['tab', { active: activeTab === 'pending' }]"
        @click="activeTab = 'pending'"
      >
        Pending ({{ stats.pending }})
      </button>
      <button
        :class="['tab', { active: activeTab === 'approved' }]"
        @click="activeTab = 'approved'"
      >
        Approved ({{ stats.approved }})
      </button>
      <button
        :class="['tab', { active: activeTab === 'active' }]"
        @click="activeTab = 'active'"
      >
        Partial Paid ({{ stats.active }})
      </button>
      <button
        :class="['tab', { active: activeTab === 'overdue' }]"
        @click="activeTab = 'overdue'"
      >
        ⚠️ Overdue ({{ stats.overdue }})
      </button>
      <button
        :class="['tab', { active: activeTab === 'paid' }]"
        @click="activeTab = 'paid'"
      >
        Full Paid ({{ stats.paid }})
      </button>
      <button
        :class="['tab', { active: activeTab === 'rejected' }]"
        @click="activeTab = 'rejected'"
      >
        Rejected ({{ stats.rejected }})
      </button>
      <button
        :class="['tab', { active: activeTab === 'all' }]"
        @click="activeTab = 'all'"
      >
        All Loans
      </button>
    </div>

    <!-- Loans Table -->
    <div class="card">
      <div class="table-container">
        <table class="loans-table">
          <colgroup>
            <col class="col-name" />
            <col class="col-amount" />
            <col class="col-purpose" />
            <col class="col-payer" />
            <col class="col-date" />
            <col class="col-date" />
            <col class="col-date" />
            <col class="col-term" />
            <col class="col-status" />
            <col class="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th class="th-name">Farmer Name</th>
              <th class="th-amount">Amount</th>
              <th class="th-purpose">Purpose</th>
              <th class="th-payer">Payer Status</th>
              <th class="th-date">Application Date</th>
              <th class="th-date">Approved Date</th>
              <th class="th-date">Last Payment Date</th>
              <th class="th-term">Payment Term</th>
              <th class="th-status">Status</th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" class="loading-cell">Loading loans...</td>
            </tr>
            <tr v-else-if="filteredLoans.length === 0">
              <td colspan="10" class="empty-cell">No loans found</td>
            </tr>
            <tr v-else v-for="loan in filteredLoans" :key="loan.id" :data-loan-id="loan.id" :class="{ 'notification-highlight-row': highlightedLoanId == loan.id }">
              <td class="td-name">{{ loan.full_name }}</td>
              <td class="td-amount amount">
                ₱{{ (loan.status === 'active' ? (loan.remaining_balance || 0) : loan.loan_amount).toLocaleString() }}
              </td>
              <td class="td-purpose">{{ formatPurpose(loan.loan_purpose) }}</td>
              <td class="td-payer">
                <div v-if="getPayerAssessment(loan.farmer_id)" class="payer-cell">
                  <div :class="['payer-badge', getPayerAssessment(loan.farmer_id).assessment.riskLevel.toLowerCase()]">
                    <span class="payer-icon">{{ getPayerAssessmentIcon(getPayerAssessment(loan.farmer_id).assessment.classification) }}</span>
                    <span class="payer-text">{{ formatPayerStatus(getPayerAssessment(loan.farmer_id).assessment.classification) }}</span>
                  </div>
                  <div class="payer-reason">
                    <span class="credit-score">Credit Score: <strong>{{ getPayerAssessment(loan.farmer_id).assessment.creditScore }}/100</strong></span>
                    <div class="score-factors">
                      <span title="Payment History (40% weight)">{{ getPayerAssessment(loan.farmer_id).scoreComponents.paymentHistoryScore }}%</span>
                      <span title="Default History (30% weight)">{{ getPayerAssessment(loan.farmer_id).scoreComponents.defaultHistoryScore }}%</span>
                      <span title="Loan Volume (15% weight)">{{ getPayerAssessment(loan.farmer_id).scoreComponents.loanVolumeScore }}%</span>
                      <span title="Activity Recency (15% weight)">{{ getPayerAssessment(loan.farmer_id).scoreComponents.activityRecencyScore }}%</span>
                    </div>
                    <span class="payer-desc">{{ getPayerAssessment(loan.farmer_id).assessment.description }}</span>
                  </div>
                </div>
                <div v-else class="payer-badge loading">
                  <span>⏳ Loading...</span>
                </div>
              </td>
              <td class="td-date">{{ formatDate(loan.application_date) }}</td>
              <td class="td-date">{{ formatDate(loan.approval_date) }}</td>
              <td class="td-date">{{ formatDate(loan.last_payment_date) }}</td>
              <td class="td-term">{{ loan.payment_term }} months</td>
              <td class="td-status">
                <span :class="['status-badge', loan.status]">
                  {{ loan.status }}
                </span>
              </td>
              <td class="td-actions">
                <div class="action-buttons">
                  <button
                    v-if="loan.status === 'pending'"
                    @click="openApproveModal(loan)"
                    class="btn btn-approve"
                    title="Approve Loan"
                  >
                    ✓ Approve
                  </button>
                  <button
                    v-if="loan.status === 'pending'"
                    @click="openRejectModal(loan)"
                    class="btn btn-reject"
                    title="Reject Loan"
                  >
                    ✗ Reject
                  </button>
                  <button
                    v-if="(loan.status === 'approved' || loan.status === 'active') && canRecordPayment(loan)"
                    @click="openPaymentModal(loan)"
                    class="btn btn-payment"
                    title="Record Payment"
                  >
                    💵 Record Payment
                  </button>
                  <button
                    v-else-if="loan.status === 'approved' || loan.status === 'active'"
                    class="btn btn-payment"
                    style="opacity: 0.5; cursor: not-allowed;"
                    :title="`You cannot record payments for ${loan.applicant_role === 'treasurer' ? 'Treasurer' : loan.applicant_role === 'president' ? 'President' : 'this'} loans`"
                    disabled
                  >
                    💵 Record Payment
                  </button>
                  <button
                    @click="viewLoanDetails(loan)"
                    class="btn btn-view"
                    title="View Details"
                  >
                    👁 View
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Approval Modal -->
    <div v-if="showApproveModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>✓ Approve Loan Application</h3>
          <button @click="closeModals" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="loan-summary">
            <p><strong>Farmer:</strong> {{ selectedLoan.full_name }}</p>
            <p><strong>Amount:</strong> ₱{{ selectedLoan.loan_amount.toLocaleString() }}</p>
            <p><strong>Purpose:</strong> {{ formatPurpose(selectedLoan.loan_purpose) }}</p>
            <p><strong>Payment Term:</strong> {{ selectedLoan.payment_term }} months</p>
          </div>

          <form @submit.prevent="approveLoan">
            <div class="form-group">
              <label>Due Date</label>
              <input
                type="date"
                v-model="approvalForm.due_date"
                :min="minDueDate"
                required
              />
            </div>
            <div class="form-group">
              <label>Remarks (Optional)</label>
              <textarea
                v-model="approvalForm.remarks"
                placeholder="Add any notes or conditions..."
                rows="3"
              ></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" @click="closeModals" class="btn btn-cancel">
                Cancel
              </button>
              <button type="submit" class="btn btn-submit" :disabled="processing">
                {{ processing ? 'Approving...' : 'Confirm Approval' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Rejection Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>✗ Reject Loan Application</h3>
          <button @click="closeModals" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="loan-summary">
            <p><strong>Farmer:</strong> {{ selectedLoan.full_name }}</p>
            <p><strong>Amount:</strong> ₱{{ selectedLoan.loan_amount.toLocaleString() }}</p>
            <p><strong>Purpose:</strong> {{ formatPurpose(selectedLoan.loan_purpose) }}</p>
          </div>

          <form @submit.prevent="rejectLoan">
            <div class="form-group">
              <label>Rejection Reason *</label>
              <textarea
                v-model="rejectionForm.reason"
                placeholder="Please provide a reason for rejection..."
                rows="4"
                required
              ></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" @click="closeModals" class="btn btn-cancel">
                Cancel
              </button>
              <button type="submit" class="btn btn-submit btn-danger" :disabled="processing">
                {{ processing ? 'Rejecting...' : 'Confirm Rejection' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h3>📋 Loan Details</h3>
          <button @click="closeModals" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="details-grid">
            <div class="detail-item">
              <label>Farmer Name</label>
              <p>{{ selectedLoan.full_name }}</p>
            </div>
            <div class="detail-item">
              <label>Reference Number</label>
              <p>{{ selectedLoan.reference_number }}</p>
            </div>
            <div class="detail-item" v-if="loanReceiptNumbers">
              <label>Receipt Number</label>
              <p>{{ loanReceiptNumbers }}</p>
            </div>
            <div class="detail-item">
              <label>Loan Amount</label>
              <p class="amount">₱{{ selectedLoan.loan_amount.toLocaleString() }}</p>
            </div>
            <div class="detail-item">
              <label>Interest Rate</label>
              <p>{{ selectedLoan.interest_rate }}%</p>
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
              <label>Application Date</label>
              <p>{{ formatDate(selectedLoan.application_date) }}</p>
            </div>
            <div class="detail-item">
              <label>Status</label>
              <p>
                <span :class="['status-badge', selectedLoan.status]">
                  {{ selectedLoan.status }}
                </span>
              </p>
            </div>
            <div class="detail-item" v-if="selectedLoan.approval_date">
              <label>Approval Date</label>
              <p>{{ formatDate(selectedLoan.approval_date) }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.approved_by_name">
              <label>Approved By</label>
              <p>{{ selectedLoan.approved_by_name }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.due_date">
              <label>Due Date</label>
              <p>{{ formatDate(selectedLoan.due_date) }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.last_payment_date">
              <label>Last Payment Date</label>
              <p>{{ formatDate(selectedLoan.last_payment_date) }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.paid_date">
              <label>Paid Date</label>
              <p>{{ formatDate(selectedLoan.paid_date) }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.remaining_balance">
              <label>Remaining Balance</label>
              <p class="amount">₱{{ selectedLoan.remaining_balance.toLocaleString() }}</p>
            </div>
            <div class="detail-item" v-if="selectedLoan.status === 'overdue' && selectedLoan.penalty_amount > 0" style="background-color: #fff3cd; padding: 10px; border-radius: 4px;">
              <label style="color: #856404;">⚠️ Overdue Penalty</label>
              <p style="color: #856404;">
                <strong>Penalty Amount:</strong> ₱{{ parseFloat(selectedLoan.penalty_amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}
              </p>
              <p style="color: #856404;">
                <strong>Days Overdue:</strong> {{ selectedLoan.days_overdue }} days ({{ selectedLoan.penalty_periods }} penalty periods)
              </p>
              <p style="color: #856404;">
                <strong>Total with Penalty:</strong> ₱{{ parseFloat(selectedLoan.total_with_penalty).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}
              </p>
              <p style="color: #856404; font-size: 0.85em; margin-top: 5px;">
                <em>2% penalty per 6-month period overdue</em>
              </p>
            </div>
            <div class="detail-item" v-if="selectedLoan.total_paid">
              <label>Total Paid</label>
              <p class="amount">₱{{ selectedLoan.total_paid.toLocaleString() }}</p>
            </div>
            <div class="detail-item full-width" v-if="selectedLoan.remarks">
              <label>Remarks</label>
              <p>{{ selectedLoan.remarks }}</p>
            </div>
            <div class="detail-item full-width" v-if="selectedLoan.rejection_reason">
              <label>Rejection Reason</label>
              <p class="rejection-reason">{{ selectedLoan.rejection_reason }}</p>
            </div>
          </div>

          <!-- Payment History Section -->
          <div v-if="loanPayments.length > 0" class="payment-history-section">
            <h4>💳 Payment History</h4>
            <table class="payment-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Receipt No.</th>
                  <th>Method</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in loanPayments" :key="payment.id">
                  <td>{{ formatDate(payment.payment_date) }}</td>
                  <td class="amount">₱{{ parseFloat(payment.amount).toLocaleString() }}</td>
                  <td>{{ payment.reference_number || '-' }}</td>
                  <td>{{ payment.payment_method || 'Cash' }}</td>
                  <td>{{ payment.remarks || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Recording Modal -->
    <div v-if="showPaymentModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>💵 Record Loan Payment</h3>
          <button @click="closeModals" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="loan-summary">
            <p><strong>Farmer:</strong> {{ selectedLoan.full_name }}</p>
            <p><strong>Loan Amount:</strong> ₱{{ selectedLoan.loan_amount?.toLocaleString() }}</p>
            <p><strong>Total Paid:</strong> ₱{{ (selectedLoan.total_paid || 0).toLocaleString() }}</p>
            <p><strong>Remaining Balance:</strong> ₱{{ (selectedLoan.remaining_balance || selectedLoan.loan_amount)?.toLocaleString() }}</p>
          </div>

          <form @submit.prevent="recordPayment">
            <div class="form-group">
              <label>Payment Type *</label>
              <div class="payment-type-buttons">
                <button
                  type="button"
                  :class="['payment-type-btn', { active: paymentForm.paymentType === 'full' }]"
                  @click="selectFullPayment"
                >
                  💵 Full Payment
                </button>
                <button
                  type="button"
                  :class="['payment-type-btn', { active: paymentForm.paymentType === 'partial' }]"
                  @click="selectPartialPayment"
                >
                  📄 Partial Payment
                </button>
              </div>
            </div>

            <div class="form-group" v-if="paymentForm.paymentType === 'partial'">
              <label>Payment Amount *</label>
              <input
                type="number"
                v-model="paymentForm.amount"
                :max="selectedLoan.remaining_balance || selectedLoan.loan_amount"
                min="1"
                step="0.01"
                placeholder="Enter partial payment amount"
                required
              />
              <small>Maximum: ₱{{ (selectedLoan.remaining_balance || selectedLoan.loan_amount)?.toLocaleString() }}</small>
            </div>

            <div class="form-group" v-if="paymentForm.paymentType === 'full'">
              <div class="full-payment-display">
                <label>Full Payment Amount</label>
                <p class="full-amount">₱{{ (selectedLoan.remaining_balance || selectedLoan.loan_amount)?.toLocaleString() }}</p>
              </div>
            </div>

            <div class="form-group">
              <label>Payment Date *</label>
              <input
                type="date"
                v-model="paymentForm.payment_date"
                :max="new Date().toISOString().split('T')[0]"
                required
              />
            </div>

            <div class="form-group">
              <label>Receipt Number *</label>
              <input
                type="text"
                v-model="paymentForm.reference_number"
                placeholder="Enter receipt number"
                required
              />
            </div>

            <div class="form-group">
              <label>Remarks</label>
              <textarea
                v-model="paymentForm.remarks"
                placeholder="Optional remarks..."
                rows="3"
              ></textarea>
            </div>

            <div class="payment-summary" v-if="paymentForm.amount">
              <p><strong>Payment Amount:</strong> ₱{{ parseFloat(paymentForm.amount).toLocaleString() }}</p>
              <p><strong>New Balance:</strong> ₱{{ ((selectedLoan.remaining_balance || selectedLoan.loan_amount) - parseFloat(paymentForm.amount)).toLocaleString() }}</p>
              <p v-if="(selectedLoan.remaining_balance || selectedLoan.loan_amount) - parseFloat(paymentForm.amount) <= 0" class="paid-notice">
                ✓ This payment will mark the loan as FULLY PAID
              </p>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModals" class="btn btn-cancel">
                Cancel
              </button>
              <button type="submit" class="btn btn-submit" :disabled="processing">
                {{ processing ? 'Recording...' : 'Record Payment' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import pendingApplicationsIcon from '../assets/loan-stats/pending-applications.svg'
import approvedLoansIcon from '../assets/loan-stats/approved-loans.svg'
import partialPaidIcon from '../assets/loan-stats/partial-paid.svg'
import overdueLoansIcon from '../assets/loan-stats/overdue-loans.svg'
import fullPaidIcon from '../assets/loan-stats/full-paid.svg'
import rejectedApplicationsIcon from '../assets/loan-stats/rejected-applications.svg'
import totalLoanAmountIcon from '../assets/loan-stats/total-loan-amount.svg'

const authStore = useAuthStore()
const route = useRoute()

const highlightedLoanId = ref(null)

const loans = ref([])
const loading = ref(true)
const activeTab = ref('pending')
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showDetailsModal = ref(false)
const showPaymentModal = ref(false)
const selectedLoan = ref({})
const loanPayments = ref([])
const farmerAssessments = ref({}) // Store ML assessments by farmer ID

// System time change detection
const lastKnownTime = ref(Date.now())
const timeChangeCheckInterval = ref(null)
const TIME_CHECK_INTERVAL = 15000 // Check every 15 seconds
const TIME_DRIFT_THRESHOLD = 5000 // 5 second threshold for detecting actual time change

const loanReceiptNumbers = computed(() => {
  if (loanPayments.value.length === 0) return ''
  const receipts = loanPayments.value
    .map(p => p.reference_number)
    .filter(Boolean)
  return receipts.length > 0 ? receipts.join(', ') : ''
})
const processing = ref(false)

const approvalForm = ref({
  due_date: '',
  remarks: ''
})

const rejectionForm = ref({
  reason: ''
})

const paymentForm = ref({
  paymentType: '',
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  remarks: ''
})

const stats = computed(() => {
  return {
    pending: loans.value.filter(l => l.status === 'pending').length,
    approved: loans.value.filter(l => l.status === 'approved').length,
    active: loans.value.filter(l => l.status === 'active').length,
    overdue: loans.value.filter(l => l.status === 'overdue').length,
    paid: loans.value.filter(l => l.status === 'paid').length,
    rejected: loans.value.filter(l => l.status === 'rejected').length,
    totalAmount: loans.value.reduce((sum, l) => {
      if (l.status === 'approved') {
        // For approved loans, include full loan amount
        return sum + parseFloat(l.loan_amount || 0)
      } else if (l.status === 'active') {
        // For partial paid loans, include only remaining balance
        return sum + parseFloat(l.remaining_balance || 0)
      } else if (l.status === 'overdue') {
        // For overdue loans, include remaining balance + penalty
        return sum + parseFloat(l.total_with_penalty || l.remaining_balance || 0)
      } else if (l.status === 'paid') {
        // For full paid loans, include full loan amount (historical)
        return sum + parseFloat(l.loan_amount || 0)
      }
      return sum
    }, 0)
  }
})

const filteredLoans = computed(() => {
  if (activeTab.value === 'all') {
    return loans.value
  }
  return loans.value.filter(loan => loan.status === activeTab.value)
})

const pageTitle = computed(() => {
  const userRole = authStore.currentUser?.role;
  if (userRole === 'president') {
    return 'Treasurer Loan Approvals';
  }
  return 'Loan Management';
})

const pageSubtitle = computed(() => {
  const userRole = authStore.currentUser?.role;
  if (userRole === 'president') {
    return 'Review and approve treasurer loan applications';
  } else if (userRole === 'treasurer') {
    return 'Manage your officer loan applications';
  }
  return 'Review and manage farmer and officer loan applications';
})

const canRecordPayment = computed(() => {
  return (loan) => {
    const userRole = authStore.currentUser?.role;
    const userId = authStore.currentUser?.id;
    const isOfficerLoan = ['treasurer', 'president'].includes(loan.applicant_role);
    
    // Admin can always record payments
    if (userRole === 'admin') return true;
    
    // Officer loans require cross-approval for payment recording
    if (isOfficerLoan) {
      // Officers cannot record payments on their own loans
      if (userId === loan.farmer_id) return false;
      
      // Treasurer loans can only be recorded by President
      if (loan.applicant_role === 'treasurer' && userRole === 'president') return true;
      
      // President loans can only be recorded by Treasurer
      if (loan.applicant_role === 'president' && userRole === 'treasurer') return true;
      
      return false;
    }
    
    // Farmer loans can be recorded by treasurer, operation_manager, business_manager, president
    const allowedRoles = ['treasurer', 'operation_manager', 'business_manager', 'president'];
    return allowedRoles.includes(userRole);
  };
})

const minDueDate = computed(() => {
  const today = new Date()
  today.setDate(today.getDate() + 1)
  return today.toISOString().split('T')[0]
})

async function fetchLoans() {
  loading.value = true
  try {
    const token = authStore.token;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const deviceDate = new Date();
    const deviceDateStr = deviceDate.getFullYear() + '-' + String(deviceDate.getMonth() + 1).padStart(2, '0') + '-' + String(deviceDate.getDate()).padStart(2, '0');
    const response = await fetch(`/api/loans?deviceDate=${deviceDateStr}`, { headers })
    const data = await response.json()
    if (data.success) {
      // Filter loans based on user role
      const userRole = authStore.currentUser?.role;
      const userId = authStore.currentUser?.id;
      
      if (userRole === 'president') {
        // President sees:
        // - All non-officer loans (farmers, operators, etc.)
        // - All treasurer loans (for cross-approval)
        // - Their own president loans
        loans.value = data.loans.filter(loan => 
          !['president', 'treasurer'].includes(loan.applicant_role) ||  // All non-officer loans
          loan.applicant_role === 'treasurer' ||  // Treasurer loans for cross-approval
          (loan.applicant_role === 'president' && loan.farmer_id === userId)  // Their own president loans
        );
      } else if (userRole === 'treasurer') {
        // Treasurer sees:
        // - All non-officer loans (farmers, operators, etc.)
        // - All president loans (for cross-approval reference)
        // - Their own treasurer loans
        // - But NOT other treasurers' loans
        loans.value = data.loans.filter(loan => 
          !['president', 'treasurer'].includes(loan.applicant_role) ||  // All non-officer loans
          loan.applicant_role === 'president' ||  // President loans for cross-reference
          (loan.applicant_role === 'treasurer' && loan.farmer_id === userId)  // Only their own treasurer loans
        );
      } else {
        // Admin sees all loans
        loans.value = data.loans;
      }
      
      // Fetch ML assessments for all unique farmers in the loans
      await fetchFarmerAssessments();
    }
  } catch (error) {
    console.error('Error fetching loans:', error)
    alert('Failed to fetch loans')
  } finally {
    loading.value = false
  }
}

async function fetchFarmerAssessments() {
  try {
    const uniqueFarmerIds = [...new Set(loans.value.map(l => l.farmer_id))];
    
    for (const farmerId of uniqueFarmerIds) {
      try {
        const token = authStore.token;
        const headers = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/ml-assessments/farmer/${farmerId}`, { headers });
        const data = await response.json();
        
        if (data.success) {
          farmerAssessments.value[farmerId] = data.data;
        }
      } catch (error) {
        console.error(`Error fetching assessment for farmer ${farmerId}:`, error);
        // Continue with next farmer if one fails
      }
    }
  } catch (error) {
    console.error('Error fetching farmer assessments:', error);
  }
}

function getPayerAssessment(farmerId) {
  return farmerAssessments.value[farmerId] || null;
}

function getPayerAssessmentIcon(classification) {
  switch (classification) {
    case 'GOOD_PAYER':
      return '🟢';
    case 'AVERAGE_PAYER':
      return '🟡';
    case 'HIGH_RISK_PAYER':
      return '🔴';
    case 'NEW_BORROWER':
      return '🔵';
    default:
      return '⭕';
  }
}

function formatPayerStatus(classification) {
  switch (classification) {
    case 'GOOD_PAYER':
      return 'Good Payer';
    case 'AVERAGE_PAYER':
      return 'Average Payer';
    case 'HIGH_RISK_PAYER':
      return 'High Risk';
    case 'NEW_BORROWER':
      return 'New Borrower';
    default:
      return 'Unknown';
  }
}

function openApproveModal(loan) {
  selectedLoan.value = loan
  // Set default due date based on payment term
  const dueDate = new Date()
  dueDate.setMonth(dueDate.getMonth() + (loan.payment_term || 12))
  approvalForm.value.due_date = dueDate.toISOString().split('T')[0]
  approvalForm.value.remarks = ''
  showApproveModal.value = true
}

function openRejectModal(loan) {
  selectedLoan.value = loan
  rejectionForm.value.reason = ''
  showRejectModal.value = true
}

async function viewLoanDetails(loan) {
  selectedLoan.value = loan
  loanPayments.value = []
  showDetailsModal.value = true
  
  // Fetch payment history for this loan
  try {
    const response = await fetch(`/api/loans/${loan.id}?deviceDate=${new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    const data = await response.json()
    if (data.success && data.payments) {
      loanPayments.value = data.payments
    }
  } catch (error) {
    console.error('Error fetching loan payments:', error)
  }
}

function openPaymentModal(loan) {
  selectedLoan.value = loan
  paymentForm.value = {
    paymentType: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    remarks: ''
  }
  showPaymentModal.value = true
}

function selectFullPayment() {
  paymentForm.value.paymentType = 'full'
  paymentForm.value.amount = selectedLoan.value.remaining_balance || selectedLoan.value.loan_amount
}

function selectPartialPayment() {
  paymentForm.value.paymentType = 'partial'
  paymentForm.value.amount = ''
}

function closeModals() {
  showApproveModal.value = false
  showRejectModal.value = false
  showDetailsModal.value = false
  showPaymentModal.value = false
  selectedLoan.value = {}
}

async function approveLoan() {
  processing.value = true
  try {
    const adminId = authStore.currentUser?.id || authStore.userId
    
    if (!adminId) {
      alert('User not authenticated properly')
      processing.value = false
      return
    }
    
    console.log('Approving loan with data:', {
      loan_id: selectedLoan.value.id,
      approved_by: adminId,
      due_date: approvalForm.value.due_date,
      remarks: approvalForm.value.remarks
    })
    
    const response = await fetch(`/api/loans/${selectedLoan.value.id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        approved_by: adminId,
        due_date: approvalForm.value.due_date,
        remarks: approvalForm.value.remarks
      })
    })

    const data = await response.json()
    console.log('Approval response:', data)
    
    if (data.success) {
      alert('Loan approved successfully!')
      closeModals()
      await fetchLoans()
    } else {
      alert('Failed to approve loan: ' + (data.error || data.message))
      console.error('Server error:', data)
    }
  } catch (error) {
    console.error('Error approving loan:', error)
    alert('Failed to approve loan: ' + error.message)
  } finally {
    processing.value = false
  }
}

async function rejectLoan() {
  processing.value = true
  try {
    const adminId = authStore.currentUser?.id || authStore.userId
    
    if (!adminId) {
      alert('User not authenticated properly')
      processing.value = false
      return
    }

    const response = await fetch(`/api/loans/${selectedLoan.value.id}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        rejected_by: adminId,
        rejection_reason: rejectionForm.value.reason
      })
    })

    const data = await response.json()
    
    if (data.success) {
      alert('Loan rejected')
      closeModals()
      await fetchLoans()
    } else {
      alert('Failed to reject loan: ' + (data.error || data.message))
    }
  } catch (error) {
    console.error('Error rejecting loan:', error)
    alert('Failed to reject loan: ' + error.message)
  } finally {
    processing.value = false
  }
}

async function recordPayment() {
  if (!paymentForm.value.paymentType) {
    alert('Please select payment type (Full or Partial)')
    return
  }

  if (!paymentForm.value.amount || parseFloat(paymentForm.value.amount) <= 0) {
    alert('Please enter a valid payment amount')
    return
  }

  if (!paymentForm.value.reference_number || paymentForm.value.reference_number.trim() === '') {
    alert('Receipt number is required')
    return
  }

  const remainingBalance = selectedLoan.value.remaining_balance || selectedLoan.value.loan_amount
  if (parseFloat(paymentForm.value.amount) > remainingBalance) {
    alert('Payment amount cannot exceed remaining balance')
    return
  }

  processing.value = true
  try {
    const adminId = authStore.currentUser?.id || authStore.userId
    
    const response = await fetch(`/api/loans/${selectedLoan.value.id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        amount: parseFloat(paymentForm.value.amount),
        payment_date: paymentForm.value.payment_date,
        payment_method: 'cash',
        reference_number: paymentForm.value.reference_number.trim(),
        remarks: paymentForm.value.remarks || null,
        recorded_by: adminId
      })
    })

    const data = await response.json()
    
    if (data.success) {
      const newBalance = remainingBalance - parseFloat(paymentForm.value.amount)
      const isPaidOff = newBalance <= 0
      
      alert(`Payment recorded successfully!\n\nPayment: ₱${parseFloat(paymentForm.value.amount).toLocaleString()}\nNew Balance: ₱${newBalance.toLocaleString()}\nStatus: ${isPaidOff ? 'PAID' : 'ACTIVE'}`)
      closeModals()
      await fetchLoans()
    } else {
      alert('Failed to record payment: ' + data.message)
    }
  } catch (error) {
    console.error('Error recording payment:', error)
    alert('Failed to record payment')
  } finally {
    processing.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatPurpose(purpose) {
  if (!purpose) return 'N/A'
  const purposes = {
    seeds: 'Seeds Purchase',
    equipment: 'Equipment Purchase',
    fertilizer: 'Fertilizer & Chemicals',
    irrigation: 'Irrigation System',
    other: 'Other'
  }
  return purposes[purpose] || purpose
}

// Function to detect system time/date changes and refresh loan statuses
function startTimeChangeDetection() {
  timeChangeCheckInterval.value = setInterval(() => {
    const currentTime = Date.now()
    const timeDifference = currentTime - lastKnownTime.value
    
    // If time has jumped forward or backward abnormally (beyond drift threshold)
    // This detects system date/time changes
    if (Math.abs(timeDifference - TIME_CHECK_INTERVAL) > TIME_DRIFT_THRESHOLD) {
      console.log(`⏰ System time change detected! Difference: ${timeDifference}ms (threshold: ${TIME_DRIFT_THRESHOLD}ms)`);
      console.log(`Last known: ${new Date(lastKnownTime.value).toLocaleString()}, Current: ${new Date(currentTime).toLocaleString()}`);
      
      // Refresh loans to recalculate overdue status
      fetchLoans();
    }
    
    lastKnownTime.value = currentTime;
  }, TIME_CHECK_INTERVAL);
}

// Function to stop time change detection
function stopTimeChangeDetection() {
  if (timeChangeCheckInterval.value) {
    clearInterval(timeChangeCheckInterval.value);
    timeChangeCheckInterval.value = null;
    console.log('⏰ Time change detection stopped');
  }
}

onMounted(async () => {
  await fetchLoans()

  // Start detecting system time/date changes
  startTimeChangeDetection()

  // Handle notification highlight
  if (route.query.highlight && route.query.type === 'loan') {
    highlightedLoanId.value = route.query.highlight
    // Switch to the tab containing this loan
    const loan = loans.value.find(l => l.id == route.query.highlight)
    if (loan) {
      activeTab.value = loan.status
    }
    await nextTick()
    setTimeout(() => {
      const el = document.querySelector(`[data-loan-id="${route.query.highlight}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      setTimeout(() => { highlightedLoanId.value = null }, 6000)
    }, 300)
  }
})

onUnmounted(() => {
  // Stop detecting time changes when component is unmounted
  stopTimeChangeDetection()
})
</script>

<style scoped>
/* Notification highlight for table rows */
.notification-highlight-row {
  animation: highlightRowPulse 2s ease-in-out 3;
  background: #fef2f2 !important;
  outline: 2px solid #ef4444;
  outline-offset: -2px;
}

.notification-highlight-row td {
  background: #fef2f2 !important;
  color: #991b1b;
  font-weight: 600;
}

@keyframes highlightRowPulse {
  0%, 100% { box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0.2); }
  50% { box-shadow: inset 0 0 0 2px rgba(239, 68, 68, 0.6); }
}

.page-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2.4rem;
  padding: 1.2rem 1.4rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -62px;
  right: -72px;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(74, 222, 128, 0.2) 0%, rgba(74, 222, 128, 0) 68%);
  pointer-events: none;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
  color: #1e293b;
}

.page-subtitle {
  color: #64748b;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.5;
  margin: 0;
}

.page-header::after {
  content: '';
  position: absolute;
  left: 1.4rem;
  right: 1.4rem;
  bottom: 0.45rem;
  height: 1px;
  background: linear-gradient(90deg, rgba(74, 222, 128, 0.42), rgba(45, 212, 191, 0.12));
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  border-left: 4px solid;
}

.stat-card.pending {
  border-left-color: #f59e0b;
}

.stat-card.approved {
  border-left-color: #10b981;
}

.stat-card.active {
  border-left-color: #8b5cf6;
}

.stat-card.paid {
  border-left-color: #059669;
}

.stat-card.rejected {
  border-left-color: #ef4444;
}

.stat-card.total {
  border-left-color: #3b82f6;
}

.stat-icon {
  width: 3.5rem;
  height: 3.5rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  color: #64748b;
  font-size: 0.875rem;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  flex-wrap: wrap;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab:hover {
  color: #1e293b;
}

.tab.active {
  color: #3b82f6;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
}

/* Card */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Table */
.table-container {
  overflow-x: auto;
  border-radius: 12px;
}

.loans-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 1520px;
}

.loans-table th,
.loans-table td {
  padding: 1rem 0.95rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.loans-table th:not(:last-child),
.loans-table td:not(:last-child) {
  border-right: 1px solid rgba(203, 213, 225, 0.22);
}

.loans-table th {
  background: #f8fafc;
  font-weight: 700;
  color: #475569;
  font-size: 0.84rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.loans-table td {
  font-size: 0.97rem;
  line-height: 1.35;
}

.loans-table col.col-name { width: 190px; }
.loans-table col.col-amount { width: 130px; }
.loans-table col.col-purpose { width: 170px; }
.loans-table col.col-payer { width: 340px; }
.loans-table col.col-date { width: 150px; }
.loans-table col.col-term { width: 118px; }
.loans-table col.col-status { width: 110px; }
.loans-table col.col-actions { width: 272px; }

.td-name {
  font-weight: 700;
  word-break: break-word;
}

.td-purpose {
  text-align: center;
  word-break: break-word;
}

.th-payer,
.td-payer,
.th-actions,
.td-actions {
  padding-left: 1.1rem;
  padding-right: 1.1rem;
}

.th-date,
.td-date,
.th-term,
.td-term,
.th-status,
.td-status {
  text-align: center !important;
}

.th-date,
.th-term {
  white-space: normal;
  line-height: 1.2;
  font-size: 0.78rem;
}

.td-date,
.td-term,
.td-status {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loans-table tbody tr:hover {
  background: #f8fafc;
}

.amount {
  font-weight: 800;
  color: #059669;
  white-space: nowrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.78rem;
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

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.active {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.paid {
  background: #d1fae5;
  color: #059669;
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 0.42rem 0.7rem;
  border: none;
  border-radius: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-approve:hover {
  background: #059669;
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.btn-reject:hover {
  background: #dc2626;
}

.btn-payment {
  background: #8b5cf6;
  color: white;
}

.btn-payment:hover {
  background: #7c3aed;
}

.btn-view {
  background: #3b82f6;
  color: white;
}

.btn-view:hover {
  background: #2563eb;
}

.btn-cancel {
  background: #e2e8f0;
  color: #475569;
}

.btn-cancel:hover {
  background: #cbd5e1;
}

.btn-submit {
  background: #3b82f6;
  color: white;
}

.btn-submit:hover {
  background: #2563eb;
}

.btn-submit.btn-danger {
  background: #ef4444;
}

.btn-submit.btn-danger:hover {
  background: #dc2626;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.modal-large {
  max-width: 800px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.close-btn:hover {
  color: #1e293b;
}

.modal-body {
  padding: 1.5rem;
}

.loan-summary {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.loan-summary p {
  margin: 0.5rem 0;
  color: #475569;
}

.payment-summary {
  background: #eff6ff;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  border-left: 4px solid #3b82f6;
}

.payment-summary p {
  margin: 0.5rem 0;
  color: #1e40af;
}

.paid-notice {
  color: #059669 !important;
  font-weight: 600;
  margin-top: 1rem !important;
  padding-top: 1rem;
  border-top: 2px solid #d1fae5;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #475569;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.875rem;
}

.payment-type-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.payment-type-btn {
  padding: 1rem;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-type-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.payment-type-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.full-payment-display {
  background: #f0fdf4;
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid #10b981;
}

.full-payment-display label {
  color: #065f46;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.full-amount {
  font-size: 1.75rem;
  font-weight: 700;
  color: #059669;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.detail-item p {
  font-size: 1rem;
  color: #1e293b;
  margin: 0;
}

.rejection-reason {
  color: #dc2626;
  font-style: italic;
}

/* Payment History Section */
.payment-history-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.payment-history-section h4 {
  margin-bottom: 1rem;
  color: #1e293b;
  font-size: 1.1rem;
}

.payment-history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.payment-history-table th,
.payment-history-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.payment-history-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
}

.payment-history-table td.amount {
  color: #059669;
  font-weight: 600;
}

@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .page-header {
    margin-bottom: 1.8rem;
    padding: 1.1rem 1rem 1rem;
    gap: 0.45rem;
  }

  .page-title {
    font-size: 1.55rem;
    line-height: 1.25;
  }

  .page-subtitle {
    font-size: 0.96rem;
    line-height: 1.45;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filter-tabs {
    overflow-x: auto;
  }

  .loans-table {
    font-size: 0.875rem;
  }

  .loans-table th,
  .loans-table td {
    padding: 0.75rem 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-buttons .btn {
    width: 100%;
  }
}

/* Payer Status Badge */
.payer-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
}

.payer-badge.low {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.payer-badge.medium {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.payer-badge.high {
  background: #fee2e2;
  color: #7f1d1d;
  border: 1px solid #fca5a5;
}

.payer-badge.loading {
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #a5b4fc;
}

.payer-badge.unknown {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.payer-icon {
  font-size: 1.1rem;
}

.payer-text {
  letter-spacing: 0.5px;
}

.payer-cell {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 280px;
  align-items: center;
  text-align: center;
}

.payer-reason {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8rem;
  color: #555;
  line-height: 1.3;
}

.credit-score {
  color: #374151;
}

.score-factors {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.74rem;
  color: #6b7280;
  justify-content: center;
}

.score-factors span {
  cursor: help;
}

.payer-desc {
  font-style: italic;
  color: #6b7280;
  font-size: 0.76rem;
}

/* Dashboard theme override */
.page-container {
  min-height: 100vh;
  background: linear-gradient(145deg, #0f1712 0%, #132119 22%, #1a2b20 45%, #243b2c 72%, #2f4a38 100%);
  color: #eefde6;
  border-radius: 18px;
}

.page-header,
.card,
.modal-content,
.summary-card,
.alert-card {
  background: rgba(28, 42, 33, 0.92) !important;
  border: 1px solid rgba(190, 235, 203, 0.14) !important;
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.30), inset 1px 1px 0 rgba(255,255,255,0.05) !important;
}

.page-header {
  padding: 1.35rem 1.5rem 1.2rem !important;
  margin-bottom: 2.5rem !important;
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.15rem 1rem 1rem !important;
    margin-bottom: 1.9rem !important;
  }
}

.page-title,
.stat-value,
.detail-item p,
.payment-history-section h4 { color: #eefde6 !important; }

.page-subtitle,
.stat-label,
.detail-item label,
.form-group small,
.score-factors,
.payer-desc { color: rgba(229, 235, 231, 0.82) !important; }

.payer-badge,
.payer-reason,
.credit-score,
.score-factors,
.payer-desc,
.payer-text {
  color: rgba(238, 245, 240, 0.96) !important;
}

.payer-text {
  color: #111827 !important;
}

.payer-badge.low,
.payer-badge.medium,
.payer-badge.high,
.payer-badge.loading,
.payer-badge.unknown {
  color: rgba(244, 248, 246, 0.98) !important;
}

.filter-tabs {
  border-bottom: 0 !important;
  gap: 0.75rem !important;
}

.tab {
  background: #ffffff !important;
  border: 2px solid #166534 !important;
  color: #14532d !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  box-shadow: none !important;
}

.tab:hover {
  background: #f0fdf4 !important;
  color: #14532d !important;
}

.tab.active {
  background: #dcfce7 !important;
  color: #14532d !important;
  border-color: #166534 !important;
}

.tab.active::after {
  display: none !important;
  content: none !important;
}

.loans-table th,
.payment-history-table th {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.18) 0%, rgba(45, 212, 191, 0.10) 100%) !important;
  color: rgba(234, 241, 236, 0.94) !important;
  border-bottom-color: rgba(190, 235, 203, 0.2) !important;
}

.loans-table td,
.payment-history-table td {
  color: rgba(226, 234, 229, 0.92) !important;
  border-bottom-color: rgba(255,255,255,0.06) !important;
}
.loans-table tbody tr:hover { background: rgba(74, 222, 128, 0.07) !important; }

.form-group input,
.form-group textarea,
.form-group select,
.payment-type-btn {
  background: rgba(0,0,0,0.24) !important;
  color: #eefde6 !important;
  border-color: rgba(190, 235, 203, 0.24) !important;
}

.payment-type-btn.active {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.28), rgba(34, 197, 94, 0.2)) !important;
  border-color: rgba(74, 222, 128, 0.38) !important;
}
</style>
