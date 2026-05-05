<template>
  <div id="app" class="glass-shell">
    <!-- Header only shown when not authenticated (on login/register pages) -->
    <header v-if="!isAuthenticated" class="app-header sticky top-0 z-50 shadow-md">
      <div class="header-content">
        <div class="logo-container">
          <div class="department-logo wheat-icon"></div>
          <div>
            <p class="header-subtitle">Farmer Registration Portal</p>
          </div>
        </div>
        <nav class="nav-links">
        </nav>
      </div>
    </header>

    <div class="app-container glass-app-container">
      <router-view />
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/authStore'
import { useBackdropTheme } from './composables/useBackdropTheme'

const authStore = useAuthStore()
const { initTheme, watchSystemTheme } = useBackdropTheme()

const isAuthenticated = computed(() => !!authStore.currentUser)

onMounted(() => {
  initTheme()
  watchSystemTheme()
})
</script>

<style>
.app-container {
  width: 100%;
  min-height: 100vh;
  position: relative;
}
</style>
