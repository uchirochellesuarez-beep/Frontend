<template>
  <div class="login-page glass-auth-page">
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

    <main class="layout-shell">
      <section class="tagline-panel" aria-label="Platform highlight">
        <div class="tagline-content">
          <div class="identity-block">
            <span class="identity-badge">{{ language === 'tl' ? 'Portal ng Magsasaka' : 'Farmer Portal' }}</span>
            <p class="identity-title">{{ language === 'tl' ? 'Mula Binhi Hanggang Tagumpay' : 'From Seeds to Success' }}</p>
            <p class="identity-caption">{{ language === 'tl' ? 'Mag-sign in upang ma-access ang mga serbisyo ng kooperatiba.' : 'Sign in to access cooperative services.' }}</p>
          </div>
        </div>
      </section>

      <section class="form-side" aria-label="Login section">
        <div class="login-card">
          <div class="form-header">
            <h2 class="form-title">{{ language === 'tl' ? 'Mag-login' : 'Sign In' }}</h2>
            <p class="form-subtitle">{{ language === 'tl' ? 'Magsimula ng iyong paglalakbay' : 'Begin your journey' }}</p>
          </div>

          <div v-if="successMessage" class="message success-message">
            {{ successMessage }}
          </div>
          <div v-if="errorMessage" class="message error-message">
            {{ errorMessage }}
          </div>

          <GoogleSignInButton />

          <div class="auth-divider" aria-hidden="true">
            <span class="auth-divider-line"></span>
            <span class="auth-divider-text">{{ language === 'tl' ? 'o mag-sign in gamit ang reference number' : 'or sign in with your reference number' }}</span>
            <span class="auth-divider-line"></span>
          </div>

          <form @submit.prevent="submitLogin" class="auth-form">
            <div class="form-group">
              <label class="form-label">{{ language === 'tl' ? 'Reference Number' : 'Reference Number' }}</label>
              <div class="field-input-wrapper">
                <span class="field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="16" rx="3" ry="3" />
                    <path d="M8 9h8M8 13h5" />
                  </svg>
                </span>
                <input
                  v-model="loginForm.referenceNumber"
                  type="text"
                  required
                  class="form-input"
                  :placeholder="language === 'tl' ? 'Ilagay ang iyong reference number' : 'Enter your reference number'"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ language === 'tl' ? 'Password' : 'Password' }}</label>
              <div class="password-input-wrapper field-input-wrapper">
                <span class="field-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="11" width="16" height="9" rx="2" ry="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="form-input"
                  autocomplete="current-password"
                  :placeholder="language === 'tl' ? 'Ilagay ang iyong password' : 'Enter your password'"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                  :aria-label="
                    language === 'tl'
                      ? (showPassword ? 'Itago ang password' : 'Ipakita ang password')
                      : (showPassword ? 'Hide password' : 'Show password')
                  "
                  :aria-pressed="showPassword"
                >
                  <svg
                    v-if="showPassword"
                    class="password-toggle-svg"
                    viewBox="0 0 24 24"
                    width="1.2em"
                    height="1.2em"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    v-else
                    class="password-toggle-svg"
                    viewBox="0 0 24 24"
                    width="1.2em"
                    height="1.2em"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              :disabled="authStore.loading"
              class="submit-btn"
            >
              <span v-if="authStore.loading" class="loading-spinner"></span>
              <span>
                {{ authStore.loading
                  ? (language === 'tl' ? 'Naglo-load...' : 'Loading...')
                  : (language === 'tl' ? 'Mag-login' : 'Sign In') }}
              </span>
            </button>

            <div class="form-footer">
              <div class="footer-cta">
                <p class="footer-text">{{ language === 'tl' ? 'Wala pang account?' : "Don't have an account?" }}</p>
                <button type="button" @click="goToSignUp" class="link-btn">
                  {{ language === 'tl' ? 'Gumawa ng account' : 'Create Account' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import GoogleSignInButton from '../components/GoogleSignInButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const language = ref('en')
const showPassword = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const loginForm = ref({
  referenceNumber: '',
  password: '',
  role: 'farmer'
})

const submitLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!loginForm.value.referenceNumber || !loginForm.value.password) {
    errorMessage.value = language.value === 'tl'
      ? 'Pakipunan ang lahat ng mga field'
      : 'Please fill in all fields'
    return
  }

  const result = await authStore.login(loginForm.value.referenceNumber, loginForm.value.password)

  if (result.success) {
    const userRole = authStore.currentUser?.role
    const userBarangayId = authStore.currentUser?.barangay_id

    if (userBarangayId === 2) {
      router.push('/barangay-notice')
    } else if (userRole === 'admin') {
      router.push('/admin')
    } else {
      router.push('/welcome')
    }
    return
  }

  errorMessage.value = result.error || (language.value === 'tl'
    ? 'Nabigo ang pag-login. Pakisubukan muli.'
    : 'Login failed. Please try again.')
}

const goToSignUp = () => {
  router.push('/signup')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;700&display=swap');

.login-page {
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
  background: url('https://i.pinimg.com/1200x/1d/73/0c/1d730c5473037a32dd743b05ac2bb466.jpg') center/cover no-repeat fixed;
}

.login-page::before {
  display: none;
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

.layout-shell {
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: 100dvh;
  padding: 4.4rem 0.85rem 0.85rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
}

.login-card {
  position: relative;
  overflow: hidden;
  border-radius: 26px;
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
}

.login-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg,
    rgba(174, 204, 186, 0.08) 0%,
    rgba(107, 191, 89, 0.06) 38%,
    rgba(255, 145, 77, 0.04) 68%,
    transparent 100%);
  pointer-events: none;
}

.login-card::after {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 20px;
  border: 1px solid rgba(152, 186, 164, 0.12);
  pointer-events: none;
}

.auth-form .form-input {
  background: #ffffff !important;
  color: #111111 !important;
  border-color: #cbd5e1 !important;
}

.auth-form .form-input::placeholder {
  color: #6b7280 !important;
}

.tagline-content,
.form-header,
.message,
.auth-form {
  position: relative;
  z-index: 2;
}

.tagline-panel {
  min-height: 180px;
  display: flex;
  align-items: center;
  padding: 0.95rem 0.35rem;
  position: relative;
  border-radius: 0;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.tagline-content {
  max-width: 56ch;
  position: relative;
  z-index: 1;
}

.identity-block {
  max-width: 25rem;
  position: relative;
  padding-left: 1.2rem;
}

.identity-block::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.2rem;
  bottom: 0.2rem;
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(180deg,
    rgba(229, 116, 49, 0.96) 0%,
    rgba(255, 217, 102, 0.9) 42%,
    rgba(107, 191, 89, 0.92) 100%);
  box-shadow: 0 0 18px rgba(107, 191, 89, 0.18);
}

.identity-badge {
  display: inline-block;
  color: #ffd966;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  font-family: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif;
  text-transform: uppercase;
  text-shadow: 0 2px 10px rgba(20, 24, 18, 0.3);
}

.identity-title {
  margin: 0.55rem 0 0;
  color: #fff8ef;
  font-family: 'Bebas Neue', 'Impact', sans-serif;
  font-size: clamp(2.8rem, 7vw, 5.4rem);
  font-weight: 400;
  line-height: 0.92;
  letter-spacing: 0.03em;
  text-wrap: balance;
  text-shadow: 0 3px 18px rgba(18, 26, 18, 0.3);
}

.identity-caption {
  margin: 0.78rem 0 0;
  max-width: 30ch;
  color: rgba(249, 244, 231, 0.94);
  font-family: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif;
  font-size: 0.94rem;
  font-weight: 500;
  line-height: 1.65;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 12px rgba(18, 26, 18, 0.24);
}

.form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.login-card {
  width: min(100%, 520px);
  max-width: 520px;
  min-height: 0;
  padding: 0.76rem 0.82rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: cardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.form-header {
  text-align: center;
  margin-bottom: 0.46rem;
}

.form-title {
  margin: 0;
  color: var(--text-strong);
  font-size: 1.35rem;
  font-weight: 700;
}

.form-subtitle {
  margin: 0.14rem 0 0;
  font-size: 0.8rem;
  color: rgba(215, 207, 191, 0.92);
}

.message {
  margin-bottom: 0.4rem;
  padding: 0.62rem 0.7rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-size: 0.78rem;
}

.success-message {
  background: rgba(16, 185, 129, 0.26);
  color: #ecfdf5;
}

.error-message {
  background: rgba(248, 113, 113, 0.28);
  color: #fef2f2;
}

.auth-divider {
  margin: 0.75rem 0 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(211, 218, 206, 0.72);
}

.auth-divider-line {
  height: 1px;
  flex: 1;
  background: linear-gradient(90deg, rgba(127, 177, 145, 0.12), rgba(127, 177, 145, 0.45), rgba(127, 177, 145, 0.12));
}

.auth-divider-text {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
  white-space: nowrap;
}

.auth-form {
  margin-top: 0.22rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.42rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-label {
  color: var(--text-soft);
  font-weight: 600;
  font-size: 0.75rem;
}

.field-input-wrapper {
  position: relative;
}

.field-icon {
  position: absolute;
  left: 0.72rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(168, 214, 180, 0.8);
  pointer-events: none;
}

.form-input {
  border: 1px solid var(--field-border);
  background: var(--field-bg);
  color: var(--text-soft);
  border-radius: 13px;
  padding: 0.56rem 0.72rem 0.56rem 2.15rem;
  font-size: 0.84rem;
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

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper .form-input {
  padding-right: 2.4rem;
}

.password-toggle {
  position: absolute;
  right: 0.62rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2.2rem;
  height: 2.2rem;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: #374151;
}

.password-toggle-svg {
  display: block;
  flex-shrink: 0;
}

.password-toggle:hover {
  color: #111827;
}

.password-toggle:focus-visible {
  outline: 2px solid rgba(107, 191, 89, 0.75);
  outline-offset: 2px;
  border-radius: 6px;
}

.auth-form .password-toggle {
  color: #111111;
}

.auth-form .password-toggle:hover {
  color: #000000;
}

.link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.42rem 0.96rem;
  border-radius: 999px;
  border: 1px solid rgba(134, 239, 172, 0.5);
  background: linear-gradient(128deg,
    rgba(200, 58, 8, 0.25) 0%,
    rgba(245, 168, 16, 0.20) 50%,
    rgba(74, 222, 128, 0.22) 100%);
  color: rgba(220, 255, 235, 0.96);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(74, 222, 128, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.22s;
}

.link-btn:hover {
  background: linear-gradient(128deg,
    rgba(224, 72, 12, 0.88) 0%,
    rgba(249, 130, 18, 0.86) 45%,
    rgba(74, 222, 128, 0.88) 100%);
  border-color: rgba(134, 239, 172, 0.72);
  color: #fff;
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 28px rgba(74, 222, 128, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.submit-btn {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 220, 100, 0.48);
  background: linear-gradient(128deg,
    rgba(200, 58, 8, 0.88) 0%,
    rgba(234, 110, 14, 0.84) 30%,
    rgba(245, 168, 16, 0.82) 60%,
    rgba(96, 160, 14, 0.86) 100%);
  color: #fff;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.86rem;
  letter-spacing: 0.03em;
  padding: 0.62rem 1.36rem;
  min-width: 180px;
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

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -120%;
  width: 45%;
  height: 100%;
  background: linear-gradient(90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.28) 50%,
    rgba(255, 255, 255, 0) 100%);
  transform: skewX(-20deg);
  transition: left 0.42s ease;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(128deg,
    rgba(224, 72, 12, 0.96) 0%,
    rgba(249, 130, 18, 0.92) 30%,
    rgba(252, 196, 24, 0.9) 60%,
    rgba(120, 190, 18, 0.94) 100%);
  transform: translateY(-3px) scale(1.028);
  box-shadow:
    0 18px 42px rgba(100, 30, 0, 0.36),
    0 0 36px rgba(234, 100, 20, 0.52),
    inset 0 1px 0 rgba(255, 255, 255, 0.44);
  filter: saturate(1.05) brightness(1.03);
}

.submit-btn:hover:not(:disabled)::before {
  left: 120%;
}

.submit-btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(252, 200, 40, 0.46),
    0 12px 36px rgba(100, 30, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.44);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 0.8rem;
  height: 0.8rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  margin-right: 0.4rem;
  vertical-align: middle;
  animation: spin 0.8s linear infinite;
}

.form-footer {
  margin-top: auto;
  border-top: 1px solid rgba(134, 239, 172, 0.35);
  padding-top: 0.52rem;
  display: flex;
  justify-content: center;
  color: rgba(227, 255, 238, 0.92);
  font-size: 0.72rem;
  background: linear-gradient(140deg,
    rgba(20, 78, 44, 0.36) 0%,
    rgba(28, 110, 58, 0.28) 52%,
    rgba(16, 62, 36, 0.4) 100%);
  border-radius: 14px;
  margin-bottom: 0.08rem;
}

.footer-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.footer-text {
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

@keyframes inputGlow {
  0%,
  100% {
    box-shadow:
      0 0 0 3px rgba(74, 222, 128, 0.22),
      0 0 18px rgba(74, 222, 128, 0.16),
      0 0 8px rgba(249, 115, 22, 0.12);
  }
  50% {
    box-shadow:
      0 0 0 3px rgba(74, 222, 128, 0.48),
      0 0 32px rgba(74, 222, 128, 0.28),
      0 0 16px rgba(249, 115, 22, 0.22);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 920px) {
  .layout-shell {
    grid-template-columns: 1fr 1.4fr;
    align-items: center;
    column-gap: 1.8rem;
    padding: 4.35rem 1.5rem 1.1rem 2.5rem;
    height: 100dvh;
  }

  .tagline-panel {
    min-height: calc(100dvh - 5.6rem);
    align-items: center;
    padding: 0.8rem 1.2rem 0.8rem 0.7rem;
  }

  .identity-block {
    transform: translateY(16px);
  }

  .login-card {
    margin-top: 0;
    height: auto;
    max-height: none;
    padding: 0.98rem 1.02rem;
    transform: translateY(-14px);
  }
}

@media (max-width: 420px) {
  .page-language-toggle {
    top: 0.48rem;
    right: 0.48rem;
  }

  .layout-shell {
    padding: 4rem 0.45rem 0.45rem;
    gap: 0.5rem;
  }

  .login-card {
    border-radius: 20px;
  }

  .tagline-panel {
    min-height: 150px;
    padding: 0.8rem 0.2rem;
  }

  .identity-title {
    font-size: 2.35rem;
    line-height: 0.96;
  }

  .identity-caption {
    font-size: 0.84rem;
  }

  .identity-badge {
    font-size: 0.68rem;
    letter-spacing: 0.1em;
  }

  .identity-block {
    padding-left: 0.95rem;
  }

  .login-card {
    padding: 0.82rem 0.82rem;
    min-height: 0;
    height: auto;
    max-height: none;
  }

  .form-input {
    font-size: 0.8rem;
    padding: 0.54rem 0.72rem 0.54rem 0.64rem;
  }

  .submit-btn {
    font-size: 0.82rem;
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
