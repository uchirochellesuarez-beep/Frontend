<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h2 class="text-2xl font-bold mb-4" style="color: #000000;">✅ Registered Members</h2>
    
    <div v-if="displayLoading" class="text-center py-8 text-gray-500">
      Loading members...
    </div>
    <div v-else-if="displayError" class="text-center py-8 text-red-500">
      Error: {{ displayError }}
    </div>
    <div v-else-if="displayFarmers.length === 0" class="text-center py-8 text-gray-500">
      No members registered yet.
    </div>
    <div v-else>
      <!-- Role Tabs -->
      <div class="role-tabs mb-6">
        <button 
          @click="activeRole = 'operation_manager'" 
          :class="['role-tab', { 'active': activeRole === 'operation_manager' }]"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/1534/1534938.png" class="role-tab-icon" alt="" />
          <span class="role-tab-label">Operation<br>Managers</span>
          <span class="role-tab-count">({{ farmersByRole.operation_manager.length }})</span>
        </button>
        <button 
          @click="activeRole = 'business_manager'" 
          :class="['role-tab', { 'active': activeRole === 'business_manager' }]"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="role-tab-icon" alt="" />
          <span class="role-tab-label">Business<br>Managers</span>
          <span class="role-tab-count">({{ farmersByRole.business_manager.length }})</span>
        </button>
        <button 
          @click="activeRole = 'farmer'" 
          :class="['role-tab', { 'active': activeRole === 'farmer' }]"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/7417/7417717.png" class="role-tab-icon" alt="" />
          <span class="role-tab-label">Farmers</span>
          <span class="role-tab-count">({{ farmersByRole.farmer.length }})</span>
        </button>
        <button 
          @click="activeRole = 'admin'" 
          :class="['role-tab', { 'active': activeRole === 'admin' }]"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/6024/6024190.png" class="role-tab-icon" alt="" />
          <span class="role-tab-label">Admins</span>
          <span class="role-tab-count">({{ farmersByRole.admin.length }})</span>
        </button>
        <button 
          @click="activeRole = 'president'" 
          :class="['role-tab', { 'active': activeRole === 'president' }]"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/3048/3048127.png" class="role-tab-icon" alt="" />
          <span class="role-tab-label">Presidents</span>
          <span class="role-tab-count">({{ farmersByRole.president.length }})</span>
        </button>
        <button 
          @click="activeRole = 'treasurer'" 
          :class="['role-tab', { 'active': activeRole === 'treasurer' }]"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/2534/2534844.png" class="role-tab-icon" alt="" />
          <span class="role-tab-label">Treasurers</span>
          <span class="role-tab-count">({{ farmersByRole.treasurer.length }})</span>
        </button>
        <button 
          @click="activeRole = 'auditor'" 
          :class="['role-tab', { 'active': activeRole === 'auditor' }]"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/2621/2621303.png" class="role-tab-icon" alt="" />
          <span class="role-tab-label">Auditors</span>
          <span class="role-tab-count">({{ farmersByRole.auditor.length }})</span>
        </button>
        <button 
          @click="activeRole = 'operator'" 
          :class="['role-tab', { 'active': activeRole === 'operator' }]"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/4149/4149682.png" class="role-tab-icon" alt="" />
          <span class="role-tab-label">Operators</span>
          <span class="role-tab-count">({{ farmersByRole.operator.length }})</span>
        </button>
        <button 
          @click="activeRole = 'agriculturist'" 
          :class="['role-tab', { 'active': activeRole === 'agriculturist' }]"
        >
          <img src="https://cdn-icons-png.flaticon.com/512/2810/2810051.png" class="role-tab-icon" alt="" />
          <span class="role-tab-label">Agriculturists</span>
          <span class="role-tab-count">({{ farmersByRole.agriculturist.length }})</span>
        </button>
      </div>

      <!-- Table for selected role -->
      <div class="overflow-x-auto" style="max-height: 600px; overflow-y: auto;">
        <table class="members-table w-full border-collapse text-sm">
          <colgroup>
            <col style="width: 92px;" />
            <col style="width: 140px;" />
            <col style="width: 220px;" />
            <col style="width: 130px;" />
            <col style="width: 200px;" />
            <col style="width: 150px;" />
            <col style="width: 175px;" />
            <col style="width: 140px;" />
            <col style="width: 150px;" />
            <col style="width: 130px;" />
            <col style="width: 120px;" />
            <col style="width: 220px;" />
          </colgroup>
          <thead>
            <tr class="bg-green-50">
              <th class="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">Photo</th>
              <th class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">Ref #</th>
              <th class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
              <th class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">DOB</th>
              <th class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">Address</th>
              <th class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
              <th class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">Education</th>
              <th class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">Role</th>
              <th class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">Member Status</th>
              <th class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">Registered</th>
              <th class="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
              <th class="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="currentRoleFarmers.length === 0">
              <td colspan="12" class="border border-gray-300 px-2 py-2 text-center text-xs text-gray-500">
                No {{ activeRole }}s registered yet.
              </td>
            </tr>
            <tr v-for="farmer in currentRoleFarmers" :key="farmer.id" class="hover:bg-gray-50 transition-colors">
              <td class="border border-gray-300 px-2 py-2 text-center">
                <div class="flex flex-col items-center gap-1">
                  <div class="relative member-avatar-wrap">
                    <img 
                      v-if="farmer.profile_picture" 
                      :src="getProfilePictureUrl(farmer.profile_picture)" 
                      alt="Profile" 
                      class="member-avatar"
                    />
                    <div v-else class="member-avatar member-avatar-fallback">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-gray-400">
                        <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <button 
                      v-if="editingId === farmer.id"
                      @click="openEditPictureModal(farmer)"
                      class="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition"
                      title="Change photo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </td>
              <td class="border border-gray-300 px-2 py-2">{{ farmer.reference_number }}</td>
              <td class="border border-gray-300 px-2 py-2">
                <input 
                  v-if="editingId === farmer.id"
                  v-model="editForm.full_name"
                  type="text"
                  class="edit-input"
                />
                <span v-else class="font-medium">{{ farmer.full_name }}</span>
              </td>
              <td class="border border-gray-300 px-4 py-3">
                <input 
                  v-if="editingId === farmer.id"
                  v-model="editForm.date_of_birth"
                  type="date"
                  class="edit-input"
                />
                <span v-else>{{ formatDate(farmer.date_of_birth) }}</span>
              </td>
              <td class="border border-gray-300 px-4 py-3">
                <select 
                  v-if="editingId === farmer.id"
                  v-model.number="editForm.barangay_id"
                  class="edit-input"
                >
                  <option :value="null" disabled>Select Barangay</option>
                  <option v-for="barangay in barangays" :key="barangay.id" :value="barangay.id">
                    {{ barangay.name }}
                  </option>
                </select>
                <span v-else>{{ farmer.barangay_name || farmer.address }}</span>
              </td>
              <td class="border border-gray-300 px-4 py-3">
                <input 
                  v-if="editingId === farmer.id"
                  v-model="editForm.phone_number"
                  type="text"
                  class="edit-input"
                />
                <span v-else>{{ farmer.phone_number }}</span>
              </td>
              <td class="border border-gray-300 px-4 py-3">
                <select 
                  v-if="editingId === farmer.id"
                  v-model="editForm.educational_status"
                  class="edit-input"
                >
                  <option value="">Select</option>
                  <option value="No Formal Education">No Formal Education</option>
                  <option value="Elementary Level">Elementary Level</option>
                  <option value="Elementary Graduate">Elementary Graduate</option>
                  <option value="High School Level">High School Level</option>
                  <option value="High School Graduate">High School Graduate</option>
                  <option value="Vocational">Vocational</option>
                  <option value="College Level">College Level</option>
                  <option value="College Graduate">College Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                </select>
                <span v-else>{{ farmer.educational_status || 'N/A' }}</span>
              </td>
              <td class="border border-gray-300 px-4 py-3">
                <select 
                  v-if="editingId === farmer.id && farmer.role !== 'admin' && (farmer.membership_status || 'member') !== 'non-member'"
                  v-model="editForm.role"
                  class="edit-input"
                >
                  <option value="farmer">Farmer</option>
                  <option value="admin">Admin</option>
                  <option value="president">President</option>
                  <option value="treasurer">Treasurer</option>
                  <option value="auditor">Auditor</option>
                  <option value="operator">Operator</option>
                  <option value="operation_manager">Operation Manager</option>
                  <option value="business_manager">Business Manager</option>
                  <option value="agriculturist">Agriculturist</option>
                </select>
                <span v-else class="role-badge" :class="farmer.role">{{ farmer.role }}</span>
              </td>
              <td class="border border-gray-300 px-4 py-3">
                <select 
                  v-if="editingId === farmer.id"
                  v-model="editForm.membership_status"
                  class="edit-input"
                >
                  <option value="member">✓ Member</option>
                  <option value="non-member">✗ Non-Member</option>
                </select>
                <span v-else>
                  <span v-if="(farmer.membership_status || 'member') === 'member'" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ✓ Member
                  </span>
                  <span v-else class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    ✗ Non-Member
                  </span>
                </span>
              </td>
              <td class="border border-gray-300 px-4 py-3">{{ formatDate(farmer.registered_on) }}</td>
              <td class="border border-gray-300 px-4 py-3">
                <span v-if="farmer.status === 'approved'" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Approved
                </span>
                <span v-else-if="farmer.status === 'rejected'" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Rejected
                </span>
              </td>
              <td class="border border-gray-300 px-4 py-3 text-center">
                <div class="flex gap-2 justify-center">
                  <template v-if="editingId === farmer.id">
                    <button @click="saveEdit(farmer)" class="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-sm">
                      Save
                    </button>
                    <button @click="cancelEdit" class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm">
                      Cancel
                    </button>
                  </template>
                  <template v-else>
                    <button @click="viewDetails(farmer)" class="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition text-sm">
                      View
                    </button>
                    <button @click="startEdit(farmer)" class="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm">
                      Edit
                    </button>
                    <button 
                      v-if="farmer.role !== 'admin'"
                      @click="deleteFarmer(farmer)" 
                      class="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
                    >
                      Delete
                    </button>
                    <span 
                      v-else
                      class="px-3 py-1 bg-gray-100 text-gray-400 rounded text-sm cursor-not-allowed"
                      title="Admin accounts cannot be deleted"
                    >
                      Protected
                    </span>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Member Details</h3>
          <button @click="closeDetailsModal" class="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedFarmer">
          <div class="flex flex-col items-center mb-6">
            <img 
              v-if="selectedFarmer.profile_picture" 
              :src="getProfilePictureUrl(selectedFarmer.profile_picture)" 
              alt="Profile Picture" 
              class="rounded-full object-cover border-4 border-green-500 shadow-lg"
              style="width: 100px; height: 100px; min-width: 100px; min-height: 100px;"
            />
            <div v-else class="rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl border-4 border-gray-300" style="width: 100px; height: 100px; min-width: 100px; min-height: 100px;">
              👤
            </div>
            <h4 class="member-name">{{ selectedFarmer.full_name }}</h4>
            <span class="role-badge mt-2" :class="selectedFarmer.role">{{ selectedFarmer.role }}</span>
          </div>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Reference Number:</span>
              <span class="detail-value">{{ selectedFarmer.reference_number }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date of Birth:</span>
              <span class="detail-value">{{ formatDate(selectedFarmer.date_of_birth) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Address:</span>
              <span class="detail-value">{{ selectedFarmer.address }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Phone Number:</span>
              <span class="detail-value">{{ selectedFarmer.phone_number }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Educational Status:</span>
              <span class="detail-value">{{ selectedFarmer.educational_status || 'Not specified' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Registered On:</span>
              <span class="detail-value">{{ formatDate(selectedFarmer.registered_on) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                <span v-if="selectedFarmer.status === 'approved'" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Approved
                </span>
                <span v-else-if="selectedFarmer.status === 'rejected'" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  ✗ Rejected
                </span>
                <span v-else class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  ⏳ Pending
                </span>
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailsModal" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Edit Profile Picture Modal -->
    <div v-if="showEditPictureModal" class="modal-overlay" @click="closeEditPictureModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-2xl font-bold text-gray-800">📷 Update Profile Picture</h3>
          <button @click="closeEditPictureModal" class="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>
        <div class="modal-body" v-if="selectedFarmer">
          <div class="flex flex-col items-center">
            <div class="relative mb-4">
              <img 
                v-if="profilePicturePreview" 
                :src="profilePicturePreview" 
                alt="Preview" 
                class="w-40 h-40 rounded-full object-cover border-4 border-green-500"
              />
              <img 
                v-else-if="selectedFarmer.profile_picture" 
                :src="getProfilePictureUrl(selectedFarmer.profile_picture)" 
                alt="Current" 
                class="w-40 h-40 rounded-full object-cover border-4 border-gray-300"
              />
              <div v-else class="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-5xl border-4 border-gray-300">
                👤
              </div>
            </div>
            <label class="btn-primary cursor-pointer">
              📁 Choose Photo
              <input 
                type="file" 
                ref="profilePictureInput"
                @change="handleProfilePictureSelect" 
                accept="image/jpeg,image/png,image/gif"
                class="hidden"
              />
            </label>
            <p class="text-xs text-gray-500 mt-2">Max 5MB - JPEG, PNG, GIF only</p>
            <p v-if="uploadError" class="text-sm text-red-600 mt-2">{{ uploadError }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditPictureModal" class="btn-secondary">Cancel</button>
          <button 
            @click="uploadProfilePicture" 
            class="btn-primary"
            :disabled="!selectedProfilePicture || uploading"
          >
            <span v-if="uploading">Uploading...</span>
            <span v-else>💾 Save Photo</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineProps, defineEmits } from 'vue'
import { useFarmerStore } from '../stores/farmerStore'
import { useAuthStore } from '../stores/authStore'

const farmerStore = useFarmerStore()
const authStore = useAuthStore()

// Emits
const emit = defineEmits(['member-updated', 'member-deleted'])

// Props from parent
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
  },
  userBarangayId: {
    type: Number,
    default: null
  },
  isPresident: {
    type: Boolean,
    default: false
  }
})

const internalFarmers = ref([])
const barangays = ref([])
const internalLoading = ref(false)
const internalError = ref(null)
const activeRole = ref('farmer')
const editingId = ref(null)
const editForm = ref({
  full_name: '',
  date_of_birth: '',
  address: '',
  phone_number: '',
  educational_status: '',
  role: '',
  membership_status: 'member',
  barangay_id: null
})

// Modal states
const showDetailsModal = ref(false)
const showEditPictureModal = ref(false)
const selectedFarmer = ref(null)

// Profile picture upload states
const profilePictureInput = ref(null)
const selectedProfilePicture = ref(null)
const profilePicturePreview = ref(null)
const uploadError = ref('')
const uploading = ref(false)

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

// Use farmers from props if provided, otherwise use internalFarmers
const displayFarmers = computed(() => {
  if (props.farmers && props.farmers.length > 0) {
    return props.farmers
  }
  return internalFarmers.value
})

// Use loading/error from props if provided
const displayLoading = computed(() => {
  return props.loading !== null ? props.loading : internalLoading.value
})

const displayError = computed(() => {
  return props.error || internalError.value
})

const farmersByRole = computed(() => {
  return {
    farmer: displayFarmers.value.filter(f => f.role === 'farmer'),
    admin: displayFarmers.value.filter(f => f.role === 'admin'),
    president: displayFarmers.value.filter(f => f.role === 'president'),
    treasurer: displayFarmers.value.filter(f => f.role === 'treasurer'),
    auditor: displayFarmers.value.filter(f => f.role === 'auditor'),
    operator: displayFarmers.value.filter(f => f.role === 'operator'),
    agriculturist: displayFarmers.value.filter(f => f.role === 'agriculturist'),
    operation_manager: displayFarmers.value.filter(f => f.role === 'operation_manager'),
    business_manager: displayFarmers.value.filter(f => f.role === 'business_manager')
  }
})

const currentRoleFarmers = computed(() => {
  return farmersByRole.value[activeRole.value] || []
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const startEdit = (farmer) => {
  editingId.value = farmer.id
  editForm.value = {
    full_name: farmer.full_name,
    date_of_birth: farmer.date_of_birth?.split('T')[0] || '',
    address: farmer.address,
    phone_number: farmer.phone_number,
    educational_status: farmer.educational_status || '',
    role: farmer.role,
    membership_status: farmer.membership_status || 'member',
    barangay_id: farmer.barangay_id || null
  }
}

const cancelEdit = () => {
  editingId.value = null
  editForm.value = {
    full_name: '',
    date_of_birth: '',
    address: '',
    phone_number: '',
    educational_status: '',
    role: '',
    membership_status: 'member',
    barangay_id: null
  }
}

const saveEdit = async (farmer) => {
  if (!confirm(`Are you sure you want to update ${farmer.full_name}'s information?`)) {
    return
  }

  try {
    // Find the selected barangay name
    const selectedBarangay = barangays.value.find(b => b.id === editForm.value.barangay_id)
    const barangayName = selectedBarangay ? selectedBarangay.name : editForm.value.address

    const updateData = {
      full_name: editForm.value.full_name,
      address: barangayName,
      phone_number: editForm.value.phone_number,
      educational_status: editForm.value.educational_status,
      barangay_id: editForm.value.barangay_id
    }

    // Update basic info
    const response = await fetch(`/api/farmers/${farmer.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) throw new Error('Failed to update profile')

    // Update role if changed and not admin
    if (editForm.value.role !== farmer.role && farmer.role !== 'admin') {
      const roleResponse = await fetch(`/api/farmers/${farmer.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editForm.value.role })
      })
      
      if (!roleResponse.ok) throw new Error('Failed to update role')
    }

    // Update membership status if changed
    if (editForm.value.membership_status !== farmer.membership_status) {
      const token = authStore.token
      const statusResponse = await fetch(`/api/farmers/${farmer.id}/membership-status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ membership_status: editForm.value.membership_status })
      })
      
      if (!statusResponse.ok) throw new Error('Failed to update membership status')
    }

    // Update local data
    const index = internalFarmers.value.findIndex(f => f.id === farmer.id)
    if (index !== -1) {
      internalFarmers.value[index] = {
        ...internalFarmers.value[index],
        ...updateData,
        role: editForm.value.role,
        membership_status: editForm.value.membership_status,
        barangay_id: editForm.value.barangay_id,
        barangay_name: barangayName
      }
    }

    cancelEdit()
    emit('member-updated', farmer.id)
    alert('Member information updated successfully!')
  } catch (err) {
    alert('Error updating member: ' + err.message)
  }
}

const deleteFarmer = async (farmer) => {
  if (!confirm(`Are you sure you want to delete ${farmer.full_name}? This action cannot be undone.`)) {
    return
  }
  
  try {
    const result = await farmerStore.deleteFarmer(farmer.id)
    if (result.success) {
      internalFarmers.value = internalFarmers.value.filter(f => f.id !== farmer.id)
      emit('member-deleted', farmer.id)
      alert('Member deleted successfully!')
    } else {
      alert('Failed to delete member: ' + result.message)
    }
  } catch (err) {
    alert('Error deleting member: ' + err.message)
  }
}

const viewDetails = (farmer) => {
  selectedFarmer.value = farmer
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedFarmer.value = null
}

const openEditPictureModal = (farmer) => {
  selectedFarmer.value = farmer
  selectedProfilePicture.value = null
  profilePicturePreview.value = null
  uploadError.value = ''
  showEditPictureModal.value = true
}

const closeEditPictureModal = () => {
  showEditPictureModal.value = false
  selectedFarmer.value = null
  selectedProfilePicture.value = null
  profilePicturePreview.value = null
  uploadError.value = ''
}

const handleProfilePictureSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'File size must be less than 5MB'
    selectedProfilePicture.value = null
    profilePicturePreview.value = null
    return
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    uploadError.value = 'Only JPEG, PNG, and GIF images are allowed'
    selectedProfilePicture.value = null
    profilePicturePreview.value = null
    return
  }

  uploadError.value = ''
  selectedProfilePicture.value = file
  profilePicturePreview.value = URL.createObjectURL(file)
}

const uploadProfilePicture = async () => {
  if (!selectedProfilePicture.value || !selectedFarmer.value) return

  uploading.value = true
  uploadError.value = ''

  try {
    const formData = new FormData()
    formData.append('profile_picture', selectedProfilePicture.value)

    const response = await fetch(`http://localhost:3000/api/farmers/${selectedFarmer.value.id}/profile-picture`, {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to upload profile picture')
    }

    // Update local farmer data
    const farmerIndex = internalFarmers.value.findIndex(f => f.id === selectedFarmer.value.id)
    if (farmerIndex !== -1) {
      internalFarmers.value[farmerIndex].profile_picture = data.profile_picture
    }

    alert('Profile picture updated successfully!')
    closeEditPictureModal()
  } catch (error) {
    uploadError.value = error.message || 'Failed to upload profile picture'
  } finally {
    uploading.value = false
  }
}

onMounted(async () => {
  // Only load farmers if they weren't provided as props
  if (!props.farmers || props.farmers.length === 0) {
    internalLoading.value = true
    internalError.value = null
    try {
      // Fetch farmers
      const data = await farmerStore.getAllFarmers()
      // Only show approved farmers, exclude rejected
      internalFarmers.value = data.filter(f => f.status === 'approved')
      
      // Fetch barangays
      const response = await fetch('/api/barangays')
      if (response.ok) {
        const barangayData = await response.json()
        barangays.value = barangayData.barangays || []
      }
    } catch (err) {
      internalError.value = err.message || 'Failed to load members'
    } finally {
      internalLoading.value = false
    }
  } else {
    // Farmers were provided as props, just load barangays
    try {
      const response = await fetch('/api/barangays')
      if (response.ok) {
        const barangayData = await response.json()
        barangays.value = barangayData.barangays || []
      }
    } catch (err) {
      // Barangay loading is not critical
      console.error('Error loading barangays:', err)
    }
  }
})
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

.members-table {
  min-width: 1840px;
}

/* Member avatar in table */
.member-avatar-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center top;
  border: 2.5px solid rgba(74, 222, 128, 0.70);
  box-shadow:
    0 0 0 3px rgba(74, 222, 128, 0.12),
    0 3px 10px rgba(0, 0, 0, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: block;
}

.member-avatar:hover {
  transform: scale(1.12);
  box-shadow:
    0 0 0 4px rgba(74, 222, 128, 0.25),
    0 6px 18px rgba(0, 0, 0, 0.45);
}

.member-avatar-fallback {
  background: linear-gradient(135deg, rgba(30, 50, 38, 0.9), rgba(20, 36, 28, 0.95));
  border: 2px solid rgba(122, 171, 140, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.members-table th,
.members-table td {
  color: #000000 !important;
  text-align: center !important;
}

.members-table td:last-child .flex {
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.members-table td:last-child .flex button,
.members-table td:last-child .flex span {
  width: 100%;
  text-align: center;
}

.role-tabs {
  display: flex;
  gap: 6px;
  background: linear-gradient(145deg, rgba(14,25,19,0.97), rgba(10,19,15,0.96));
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(122,171,140,0.20);
  flex-wrap: wrap;
}

.role-tab {
  flex: 1;
  min-width: 80px;
  padding: 10px 8px 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(122,171,140,0.15);
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s ease;
  color: rgba(220,252,231,0.70);
  font-size: 11px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  line-height: 1.3;
  text-align: center;
}

.role-tab-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4)) brightness(1.05);
  transition: transform 0.22s ease, filter 0.22s ease;
}

.role-tab-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: rgba(220,252,231,0.80);
  line-height: 1.3;
}

.role-tab-count {
  font-size: 10px;
  font-weight: 600;
  color: rgba(134,239,172,0.65);
}

.role-tab:hover {
  background: rgba(74,222,128,0.10);
  border-color: rgba(134,239,172,0.35);
  color: #ecfdf5;
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0,0,0,0.25);
}

.role-tab:hover .role-tab-icon {
  transform: scale(1.12);
  filter: drop-shadow(0 2px 6px rgba(74,222,128,0.35)) brightness(1.1);
}

.role-tab:hover .role-tab-label {
  color: #ecfdf5;
}

.role-tab.active {
  background: linear-gradient(135deg, rgba(22,163,74,0.55) 0%, rgba(16,120,54,0.65) 100%);
  border-color: rgba(74,222,128,0.45);
  color: white;
  box-shadow: 0 4px 16px rgba(16,185,129,0.30), inset 0 1px 0 rgba(255,255,255,0.08);
  transform: translateY(-1px);
}

.role-tab.active .role-tab-icon {
  filter: drop-shadow(0 2px 8px rgba(74,222,128,0.50)) brightness(1.15);
  transform: scale(1.08);
}

.role-tab.active .role-tab-label {
  color: #ecfdf5;
}

.role-tab.active .role-tab-count {
  color: rgba(134,239,172,0.90);
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.role-badge.farmer {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.admin {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.treasurer {
  background: #fce7f3;
  color: #9f1239;
}

.role-badge.president {
  background: #e0e7ff;
  color: #4338ca;
}

.role-badge.auditor {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.operator {
  background: #e0f2fe;
  color: #075985;
}

.role-badge.agriculturist {
  background: #dcfce7;
  color: #166534;
}

.edit-input {
  width: 100%;
  padding: 6px 10px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.edit-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

@media (max-width: 768px) {
  .role-tabs {
    flex-direction: column;
  }

  .role-tab {
    width: 100%;
  }
}

/* Modal Styles */
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
  padding: 20px;
}

.modal-content {
  background: linear-gradient(145deg, rgba(5, 46, 22, 0.82), rgba(20, 83, 45, 0.78));
  border: 1px solid rgba(74, 222, 128, 0.35);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 1px 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  color: #ffffff;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(74, 222, 128, 0.3);
}

.modal-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff !important;
  letter-spacing: 0.4px;
}

.modal-header button {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 28px;
  line-height: 1;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.modal-header button:hover {
  color: #ffffff !important;
}

.member-name {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-top: 12px;
  letter-spacing: 0.2px;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid rgba(74, 222, 128, 0.3);
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(187, 247, 208, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 2px;
}

.detail-value {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
  line-height: 1.5;
}

.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.22);
}
</style>
