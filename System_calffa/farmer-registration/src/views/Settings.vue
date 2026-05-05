<template>
  <div class="edit-profile-page glass-module-page">
    <div class="profile-card">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-avatar-section">
          <div class="avatar-wrapper">
            <img 
              v-if="profilePictureUrl" 
              :src="profilePictureUrl" 
              alt="Profile" 
              class="avatar-img"
            />
            <span v-else class="avatar-placeholder">{{ userInitials }}</span>
            <label class="avatar-upload-btn" title="Change Photo">
              📷
              <input 
                type="file" 
                ref="profilePictureInput"
                @change="handleProfilePictureChange" 
                accept="image/jpeg,image/png,image/gif"
                class="hidden"
              />
            </label>
          </div>
          <p v-if="uploadMessage" class="upload-msg" :class="uploadMessageType">{{ uploadMessage }}</p>
        </div>
        <div class="profile-header-info">
          <h1 class="profile-name">{{ profile.full_name || 'Your Name' }}</h1>
          <p class="profile-ref">{{ profile.reference_number }}</p>
          <p class="profile-barangay">📍 {{ profile.barangay_name || profile.address || 'No barangay assigned' }}</p>
        </div>
      </div>

      <!-- Edit Form -->
      <form @submit.prevent="saveProfile" class="profile-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Full Name</label>
            <input
              type="text"
              v-model="profile.full_name"
              required
              placeholder="Enter your full name"
            />
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              v-model="profile.phone_number"
              placeholder="Enter phone number"
            />
          </div>
          <div class="form-group">
            <label>Educational Status</label>
            <select v-model="profile.educational_status">
              <option value="" disabled>Select Educational Status</option>
              <option value="Elementary">Elementary</option>
              <option value="High School">High School</option>
              <option value="Senior High School">Senior High School</option>
              <option value="Vocational">Vocational</option>
              <option value="College">College</option>
              <option value="Post Graduate">Post Graduate</option>
              <option value="None">None</option>
            </select>
          </div>
          <div class="form-group">
            <label>Address</label>
            <input
              type="text"
              v-model="profile.address"
              placeholder="Enter your street address"
            />
          </div>
        </div>

        <div class="readonly-section">
          <div class="readonly-field">
            <label>Reference Number</label>
            <span>{{ profile.reference_number }}</span>
          </div>
          <div class="readonly-field">
            <label>Barangay</label>
            <span>{{ profile.barangay_name || profile.address || '—' }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="save-btn" :disabled="saving">
            <span v-if="saving">Saving...</span>
            <span v-else>Save Changes</span>
          </button>
        </div>
        <p v-if="message" class="form-message" :class="messageType">{{ message }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const userInitials = computed(() => {
  const name = profile.value.full_name || ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

// Profile state
const profile = ref({
  full_name: authStore.currentUser?.full_name || '',
  phone_number: authStore.currentUser?.phone_number || '',
  educational_status: authStore.currentUser?.educational_status || '',
  reference_number: authStore.currentUser?.reference_number || '',
  address: authStore.currentUser?.address || authStore.currentUser?.barangay_name || '',
  barangay_name: authStore.currentUser?.barangay_name || ''
})

const saving = ref(false)
const message = ref('')
const messageType = ref('')

// Profile picture state
const profilePictureInput = ref(null)
const profilePictureFile = ref(null)
const uploadMessage = ref('')
const uploadMessageType = ref('')
const uploading = ref(false)

// Computed property for profile picture URL
const profilePictureUrl = computed(() => {
  if (profilePictureFile.value) {
    return URL.createObjectURL(profilePictureFile.value)
  }
  if (authStore.currentUser?.profile_picture) {
    const pictureUrl = authStore.currentUser.profile_picture
    // Check if it's already a full URL (Google profile pictures are https://)
    if (pictureUrl.startsWith('http://') || pictureUrl.startsWith('https://')) {
      return pictureUrl
    }
    // Otherwise, prepend localhost for uploaded pictures
    return `http://localhost:3000${pictureUrl}`
  }
  return null
})

const handleProfilePictureChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    uploadMessage.value = 'File size must be less than 5MB'
    uploadMessageType.value = 'text-red-600'
    return
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    uploadMessage.value = 'Only JPEG, PNG, and GIF images are allowed'
    uploadMessageType.value = 'text-red-600'
    return
  }

  profilePictureFile.value = file
  await uploadProfilePicture()
}

const uploadProfilePicture = async () => {
  if (!profilePictureFile.value) return

  uploading.value = true
  uploadMessage.value = 'Uploading...'
  uploadMessageType.value = 'text-blue-600'

  try {
    const userId = authStore.currentUser?.id
    if (!userId) {
      throw new Error('User ID not found')
    }

    const formData = new FormData()
    formData.append('profile_picture', profilePictureFile.value)

    const response = await fetch(`http://localhost:3000/api/farmers/${userId}/profile-picture`, {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to upload profile picture')
    }

    // Update authStore with new profile picture
    authStore.currentUser.profile_picture = data.profile_picture
    localStorage.setItem('currentUser', JSON.stringify(authStore.currentUser))

    uploadMessage.value = 'Profile picture updated successfully!'
    uploadMessageType.value = 'text-green-600'

    // Clear message after 3 seconds
    setTimeout(() => {
      uploadMessage.value = ''
    }, 3000)
  } catch (error) {
    uploadMessage.value = error.message || 'Failed to upload profile picture'
    uploadMessageType.value = 'text-red-600'
    profilePictureFile.value = null
  } finally {
    uploading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  message.value = ''
  try {
    const userId = authStore.currentUser?.id
    if (!userId) {
      throw new Error('User ID not found')
    }

    const response = await fetch(`http://localhost:3000/api/farmers/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: profile.value.full_name,
        phone_number: profile.value.phone_number,
        educational_status: profile.value.educational_status,
        address: profile.value.address
      })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update profile')
    }

    // Update local authStore with the returned data
    authStore.currentUser = { ...authStore.currentUser, ...data.farmer }
    localStorage.setItem('currentUser', JSON.stringify(authStore.currentUser))
    
    message.value = 'Profile updated successfully!'
    messageType.value = 'text-green-600'
    
    // Clear message after 3 seconds
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error) {
    message.value = error.message || 'Failed to update profile.'
    messageType.value = 'text-red-600'
  } finally {
    saving.value = false
  }
}

const fetchUserProfile = async () => {
  try {
    const userId = authStore.currentUser?.id
    if (!userId) {
      console.warn('User ID not found, skipping profile fetch')
      return
    }

    const response = await fetch(`http://localhost:3000/api/farmers/${userId}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      console.error('Failed to fetch profile:', response.statusText)
      return
    }

    const data = await response.json()
    
    if (data.success && data.farmer) {
      const farmer = data.farmer
      
      // Update profile with fresh data from server
      profile.value = {
        full_name: farmer.full_name || '',
        phone_number: farmer.phone_number || '',
        educational_status: farmer.educational_status || '',
        reference_number: farmer.reference_number || '',
        address: farmer.address || '',
        barangay_name: farmer.barangay_name || ''
      }
      
      // Update authStore with fresh data for future use
      authStore.currentUser = {
        ...authStore.currentUser,
        phone_number: farmer.phone_number,
        educational_status: farmer.educational_status,
        address: farmer.address,
        profile_picture: farmer.profile_picture,
        barangay_name: farmer.barangay_name,
        email: farmer.email
      }
      localStorage.setItem('currentUser', JSON.stringify(authStore.currentUser))
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
  }
}

onMounted(async () => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }
  
  // Fetch fresh profile data from server to ensure all fields are populated
  await fetchUserProfile()
})
</script>

<style scoped>
.edit-profile-page {
  padding: 0.85rem 1.1rem;
  max-width: 760px;
  margin: 0 auto;
  min-height: calc(100vh - 72px);
  height: calc(100vh - 72px);
  overflow: hidden;
  display: flex;
  align-items: center;
}

.profile-card {
  background: linear-gradient(180deg, #f7fffb 0%, #effaf5 100%);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(6, 24, 17, 0.2);
  border: 1px solid rgba(110, 231, 183, 0.32);
  overflow: hidden;
  width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header */
.profile-header {
  background: linear-gradient(132deg, #0f5132 0%, #15803d 55%, #1d7b46 100%);
  padding: 2.1rem 2rem 1.6rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  color: #fff;
  border-bottom: 1px solid rgba(209, 250, 229, 0.35);
}

.avatar-wrapper {
  position: relative;
  width: 92px;
  height: 92px;
  flex-shrink: 0;
}

.avatar-img {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 10px 18px rgba(4, 12, 8, 0.25);
}

.avatar-placeholder {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 3px solid rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.95rem;
  font-weight: 800;
  color: #fff;
  box-shadow: 0 10px 18px rgba(4, 12, 8, 0.25);
}

.avatar-upload-btn {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.22);
  transition: transform 0.18s, box-shadow 0.2s;
}

.avatar-upload-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.28);
}

.avatar-upload-btn input { display: none; }

.upload-msg {
  font-size: 0.8rem;
  margin-top: 0.35rem;
  font-weight: 700;
}

.profile-header-info {
  flex: 1;
  min-width: 0;
}

.profile-header-info .profile-name {
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.profile-header-info .profile-ref {
  font-size: 1.02rem;
  opacity: 0.92;
  margin: 0.22rem 0 0;
  font-weight: 700;
}

.profile-header-info .profile-barangay {
  font-size: 1rem;
  opacity: 0.95;
  margin: 0.35rem 0 0;
  font-weight: 600;
}

/* Form */
.profile-form {
  padding: 1.25rem 1.5rem 1.35rem;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.95rem 1rem;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: #14532d;
  margin-bottom: 0.45rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.88rem 0.95rem;
  border: 1px solid #b7dfc9;
  border-radius: 14px;
  font-size: 1rem;
  color: #0f172a;
  background: #fdfefe;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
  transform: translateY(-1px);
}

/* Read-only section */
.readonly-section {
  margin-top: 1rem;
  padding-top: 0.95rem;
  border-top: 1px solid #d7eee1;
  display: flex;
  gap: 1rem;
}

.readonly-field {
  flex: 1;
  background: #f5fffa;
  border: 1px solid #d2f3de;
  border-radius: 12px;
  padding: 0.85rem 0.95rem;
}

.readonly-field label {
  display: block;
  font-size: 0.76rem;
  font-weight: 700;
  color: #166534;
  margin-bottom: 0.28rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.readonly-field span {
  font-size: 1.1rem;
  color: #14532d;
  font-weight: 800;
}

/* Actions */
.form-actions {
  margin-top: 1rem;
}

.save-btn {
  width: 100%;
  padding: 0.95rem;
  background: linear-gradient(135deg, #d08a4d 0%, #90b266 46%, #4bb676 100%);
  color: #fff;
  font-weight: 800;
  font-size: 1.15rem;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s, filter 0.2s, box-shadow 0.2s;
  box-shadow: 0 14px 22px rgba(14, 116, 68, 0.22);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.03);
  box-shadow: 0 18px 26px rgba(14, 116, 68, 0.28);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-message {
  text-align: center;
  font-size: 0.94rem;
  font-weight: 700;
  margin-top: 0.82rem;
}

.text-green-600 { color: #16a34a; }
.text-red-600 { color: #dc2626; }
.text-blue-600 { color: #2563eb; }

.hidden { display: none; }

@media (max-width: 640px) {
  .edit-profile-page {
    padding: 0.9rem;
    min-height: auto;
    height: auto;
    overflow: visible;
  }
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem 1.5rem 1.25rem;
  }
  .profile-header-info .profile-name {
    font-size: 1.55rem;
  }
  .profile-form {
    padding: 1.25rem 1.5rem 1.5rem;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }
  .readonly-section {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
