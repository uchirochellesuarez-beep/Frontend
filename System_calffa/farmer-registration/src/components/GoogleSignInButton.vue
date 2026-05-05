<template>
  <div class="google-signin-container">
    <!-- Google Sign-In Button -->
    <button
      @click="handleGoogleSignIn"
      :disabled="isLoading"
      class="google-signin-btn"
    >
      <svg viewBox="0 0 24 24" class="google-icon">
        <path fill="#1F2937" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {{ isLoading ? 'Signing in...' : 'Continue with Google' }}
    </button>

    <!-- Divider -->
    <div class="google-signin-divider">
      <span>or</span>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="google-error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const isLoading = ref(false)
const errorMessage = ref('')
const authStore = useAuthStore()

const handleGoogleSignIn = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    if (!window.google) {
      throw new Error('Google Sign-In library not loaded')
    }

    // Trigger the one-tap prompt first
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        console.log('One-tap prompt not displayed:', notification.getNotDisplayedReason())
      }
    })
  } catch (error) {
    errorMessage.value = error.message || 'Failed to initialize Google Sign-In'
    isLoading.value = false
  }
}

// Initialize Google SDK on component mount
onMounted(() => {
  if (!window.google) {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      // Define callback BEFORE initializing
      window.handleGoogleSignInCallback = async (response) => {
        try {
          const token = response.credential

          // Verify token with backend
          const verifyResponse = await fetch('/api/auth/google/verify-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
          })

          const data = await verifyResponse.json()

          if (!data.success) {
            isLoading.value = false
            errorMessage.value = data.message || 'Token verification failed'
            return
          }

          if (data.status === 'existing') {
            if (data.user.status !== 'approved' && data.user.is_farmer) {
              errorMessage.value = 'Your account is still pending approval from your Barangay President.'
              isLoading.value = false
              return
            }

            const loginData = await authStore.googleLogin(
              data.profileData.google_id,
              data.user.id
            )

            if (!loginData.success) {
              isLoading.value = false
              errorMessage.value = loginData.error || 'Login failed'
              return
            }

            window.location.href = '/dashboard'
          } else if (data.status === 'new') {
            const query = new URLSearchParams({
              token,
              fullName: data.profileData.full_name,
              email: data.profileData.email,
              picture: data.profileData.profile_picture || ''
            })
            window.location.href = `/google-registration?${query}`
          } else if (data.status === 'existing-email') {
            window.location.href = `/google-registration?${new URLSearchParams({
              userId: data.user.id,
              google_id: data.profileData.google_id,
              fullName: data.profileData.full_name,
              email: data.profileData.email,
              picture: data.profileData.profile_picture || ''
            })}`
          }
        } catch (error) {
          isLoading.value = false
          errorMessage.value = error.message
          console.error('Google sign-in error:', error)
        }
      }

      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: window.handleGoogleSignInCallback
      })
    }
  }
})
</script>

<style scoped>
.google-signin-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}

.google-signin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: #ffffff;
  color: #1f2937;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.google-signin-btn:hover:not(:disabled) {
  border-color: #4285f4;
  background-color: #f8f9ff;
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.1);
}

.google-signin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  width: 1.2rem;
  height: 1.2rem;
}

.google-signin-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0;
}

.google-signin-divider::before,
.google-signin-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: #e5e7eb;
}

.google-signin-divider span {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.google-error-message {
  padding: 0.75rem;
  background-color: #fee2e2;
  border-left: 4px solid #dc2626;
  color: #b91c1c;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}
</style>

<style>
/* Hide Google One-Tap prompt */
.g_id_signin {
  display: none;
}
</style>
