<template>
  <div class="signup-page glass-auth-page">
    <div class="page-language-toggle" role="group" aria-label="Language selector">
      <button
        type="button"
        @click="language = 'en'"
        :class="['lang-btn', { active: language === 'en' }]"
      >
        English
      </button>
      <button
        type="button"
        @click="language = 'tl'"
        :class="['lang-btn', { active: language === 'tl' }]"
      >
        Tagalog
      </button>
    </div>

    <div class="signup-container">
      <div class="signup-card">
        <div class="signup-header">
          <h1 class="signup-title">{{ ui.title }}</h1>
        </div>

        <form @submit.prevent="register" class="registration-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ ui.fullName }}</label>
              <input
                v-model="form.full_name"
                type="text"
                required
                class="form-input"
                :placeholder="ui.fullNamePlaceholder"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ ui.birthDate }}</label>
              <div class="date-input-wrapper">
                <input
                  v-model="form.date_of_birth"
                  type="date"
                  required
                  class="form-input date-input"
                  :max="getMaxDateOfBirth()"
                />
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ ui.barangay }}</label>
              <select
                v-model="form.address"
                required
                class="form-input"
              >
                <option value="" disabled>{{ ui.selectBarangay }}</option>
                <option v-for="barangay in barangays" :key="barangay.id" :value="barangay.name">
                  {{ barangay.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ ui.phoneNumber }}</label>
              <input
                v-model="form.phone_number"
                type="tel"
                required
                class="form-input"
                :placeholder="ui.phonePlaceholder"
                maxlength="11"
                @input="form.phone_number = form.phone_number.replace(/\D/g, '').slice(0, 11)"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ ui.education }}</label>
              <select
                v-model="form.educational_status"
                required
                class="form-input"
              >
                <option value="">{{ ui.selectEducation }}</option>
                <option value="No Formal Education">{{ ui.noFormalEducation }}</option>
                <option value="Elementary Level">{{ ui.elementaryLevel }}</option>
                <option value="Elementary Graduate">{{ ui.elementaryGraduate }}</option>
                <option value="High School Level">{{ ui.highSchoolLevel }}</option>
                <option value="High School Graduate">{{ ui.highSchoolGraduate }}</option>
                <option value="Vocational">{{ ui.vocational }}</option>
                <option value="College Level">{{ ui.collegeLevel }}</option>
                <option value="College Graduate">{{ ui.collegeGraduate }}</option>
                <option value="Post Graduate">{{ ui.postGraduate }}</option>
              </select>
              <p class="form-hint">{{ ui.educationHint }}</p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ ui.role }}</label>
              <select v-model="form.role" required class="form-input">
                <option value="farmer">👨‍🌾 {{ ui.roleFarmer }}</option>
                <option value="president">👔 {{ ui.rolePresident }}</option>
                <option value="treasurer">💰 {{ ui.roleTreasurer }}</option>
                <option value="auditor">📊 {{ ui.roleAuditor }}</option>
                <option value="operator">⚙️ {{ ui.roleOperator }}</option>
                <option value="operation_manager">🛠️ {{ ui.roleOperationManager }}</option>
                <option value="business_manager">💼 {{ ui.roleBusinessManager }}</option>
                <option value="agriculturist">🌱 {{ ui.roleAgriculturist }}</option>
              </select>
              <p class="form-hint">{{ ui.roleHint }}</p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ ui.referenceNumber }}</label>
              <input
                v-model="form.reference_number"
                type="text"
                required
                class="form-input"
                :placeholder="ui.referencePlaceholder"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group password-group">
              <label class="form-label">{{ ui.password }}</label>
              <div class="password-input-wrapper">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="form-input"
                  :placeholder="ui.passwordPlaceholder"
                  @input="validatePasswordInput"
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
              <span v-if="passwordError" class="form-error">{{ passwordError }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group confirm-password-group">
              <label class="form-label">{{ ui.confirmPassword }}</label>
              <div class="password-input-wrapper">
                <input
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  required
                  class="form-input"
                  :placeholder="ui.confirmPasswordPlaceholder"
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
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              :disabled="loading"
              class="submit-button"
            >
              {{ loading ? ui.registering : ui.createAccount }}
            </button>
          </div>
        </form>

        <div class="login-prompt">
          <div class="login-cta">
            <p class="login-text">{{ ui.alreadyHaveAccount }}</p>
            <router-link to="/login" class="login-link">{{ ui.signIn }}</router-link>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          {{ ui.successMessage }}
        </div>

        <div class="info-card" role="note" aria-live="polite">
          <div class="info-card-header">
            <h3 class="info-title">{{ ui.dailyTip }}</h3>
          </div>
          <p class="info-content">{{ dailyTip }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const language = ref('en')

const labels = {
  en: {
    title: 'Farmer Registration',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    birthDate: 'Date of Birth',
    barangay: 'Barangay',
    selectBarangay: 'Select your barangay',
    phoneNumber: 'Phone Number',
    phonePlaceholder: 'Enter your phone number',
    education: 'Educational Status',
    selectEducation: 'Select educational attainment',
    noFormalEducation: 'No Formal Education',
    elementaryLevel: 'Elementary Level',
    elementaryGraduate: 'Elementary Graduate',
    highSchoolLevel: 'High School Level',
    highSchoolGraduate: 'High School Graduate',
    vocational: 'Vocational',
    collegeLevel: 'College Level',
    collegeGraduate: 'College Graduate',
    postGraduate: 'Post Graduate',
    educationHint: 'Select your highest educational attainment',
    role: 'Account Type / Role',
    roleFarmer: 'Farmer',
    rolePresident: 'President',
    roleTreasurer: 'Treasurer',
    roleAuditor: 'Auditor',
    roleOperator: 'Operator',
    roleOperationManager: 'Operation Manager',
    roleBusinessManager: 'Business Manager',
    roleAgriculturist: 'Agriculturist',
    roleHint: 'Select your role in the cooperative',
    referenceNumber: 'Reference Number',
    referencePlaceholder: 'Enter reference ID',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    createAccount: 'Create Account',
    registering: 'Registering...',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign In',
    successMessage: 'Registration successful! Please login with your credentials.',
    dailyTip: 'Daily Tip'
  },
  tl: {
    title: 'Pagrehistro ng Magsasaka',
    fullName: 'Buong Pangalan',
    fullNamePlaceholder: 'Ilagay ang iyong buong pangalan',
    birthDate: 'Petsa ng Kapanganakan',
    barangay: 'Barangay',
    selectBarangay: 'Piliin ang iyong barangay',
    phoneNumber: 'Numero ng Telepono',
    phonePlaceholder: 'Ilagay ang numero ng telepono',
    education: 'Antas ng Edukasyon',
    selectEducation: 'Piliin ang natapos na edukasyon',
    noFormalEducation: 'Walang Pormal na Edukasyon',
    elementaryLevel: 'Elementarya (Hindi Tapos)',
    elementaryGraduate: 'Elementarya (Tapos)',
    highSchoolLevel: 'High School (Hindi Tapos)',
    highSchoolGraduate: 'High School (Tapos)',
    vocational: 'Bokasyonal',
    collegeLevel: 'Kolehiyo (Hindi Tapos)',
    collegeGraduate: 'Kolehiyo (Tapos)',
    postGraduate: 'Post Graduate',
    educationHint: 'Piliin ang pinakamataas na antas ng edukasyon',
    role: 'Uri ng Account / Tungkulin',
    roleFarmer: 'Magsasaka',
    rolePresident: 'Presidente',
    roleTreasurer: 'Ingat-Yaman',
    roleAuditor: 'Auditor',
    roleOperator: 'Operator',
    roleOperationManager: 'Operation Manager',
    roleBusinessManager: 'Business Manager',
    roleAgriculturist: 'Agriculturist',
    roleHint: 'Piliin ang iyong tungkulin sa kooperatiba',
    referenceNumber: 'Reference Number',
    referencePlaceholder: 'Ilagay ang reference ID',
    password: 'Password',
    passwordPlaceholder: 'Ilagay ang password',
    confirmPassword: 'Kumpirmahin ang Password',
    confirmPasswordPlaceholder: 'Kumpirmahin ang iyong password',
    createAccount: 'Gumawa ng Account',
    registering: 'Nagre-rehistro...',
    alreadyHaveAccount: 'Mayroon nang account?',
    signIn: 'Mag-login',
    successMessage: 'Matagumpay ang pagrehistro! Paki-login gamit ang inyong credentials.',
    dailyTip: 'Pang-araw-araw na Tip'
  }
}

const ui = computed(() => labels[language.value])

const dailyTips = {
  en: [
    'Water crops early in the morning for better absorption.',
    'Rotate crops regularly to keep soil nutrients balanced.',
    'Use organic matter to improve long-term soil structure.',
    'Inspect leaves weekly to catch pests before outbreaks.'
  ],
  tl: [
    'Diligan ang pananim sa umaga para sa mas mahusay na pagsipsip.',
    'Mag-rotate ng pananim para mapanatiling may sustansya ang lupa.',
    'Gumamit ng organikong materyal para sa mas malusog na lupa.',
    'Suriin lingguhan ang dahon upang maagapan ang peste.'
  ]
}

const dailyTip = ref('')

const form = ref({
  role: 'farmer',
  full_name: '',
  date_of_birth: '',
  address: '',
  phone_number: '',
  educational_status: '',
  reference_number: '',
  password: '',
  confirmPassword: ''
})

const barangays = ref([
  {
    id: 1,
    name: 'Camansihan',
    description: 'Primary operational barangay with active transactions'
  },
  {
    id: 2,
    name: 'Managpi',
    description: 'Sample barangay for demonstration'
  }
])

const loading = ref(false)
const error = ref('')
const success = ref(false)
const passwordError = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const setDailyTip = () => {
  const tips = dailyTips[language.value]
  dailyTip.value = tips[Math.floor(Math.random() * tips.length)]
}

const getMaxDateOfBirth = () => {
  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  return maxDate.toISOString().split('T')[0]
}

onMounted(() => {
  setDailyTip()
})

watch(language, () => {
  setDailyTip()
})

const calculateAge = (birthDate) => {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const validateAge = () => {
  if (!form.value.date_of_birth) {
    error.value = language.value === 'tl' ? 'Kinakailangan ang petsa ng kapanganakan' : 'Date of birth is required'
    return false
  }
  const age = calculateAge(form.value.date_of_birth)
  if (age < 18) {
    error.value = language.value === 'tl'
      ? `Dapat ay hindi bababa sa 18 taong gulang. Kayo ay ${age} taong gulang.`
      : `You must be at least 18 years old to register. You are currently ${age} years old.`
    return false
  }
  return true
}

const validatePhoneNumber = () => {
  const phoneNumber = form.value.phone_number.replace(/\D/g, '')
  if (phoneNumber.length !== 11) {
    error.value = language.value === 'tl'
      ? `Ang numero ng telepono ay dapat eksaktong 11 digit. ${phoneNumber.length} ang nailagay.`
      : `Phone number must be exactly 11 digits. You entered ${phoneNumber.length} digits.`
    return false
  }
  return true
}

const validatePassword = () => {
  const password = form.value.password

  if (password.length < 8) {
    error.value = language.value === 'tl'
      ? 'Ang password ay dapat may hindi bababa sa 8 karakter'
      : 'Password must be at least 8 characters long'
    return false
  }

  const hasLetters = /[a-zA-Z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)

  if (!hasLetters || !hasNumbers) {
    error.value = language.value === 'tl'
      ? 'Ang password ay dapat may parehong letra at numero'
      : 'Password must contain both letters and numbers'
    return false
  }

  return true
}

const validatePasswordInput = () => {
  const password = form.value.password

  if (!password) {
    passwordError.value = ''
    return
  }

  const hasLetters = /[a-zA-Z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const length = password.length

  if (length < 8) {
    passwordError.value = language.value === 'tl'
      ? `${8 - length} pang karakter ang kailangan`
      : `${8 - length} more character(s) needed`
    return
  }

  if (!hasLetters && hasNumbers) {
    passwordError.value = language.value === 'tl' ? 'Magdagdag ng mga letra (A-Z o a-z)' : 'Add letters (A-Z or a-z)'
    return
  }

  if (hasLetters && !hasNumbers) {
    passwordError.value = language.value === 'tl' ? 'Magdagdag ng mga numero (0-9)' : 'Add numbers (0-9)'
    return
  }

  passwordError.value = ''
}

const register = async () => {
  if (!validateAge()) {
    return
  }

  if (!validatePhoneNumber()) {
    return
  }

  if (!validatePassword()) {
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    error.value = language.value === 'tl' ? 'Hindi magkatugma ang password' : 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    const response = await fetch('/api/farmers/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: form.value.full_name,
        date_of_birth: form.value.date_of_birth,
        address: form.value.address,
        phone_number: form.value.phone_number,
        educational_status: form.value.educational_status,
        reference_number: form.value.reference_number,
        password: form.value.password,
        role: form.value.role
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Registration failed' }))
      throw new Error(errorData.message || 'Registration failed')
    }

    await response.json()

    success.value = true
    form.value = {
      role: 'farmer',
      full_name: '',
      date_of_birth: '',
      address: '',
      phone_number: '',
      educational_status: '',
      reference_number: '',
      password: '',
      confirmPassword: ''
    }

    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err) {
    error.value = err.message || (language.value === 'tl' ? 'May error sa pagrehistro' : 'An error occurred during registration')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;700&display=swap');

.signup-page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  font-family: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif;
  --primary-orange: #e57431;
  --primary-green: #6bbf59;
  --accent-gold: #ffd966;
  --surface-dark: #19231f;
  --surface-dark-2: #141c19;
  --text-strong: #f2eee4;
  --text-muted: #d7cfbf;
  --text-soft: #eee8da;
  --field-bg: rgba(10, 30, 15, 0.32);
  --field-border: rgba(127, 177, 145, 0.42);
  background: url('https://i.pinimg.com/1200x/1d/73/0c/1d730c5473037a32dd743b05ac2bb466.jpg') center/cover no-repeat fixed !important;
}

.signup-page::before {
  display: none !important;
}

.signup-container {
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.signup-card {
  position: relative;
  width: min(100%, 900px);
  height: auto;
  max-height: calc(100dvh - 0.9rem);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.72rem 0.82rem;
  border-radius: 28px;
  border: 1px solid rgba(116, 150, 128, 0.38) !important;
  background: linear-gradient(155deg,
    rgba(24, 34, 29, 0.96) 0%,
    rgba(22, 31, 27, 0.94) 45%,
    rgba(19, 28, 24, 0.96) 100%) !important;
  box-shadow:
    16px 16px 34px rgba(6, 10, 8, 0.65),
    -12px -12px 24px rgba(53, 72, 61, 0.34),
    inset 1px 1px 0 rgba(152, 186, 164, 0.12),
    inset -1px -1px 0 rgba(6, 10, 8, 0.6) !important;
  backdrop-filter: blur(14px) saturate(125%) !important;
  -webkit-backdrop-filter: blur(14px) saturate(125%) !important;
  animation: cardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  display: flex;
  flex-direction: column;
}

.signup-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg,
    rgba(174, 204, 186, 0.08) 0%,
    rgba(107, 191, 89, 0.06) 38%,
    rgba(255, 145, 77, 0.04) 68%,
    transparent 100%);
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

.signup-card::after {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(152, 186, 164, 0.12);
  border-radius: 20px;
  pointer-events: none;
  z-index: 0;
}

.page-language-toggle,
.signup-header,
.registration-form,
.login-prompt,
.error-message,
.success-message,
.info-card {
  position: relative;
  z-index: 2;
}

.page-language-toggle {
  position: fixed;
  top: 0.8rem;
  right: 0.8rem;
  z-index: 300;
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
  padding: 0.24rem;
  border-radius: 999px;
  border: 1px solid #0d3f28;
  background: rgba(18, 58, 38, 0.72);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  animation: toggleIn 460ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.lang-btn {
  border-radius: 999px;
  padding: 0.34rem 0.9rem;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.73rem;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(196, 230, 205, 0.95);
  cursor: pointer;
  transition: background 0.26s, color 0.2s, box-shadow 0.26s, border-color 0.2s;
}

.lang-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.18);
}

.lang-btn.active {
  background: #fff;
  color: #0f2e1f;
  border-color: rgba(13, 63, 40, 0.35);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.signup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.34rem;
  padding-bottom: 0.34rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
}

.signup-title {
  color: var(--text-strong);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 12px rgba(80, 20, 0, 0.35), 0 1px 4px rgba(0, 0, 0, 0.2);
  margin: 0;
}

.registration-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42rem 0.64rem;
  align-content: start;
  flex: 0 1 auto;
  min-height: 0;
  overflow: visible;
  padding-right: 0.35rem;
}

.form-row {
  display: contents;
}

.form-group {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.password-group,
.confirm-password-group {
  grid-column: 2 / 3;
}

.form-label {
  color: var(--text-soft);
  font-weight: 600;
  font-size: 0.72rem;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.form-input {
  width: 100%;
  border: 1px solid var(--field-border);
  background: var(--field-bg);
  color: var(--text-soft);
  border-radius: 13px;
  padding: 0.46rem 1.9rem 0.46rem 0.64rem;
  font-size: 0.76rem;
  font-family: inherit;
  transition: border-color 0.24s, background 0.24s, box-shadow 0.24s;
}

.form-input::placeholder {
  color: rgba(210, 198, 173, 0.62);
}

.form-input:focus {
  outline: none;
  border-color: rgba(107, 191, 89, 0.88);
  background: rgba(12, 38, 22, 0.42);
  animation: inputGlow 1.8s ease-in-out infinite;
}

.form-input option {
  color: #1a0e00;
  background: #fff8ee;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle,
.password-toggle svg {
  color: rgba(255, 230, 180, 0.88);
  stroke: rgba(255, 230, 180, 0.88);
}

.password-toggle {
  position: absolute;
  right: 0.62rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover,
.password-toggle:hover svg {
  color: #fff;
  stroke: #fff;
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-icon {
  position: absolute;
  right: 0.78rem;
  font-size: 1.05rem;
  pointer-events: none;
  color: rgba(255, 230, 180, 0.88);
}

.form-hint {
  font-size: 0.6rem;
  color: rgba(211, 218, 206, 0.72);
  margin-top: 0.05rem;
}

.form-error {
  font-size: 0.7rem;
  color: #fde68a;
  font-weight: 600;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 0.24rem;
  margin-bottom: 0.08rem;
  padding-right: 0;
  grid-column: 2 / 3;
  flex-shrink: 0;
}

.submit-button {
  border: 1px solid rgba(255, 220, 100, 0.48);
  background: linear-gradient(128deg,
    rgba(200, 58, 8, 0.88) 0%,
    rgba(234, 110, 14, 0.84) 30%,
    rgba(245, 168, 16, 0.82) 60%,
    rgba(96, 160, 14, 0.86) 100%);
  color: #fff;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.03em;
  line-height: 1.2;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.26);
  padding: 0.48rem 1.12rem;
  min-width: 164px;
  max-width: 100%;
  white-space: nowrap;
  cursor: pointer;
  box-shadow:
    0 10px 30px rgba(100, 30, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.36);
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.22s ease,
    background 0.3s ease,
    filter 0.22s ease;
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(128deg,
    rgba(224, 72, 12, 0.96) 0%,
    rgba(249, 130, 18, 0.92) 30%,
    rgba(252, 196, 24, 0.9) 60%,
    rgba(120, 190, 18, 0.94) 100%);
  transform: translateY(-1px) scale(1.015);
  box-shadow:
    0 18px 42px rgba(100, 30, 0, 0.36),
    0 0 36px rgba(234, 100, 20, 0.52),
    inset 0 1px 0 rgba(255, 255, 255, 0.44);
  filter: saturate(1.05) brightness(1.03);
}

.submit-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(252, 200, 40, 0.46),
    0 12px 36px rgba(100, 30, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.44);
}

.submit-button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.login-prompt {
  margin-top: 0.08rem;
  border-top: 1px solid rgba(255, 210, 120, 0.22);
  padding-top: 0.22rem;
  color: rgba(255, 248, 220, 0.86);
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.login-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.login-text {
  margin: 0;
  font-size: 0.72rem;
}

.login-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.42rem 0.96rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 218, 144, 0.5);
  background: rgba(18, 6, 0, 0.32);
  color: rgba(255, 244, 208, 0.95);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.01em;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: all 0.22s;
}

.login-link:hover {
  background: linear-gradient(128deg,
    rgba(224, 72, 12, 0.92) 0%,
    rgba(249, 130, 18, 0.9) 45%,
    rgba(128, 195, 34, 0.9) 100%);
  color: #fff;
  transform: translateY(-2px) scale(1.02);
}

.error-message,
.success-message {
  margin-top: 0.6rem;
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-size: 0.82rem;
}

.success-message {
  background: rgba(16, 185, 129, 0.26);
  color: #ecfdf5;
}

.error-message {
  background: rgba(248, 113, 113, 0.28);
  color: #fef2f2;
}

.info-card {
  display: none;
  margin-top: 0.35rem;
  padding: 0.52rem 0.78rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 220, 120, 0.32);
  background: linear-gradient(135deg,
    rgba(234, 92, 14, 0.16),
    rgba(245, 158, 11, 0.14),
    rgba(252, 211, 40, 0.1),
    rgba(74, 163, 60, 0.14));
  backdrop-filter: blur(12px) saturate(130%);
  -webkit-backdrop-filter: blur(12px) saturate(130%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 4px 16px rgba(100, 40, 0, 0.12);
  animation: tipFadeIn 0.85s 0.4s ease-out both;
}

.info-card-header {
  margin-bottom: 0.2rem;
}

.info-title {
  font-size: 0.68rem;
  font-weight: 800;
  color: #fde68a;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 8px rgba(200, 100, 0, 0.4);
}

.info-content {
  font-size: 0.74rem;
  color: rgba(255, 250, 230, 0.92);
  line-height: 1.48;
  margin: 0;
}

@keyframes toggleIn {
  from {
    opacity: 0;
    transform: translateY(-12px) translateX(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(0);
  }
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(26px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes tipFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes inputGlow {
  0%,
  100% {
    box-shadow:
      0 0 0 3px rgba(252, 200, 40, 0.26),
      0 0 16px rgba(234, 100, 20, 0.18);
  }
  50% {
    box-shadow:
      0 0 0 3px rgba(252, 200, 40, 0.55),
      0 0 30px rgba(234, 100, 20, 0.38);
  }
}

@media (min-width: 700px) {
  .signup-card {
    width: min(100%, 900px);
    height: auto;
    max-height: calc(100dvh - 0.9rem);
    padding: 0.72rem 0.82rem;
  }
}

@media (max-width: 900px) {
  .password-group,
  .confirm-password-group {
    grid-column: auto;
  }

  .signup-card {
    width: min(100%, 560px);
    height: auto;
    max-height: calc(100dvh - 1rem);
    overflow-y: auto;
    display: block;
    padding: 1rem;
  }

  .registration-form {
    display: flex;
    flex-direction: column;
    gap: 0.68rem;
    overflow: visible;
    padding-right: 0;
  }

  .form-row {
    display: flex;
    gap: 0.8rem;
  }

  .form-actions {
    grid-column: auto;
    justify-content: center;
  }

  .info-card {
    display: block;
  }
}

@media (max-width: 420px) {
  .page-language-toggle {
    top: 0.48rem;
    right: 0.48rem;
  }

  .signup-container {
    padding: 0.4rem;
  }

  .signup-card {
    border-radius: 20px;
    padding: 0.85rem 0.9rem;
    max-height: calc(100dvh - 0.9rem);
  }

  .signup-title {
    font-size: 1.12rem;
  }

  .form-input {
    font-size: 0.8rem;
    padding: 0.54rem 2.4rem 0.54rem 0.64rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
