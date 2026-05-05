<template>
  <div class="google-registration-page">
    <!-- Progress Indicator -->
    <div class="progress-bar">
      <div class="progress-step completed">
        <div class="step-number">1</div>
        <span>Google Login</span>
      </div>
      <div class="progress-line"></div>
      <div class="progress-step active">
        <div class="step-number">2</div>
        <span>Complete Profile</span>
      </div>
      <div class="progress-line"></div>
      <div class="progress-step">
        <div class="step-number">3</div>
        <span>Review & Submit</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="registration-container">
      <div class="registration-header">
        <img v-if="profilePicture" :src="profilePicture" alt="Profile" class="profile-picture" />
        <h1>Complete Your Profile</h1>
        <p class="subtitle">Google account verified. Please complete your registration.</p>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="successMessage" class="message success-message">
        ✓ {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="message error-message">
        ✗ {{ errorMessage }}
      </div>

      <!-- Registration Form -->
      <form @submit.prevent="submitRegistration" class="registration-form">
        <!-- Pre-filled Fields -->
        <div class="form-section">
          <h3 class="section-title">Google Information</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label>Full Name</label>
              <input v-model="formData.full_name" type="text" required class="form-input" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="formData.email" type="email" disabled class="form-input disabled" />
            </div>
          </div>

          <div class="form-group">
            <label class="required">Reference Number</label>
            <input
              v-model="formData.reference_number"
              type="text"
              required
              class="form-input"
              placeholder="Enter your reference ID"
            />
          </div>
        </div>

        <!-- Required Fields Section -->
        <div class="form-section">
          <h3 class="section-title">Required Information</h3>

          <!-- Phone Number -->
<div class="form-group">
  <label class="required">Phone Number</label>
  <input
    v-model="formData.phone_number"
    type="tel"
    placeholder="09XXXXXXXXX"
    required
    class="form-input"
    maxlength="11"
    pattern="[0-9]{11}"
    inputmode="numeric"
    @input="formData.phone_number = formData.phone_number.replace(/[^0-9]/g, '').slice(0,11)"
    @blur="validatePhoneNumber"
  />
  <small v-if="errors.phone_number" class="form-error">{{ errors.phone_number }}</small>
  <small class="form-help">Must be exactly 11 digits (Philippine format)</small>
</div>

          <!-- Date of Birth -->
          <div class="form-group">
            <label class="required">Date of Birth</label>
            <input
              v-model="formData.date_of_birth"
              type="date"
              :max="getMaxDateOfBirth()"
              required
              class="form-input"
            />
            <small class="form-help">You must be at least 18 years old</small>
          </div>

          <!-- Address -->
          <div class="form-group">
            <label class="required">Address</label>
            <input
              v-model="formData.address"
              type="text"
              placeholder="Enter your complete address"
              required
              class="form-input"
            />
          </div>

          <!-- Educational Status -->
          <div class="form-group">
            <label class="required">Educational Status</label>
            <select v-model="formData.educational_status" required class="form-input">
              <option value="">Select educational status</option>
              <option value="Elementary Level">Elementary Level</option>
<option value="Elementary Graduate">Elementary Graduate</option>

<option value="High School Level">High School Level</option>
<option value="High School Graduate">High School Graduate</option>

<option value="Vocational">Vocational</option>

<option value="College Level">College Level</option>
<option value="College Graduate">College Graduate</option>

<option value="Post Graduate">Post Graduate</option>            </select>
          </div>

          <!-- Barangay (Required) -->
          <div class="form-group">
            <label class="required">Barangay</label>
            <select v-model="formData.barangay_id" required class="form-input" @change="onBarangayChange">
              <option value="">Select barangay</option>
              <option v-for="brgy in barangays" :key="brgy.id" :value="brgy.id">
                {{ brgy.name }}
              </option>
            </select>
            <small v-if="errors.barangay_id" class="form-error">{{ errors.barangay_id }}</small>
          </div>
        </div>

        <!-- Farmer-Specific Fields -->
        <div class="form-section">
          <h3 class="section-title">Farm Information</h3>

          <!-- Land Area -->
          <div class="form-group">
            <label class="required">Land Area (hectares)</label>
            <input
              v-model="formData.land_area"
              type="number"
              step="0.01"
              placeholder="0.5"
              required
              class="form-input"
              @blur="validateLandArea"
            />
            <small v-if="errors.land_area" class="form-error">{{ errors.land_area }}</small>
          </div>

          <!-- Farm Location -->
<div class="form-group">
  <label class="required">Farm Location</label>
  <input
    v-model="formData.farm_location"
    type="text"
    required
    class="form-input"
  />
  <small class="form-help">Location where the farm is located</small>
</div>

          <!-- Password -->
          <div class="form-group">
            <label class="required">Password</label>
            <div class="password-input-wrapper">
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="At least 8 characters (letters and numbers)"
                required
                class="form-input"
                @blur="validatePassword"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle"
              >
                <svg v-if="showPassword" viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <small v-if="errors.password" class="form-error">{{ errors.password }}</small>
            <small class="form-help">Must be at least 8 characters with letters and numbers</small>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label class="required">Confirm Password</label>
            <div class="password-input-wrapper">
              <input
                v-model="formData.confirm_password"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Re-enter your password"
                required
                class="form-input"
                @blur="validateConfirmPassword"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="password-toggle"
              >
                <svg v-if="showConfirmPassword" viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <small v-if="errors.confirm_password" class="form-error">{{ errors.confirm_password }}</small>
          </div>

        </div>

        <!-- Terms and Conditions -->
        <div class="form-group checkbox-group">
          <label>
            <input v-model="formData.agreedToTerms" type="checkbox" required />
            <span>I agree to the terms and conditions and data privacy policy</span>
          </label>
        </div>

        <!-- Submit Buttons -->
        <div class="button-group">
          <button type="button" @click="goBack" class="btn btn-secondary">
            Back
          </button>
          <button type="submit" :disabled="isSubmitting" class="btn btn-primary">
            <span v-if="isSubmitting" class="spinner"></span>
            {{ isSubmitting ? 'Submitting...' : 'Complete Registration' }}
          </button>
        </div>
      </form>

      <!-- Info Box -->
      <div class="info-box">
        <h4>What happens next?</h4>
        <ul>
          <li>Your account will be created with status "Pending"</li>
          <li>Your Barangay President will review and approve your application</li>
          <li>After approval, you can log in and access all features</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formData = reactive({
  google_id: '',
  reference_number: route.query.referenceNumber || '',
  full_name: route.query.fullName || '',
  email: route.query.email || '',
  profile_picture: route.query.picture || '',
  phone_number: '',
  date_of_birth: '',
  address: '',
  educational_status: '',
  barangay_id: '',
  land_area: '',
  farm_location: '',
  password: '',
  confirm_password: '',
  agreedToTerms: false
})

const profilePicture = ref(route.query.picture || '')
const token = ref(route.query.token || '')
const barangays = ref([])
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const errors = reactive({
  phone_number: '',
  land_area: '',
  barangay_id: '',
  password: '',
  confirm_password: ''
})

// Load barangays on mount
onMounted(async () => {
  try {
    const response = await fetch('/api/barangays')
    const data = await response.json()
    if (data.success) {
      barangays.value = data.barangays
    }
  } catch (error) {
    console.error('Failed to load barangays:', error)
    errorMessage.value = 'Failed to load barangays'
  }
})

const getMaxDateOfBirth = () => {
  const today = new Date()
  const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  return eighteenYearsAgo.toISOString().split('T')[0]
}

const validatePhoneNumber = () => {
  const phoneDigitsOnly = formData.phone_number.replace(/\D/g, '')
  if (formData.phone_number && phoneDigitsOnly.length !== 11) {
    errors.phone_number = `Phone number must be exactly 11 digits (you entered ${phoneDigitsOnly.length})`
  } else {
    errors.phone_number = ''
  }
}

const validateLandArea = () => {
  const area = parseFloat(formData.land_area)
  if (formData.land_area && (isNaN(area) || area <= 0)) {
    errors.land_area = 'Land area must be a positive number'
  } else {
    errors.land_area = ''
  }
}

const onBarangayChange = () => {
  if (formData.barangay_id) {
    errors.barangay_id = ''
  }
}

const validatePassword = () => {
  const pwd = formData.password
  errors.password = ''

  if (!pwd) {
    return
  }

  if (pwd.length < 8) {
    errors.password = 'Password must be at least 8 characters long'
    return
  }

  const hasLetters = /[a-zA-Z]/.test(pwd)
  const hasNumbers = /[0-9]/.test(pwd)

  if (!hasLetters || !hasNumbers) {
    errors.password = 'Password must contain both letters and numbers'
    return
  }

  // Also validate confirm password if it's filled
  if (formData.confirm_password) {
    validateConfirmPassword()
  }
}

const validateConfirmPassword = () => {
  errors.confirm_password = ''

  if (!formData.confirm_password) {
    return
  }

  if (formData.password !== formData.confirm_password) {
    errors.confirm_password = 'Passwords do not match'
  }
}

const validateForm = () => {
  let isValid = true

  // Validate phone
  validatePhoneNumber()
  if (errors.phone_number) isValid = false

  // Validate land area
  validateLandArea()
  if (errors.land_area) isValid = false

  // Validate barangay
  if (!formData.barangay_id) {
    errors.barangay_id = 'Barangay is required'
    isValid = false
  }

  // Validate password
  validatePassword()
  if (errors.password) isValid = false

  // Validate confirm password
  validateConfirmPassword()
  if (errors.confirm_password) isValid = false

  // Ensure passwords are provided
  if (!formData.password) {
    errors.password = 'Password is required'
    isValid = false
  }

  if (!formData.confirm_password) {
    errors.confirm_password = 'Please confirm your password'
    isValid = false
  }

  return isValid
}

const submitRegistration = async () => {
  if (!validateForm()) {
    errorMessage.value = 'Please fix the errors above'
    return
  }

  if (!formData.agreedToTerms) {
    errorMessage.value = 'You must agree to the terms and conditions'
    return
  }

  try {
    isSubmitting.value = true
    errorMessage.value = ''

    // First, verify the Google token to get google_id
    const verifyResponse = await fetch('/api/auth/google/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: token.value })
    })

    const verifyData = await verifyResponse.json()
    if (!verifyData.success) {
      throw new Error('Token verification failed. Please try registering again.')
    }

    formData.google_id = verifyData.profileData.google_id

    // Submit registration
    const response = await fetch('/api/auth/google/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || 'Registration failed')
    }

    successMessage.value = 'Registration successful! Redirecting to login...'
    
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error) {
    errorMessage.value = error.message || 'Registration failed. Please try again.'
    console.error('Registration error:', error)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/login')
}
</script>

<style scoped>
.google-registration-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.progress-bar {
  max-width: 600px;
  margin: 0 auto 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step-number {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s ease;
}

.progress-step.active .step-number {
  background-color: #667eea;
  color: white;
}

.progress-step.completed .step-number {
  background-color: #10b981;
  color: white;
}

.progress-step span {
  font-size: 0.75rem;
  color: white;
  text-align: center;
}

.progress-line {
  flex: 1;
  height: 2px;
  background-color: rgba(255, 255, 255, 0.3);
  margin: 0 1rem;
}

.registration-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.registration-header {
  text-align: center;
  margin-bottom: 2rem;
}

.profile-picture {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 4px solid #667eea;
  margin-bottom: 1rem;
  object-fit: cover;
}

.registration-header h1 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

.message {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  animation: slideIn 0.3s ease;
}

.success-message {
  background-color: #ecfdf5;
  border-left: 4px solid #10b981;
  color: #047857;
}

.error-message {
  background-color: #fef2f2;
  border-left: 4px solid #dc2626;
  color: #b91c1c;
}

.registration-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 2rem;
}

.form-section:last-of-type {
  border-bottom: none;
}

.section-title {
  color: #1f2937;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-subtitle {
  color: #6b7280;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #1f2937;
  font-weight: 500;
  font-size: 0.9rem;
}

.required::after {
  content: ' *';
  color: #dc2626;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.disabled {
  background-color: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  -webkit-appearance: none;
  appearance: none;
  box-shadow: none !important;
  border: none !important;
  outline: none !important;
}

.password-toggle:focus {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  -webkit-focus-ring-color: transparent;
}

.password-toggle:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

.password-toggle svg {
  width: 1.2em;
  height: 1.2em;
  stroke: #111827;
}

.password-toggle:hover {
  transform: translateY(-50%) scale(1.15) !important;
  color: #667eea;
  outline: none;
  border: none;
  box-shadow: none;
}

.password-toggle:hover svg {
  stroke: #667eea;
}

.form-help {
  font-size: 0.8rem;
  color: #6b7280;
}

.form-error {
  font-size: 0.8rem;
  color: #dc2626;
  font-weight: 500;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #1f2937;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.875rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #667eea;
  color: white;
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5568d3;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #1f2937;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-box {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #eff6ff;
  border-left: 4px solid #3b82f6;
  border-radius: 0.375rem;
}

.info-box h4 {
  color: #1e40af;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.info-box ul {
  list-style: none;
  padding: 0;
  color: #1e40af;
  font-size: 0.9rem;
}

.info-box li {
  padding-left: 1.5rem;
  position: relative;
  margin-bottom: 0.5rem;
}

.info-box li::before {
  content: '✓';
  position: absolute;
  left: 0;
  font-weight: bold;
}

@media (max-width: 640px) {
  .registration-container {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
  }

  .progress-bar {
    font-size: 0.75rem;
  }

  .progress-line {
    margin: 0 0.5rem;
  }
}
</style>
