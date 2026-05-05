<template>
  <div class="section-card">
    <div class="section-header-with-actions">
      <h2 class="section-title">⏳ Pending Member Approvals</h2>
      <div v-if="filteredFarmers.length > 0" class="bulk-actions">
        <button @click="approveAllPending" class="bulk-approve-btn" :disabled="processingBulk">
          <span v-if="!processingBulk">✓ Approve All ({{ filteredFarmers.length }})</span>
          <span v-else>Processing...</span>
        </button>
        <button @click="$emit('refresh')" class="refresh-btn" :disabled="loading">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <span class="search-icon" aria-hidden="true">🔎</span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name, reference number, or phone..."
        class="search-input"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading pending members...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="$emit('refresh')" class="retry-btn">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredFarmers.length === 0" class="empty-state">
      <p>✓ No pending members to approve.</p>
      <p class="empty-hint">If you expect pending accounts, verify that:</p>
      <ul class="empty-checklist">
        <li>- You are logged in as an admin account</li>
        <li>- The backend server is running (http://localhost:5000)</li>
        <li>- New users have status set to <code>pending</code> in the database</li>
      </ul>
    </div>

    <!-- Pending Members Table -->
    <div v-else class="members-table">
      <table>
        <thead>
          <tr>
            <th>Reference Number</th>
            <th>Full Name</th>
            <th>Date of Birth</th>
            <th>Phone Number</th>
            <th>Education</th>
            <th>Role</th>
            <th>Membership Status</th>
            <th>Barangay</th>
            <th>Registered Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in filteredFarmers" :key="member.id">
            <td>{{ member.reference_number }}</td>
            <td>{{ member.full_name }}</td>
            <td>{{ formatDate(member.date_of_birth) }}</td>
            <td>{{ member.phone_number }}</td>
            <td>{{ member.educational_status || 'N/A' }}</td>
            <td>
              <select 
                :value="member.role" 
                @change="updateRole(member.id, $event.target.value)"
                class="role-select"
                :disabled="processingId === member.id"
              >
                <option value="farmer">👨‍🌾 Farmer</option>
                <option value="president">👔 President</option>
                <option value="treasurer">💰 Treasurer</option>
                <option value="auditor">📊 Auditor</option>
                <option value="operator">⚙️ Operator</option>
                <option value="operation_manager">🛠️ Operation Manager</option>
                <option value="business_manager">💼 Business Manager</option>
                <option value="agriculturist">🌱 Agriculturist</option>
                <option value="admin">👨‍💼 Admin</option>
              </select>
            </td>
            <td>
              <select 
                :value="member.membership_status || 'member'" 
                @change="updateMembershipStatus(member.id, $event.target.value)"
                class="role-select"
                :disabled="processingId === member.id"
              >
                <option value="member">✓ Member</option>
                <option value="non-member">✗ Non-Member</option>
              </select>
            </td>
            <td>{{ member.barangay_name || 'Not assigned' }}</td>
            <td>{{ formatDate(member.registered_on) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  @click="approveMember(member.id)"
                  class="approve-btn"
                  :disabled="processingId === member.id || member.role === 'admin'"
                >
                  {{ processingId === member.id ? 'Processing...' : '✓ Approve' }}
                </button>
                <button
                  @click="rejectMember(member.id)"
                  class="reject-btn"
                  :disabled="processingId === member.id || member.role === 'admin'"
                >
                  ✗ Reject
                </button>
                <button
                  @click="deleteMember(member.id)"
                  class="delete-btn"
                  :disabled="processingId === member.id || member.role === 'admin'"
                >
                  🗑️ Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message-banner">
      <span class="success-icon">✓</span>
      <span class="success-text">{{ successMessage }}</span>
      <button @click="successMessage = ''" class="close-success">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'

const emit = defineEmits(['approve', 'reject', 'delete', 'refresh', 'update-role', 'update-membership-status'])
const authStore = useAuthStore()

const props = defineProps({
  farmers: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
})

const searchQuery = ref('')
const processingId = ref(null)
const processingBulk = ref(false)
const successMessage = ref('')

const filteredFarmers = computed(() => {
  const farmerList = props.farmers || []
  if (!searchQuery.value) return farmerList

  const query = searchQuery.value.toLowerCase()
  return farmerList.filter(farmer =>
    farmer.full_name?.toLowerCase().includes(query) ||
    farmer.reference_number?.toLowerCase().includes(query) ||
    farmer.phone_number?.includes(query)
  )
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const approveMember = async (memberId) => {
  if (!confirm('Are you sure you want to approve this member? They will be able to login after approval.')) {
    return
  }

  processingId.value = memberId
  successMessage.value = ''

  try {
    emit('approve', memberId)
    
    const member = props.farmers.find(m => m.id === memberId)
    successMessage.value = `Member "${member?.full_name || memberId}" approved successfully! They can now login.`
    
    setTimeout(() => {
      successMessage.value = ''
      processingId.value = null
    }, 3000)
  } catch (err) {
    processingId.value = null
    alert('Error approving member: ' + err.message)
  }
}

const rejectMember = async (memberId) => {
  if (!confirm('Are you sure you want to reject this member?')) {
    return
  }

  processingId.value = memberId
  successMessage.value = ''

  try {
    emit('reject', memberId)
    
    const member = props.farmers.find(m => m.id === memberId)
    successMessage.value = `Member "${member?.full_name || memberId}" has been rejected.`
    
    setTimeout(() => {
      successMessage.value = ''
      processingId.value = null
    }, 3000)
  } catch (err) {
    processingId.value = null
    alert('Error rejecting member: ' + err.message)
  }
}

const deleteMember = async (memberId) => {
  if (!confirm('Are you sure you want to permanently delete this member? This action cannot be undone.')) {
    return
  }

  processingId.value = memberId
  successMessage.value = ''

  try {
    emit('delete', memberId)
    
    successMessage.value = 'Member deleted successfully.'
    
    setTimeout(() => {
      successMessage.value = ''
      processingId.value = null
    }, 3000)
  } catch (err) {
    processingId.value = null
    alert('Error deleting member: ' + err.message)
  }
}

const updateRole = async (memberId, newRole) => {
  if (!confirm(`Are you sure you want to change this account role to "${newRole.toUpperCase()}"?`)) {
    emit('refresh') // Refresh to reset the dropdown
    return
  }

  processingId.value = memberId
  successMessage.value = ''

  try {
    emit('update-role', { memberId, newRole })
    
    successMessage.value = `Role updated to ${newRole} successfully!`
    
    setTimeout(() => {
      successMessage.value = ''
      processingId.value = null
    }, 2000)
  } catch (err) {
    processingId.value = null
    emit('refresh') // Refresh to reset on error
    alert('Error updating role: ' + err.message)
  }
}

const updateMembershipStatus = async (memberId, newStatus) => {
  const statusLabel = newStatus === 'member' ? 'Member' : 'Non-Member'
  if (!confirm(`Are you sure you want to change this farmer's status to "${statusLabel}"?`)) {
    emit('refresh') // Refresh to reset the dropdown
    return
  }

  processingId.value = memberId
  successMessage.value = ''

  try {
    emit('update-membership-status', { memberId, membershipStatus: newStatus })
    
    successMessage.value = `Membership status updated to ${statusLabel} successfully!`
    
    setTimeout(() => {
      successMessage.value = ''
      processingId.value = null
    }, 2000)
  } catch (err) {
    processingId.value = null
    emit('refresh') // Refresh to reset on error
    alert('Error updating membership status: ' + err.message)
  }
}

const approveAllPending = async () => {
  if (filteredFarmers.value.length === 0) {
    return
  }

  if (!confirm(`Are you sure you want to approve all ${filteredFarmers.value.length} pending members?`)) {
    return
  }

  processingBulk.value = true
  successMessage.value = ''

  try {
    // Emit approve for each member
    for (const member of filteredFarmers.value) {
      emit('approve', member.id)
    }
    
    successMessage.value = `Successfully processing ${filteredFarmers.value.length} member(s) for approval!`
    
    setTimeout(() => {
      successMessage.value = ''
      processingBulk.value = false
      emit('refresh')
    }, 2000)
  } catch (err) {
    processingBulk.value = false
    alert('Error approving members: ' + err.message)
  }
}
</script>

<style scoped>
.section-card {
  background: linear-gradient(145deg, rgba(220, 252, 231, 0.32), rgba(187, 247, 208, 0.22));
  border: 1px solid rgba(74, 222, 128, 0.35);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 26px rgba(5, 46, 22, 0.22), inset 1px 1px 0 rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(12px) saturate(125%);
  -webkit-backdrop-filter: blur(12px) saturate(125%);
  margin-bottom: 24px;
}

.section-header-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.bulk-actions {
  display: flex;
  gap: 12px;
}

.bulk-approve-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.bulk-approve-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.bulk-approve-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn {
  padding: 10px 20px;
  background: white;
  color: #059669;
  border: 2px solid #059669;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #059669;
  color: white;
}

.search-container {
  margin-bottom: 20px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 54px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  background: #ffffff;
  transition: all 0.2s;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 800;
  color: #065f46;
  background: linear-gradient(135deg, rgba(209, 250, 229, 0.95), rgba(167, 243, 208, 0.9));
  border: 1px solid rgba(16, 185, 129, 0.35);
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.18);
  pointer-events: none;
}

.search-input::placeholder {
  color: #6b7280;
}

.search-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #374151;
}

.empty-state {
  background: rgba(16, 40, 28, 0.7);
  border: 1px solid rgba(74, 222, 128, 0.28);
  border-radius: 12px;
}

.empty-state > p:first-child {
  color: #ffffff !important;
  font-size: 18px;
  font-weight: 800;
}

.empty-hint {
  margin-top: 10px;
  font-size: 14px;
  color: #ffffff !important;
  font-weight: 700;
}

.empty-checklist {
  margin-top: 8px;
  padding-left: 0;
  list-style: none;
  font-size: 13px;
  color: #ffffff !important;
  line-height: 1.6;
  font-weight: 600;
}

.empty-checklist code {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff !important;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  color: #ef4444;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 24px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.members-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead tr {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(16, 185, 129, 0.18));
  border-bottom: 1px solid rgba(16, 185, 129, 0.35);
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
}

th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #14532d;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: none;
  background: transparent !important;
}

tbody tr:hover {
  background: transparent !important;
}

/* Remove click/tap highlight on member rows */
tbody tr,
tbody tr td {
  -webkit-tap-highlight-color: transparent;
}

/* Also remove tap/click highlight from interactive controls in rows */
.members-table button,
.members-table select,
.members-table input,
.members-table td,
.members-table tr {
  -webkit-tap-highlight-color: transparent;
}

tbody tr:active,
tbody tr:focus,
tbody tr:focus-within,
tbody tr:active td,
tbody tr:focus td,
tbody tr:focus-within td {
  background: transparent !important;
  outline: none;
}

td {
  padding: 16px;
  color: #1f2937;
  font-size: 14px;
  background: transparent !important;
}

.role-select {
  padding: 6px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: capitalize;
}

.role-select:hover:not(:disabled) {
  border-color: #10b981;
}

.role-select:focus {
  outline: none;
  border-color: #e5e7eb;
  box-shadow: none;
  background: white;
}

.role-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f3f4f6;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.approve-btn,
.reject-btn,
.delete-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.approve-btn {
  background: #d1fae5;
  color: #065f46;
}

.approve-btn:hover:not(:disabled) {
  background: #10b981;
  color: white;
}

.reject-btn {
  background: #fee2e2;
  color: #991b1b;
}

.reject-btn:hover:not(:disabled) {
  background: #ef4444;
  color: white;
}

.delete-btn {
  background: #fef3c7;
  color: #92400e;
}

.delete-btn:hover:not(:disabled) {
  background: #f59e0b;
  color: white;
}

.approve-btn:disabled,
.reject-btn:disabled,
.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Prevent focus/active click flash on action buttons */
.approve-btn:focus,
.reject-btn:focus,
.delete-btn:focus,
.approve-btn:active,
.reject-btn:active,
.delete-btn:active {
  outline: none;
  box-shadow: none;
}

.success-message-banner {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.success-icon {
  font-size: 20px;
}

.success-text {
  font-weight: 600;
}

.close-success {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-success:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .section-header-with-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .bulk-actions {
    width: 100%;
    flex-direction: column;
  }

  .bulk-approve-btn,
  .refresh-btn {
    width: 100%;
  }

  .members-table {
    font-size: 12px;
  }

  th, td {
    padding: 8px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .approve-btn,
  .reject-btn,
  .delete-btn {
    width: 100%;
  }

  .success-message-banner {
    left: 20px;
    right: 20px;
  }
}
</style>
