<template>
  <div class="min-h-screen bg-gray-50 p-4 lg:p-6">
    <DashboardHeader :user="authStore.currentUser" />
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Members Summary</h1>
          <p class="text-sm text-gray-500">Search a farmer first, then view the full summary.</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="!selectedFarmer"
            type="button"
            @click="router.push('/farmers-table')"
            class="back-to-members-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="back-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Members Dashboard
          </button>
          <button
            v-if="selectedFarmer"
            type="button"
            @click="resetSelection"
            class="back-to-members-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="back-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </button>
        </div>
      </div>

      <div v-if="pageError" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
        {{ pageError }}
      </div>

      <!-- SEARCH-FIRST -->
      <div v-if="!selectedFarmer" class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">Search farmer (name or reference #)</label>
        <input
          v-model="query"
          type="text"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
          placeholder="Type a name or reference number…"
        />

        <div class="mt-4">
          <div v-if="!query.trim()" class="p-6 text-center text-sm text-gray-500 border rounded-lg bg-gray-50">
            Start typing to search.
          </div>

          <div v-else class="border rounded-lg overflow-hidden">
            <div class="max-h-[520px] overflow-y-auto overflow-x-hidden">
              <table class="search-results-table w-full">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Ref #</th>
                    <th>Name</th>
                    <th>DOB</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Education</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="f in filteredFarmers"
                    :key="f.id"
                    class="result-row"
                    @click="selectFarmer(f)"
                  >
                    <td class="photo-cell">
                      <img
                        v-if="getProfilePictureUrl(f.profile_picture)"
                        :src="getProfilePictureUrl(f.profile_picture)"
                        alt="Profile"
                        class="row-avatar"
                      />
                      <div v-else class="row-avatar row-avatar-fallback">
                        <svg class="avatar-fallback-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                          <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                      </div>
                    </td>
                    <td>{{ f.reference_number || 'N/A' }}</td>
                    <td class="name-cell">
                      <div class="name-primary">{{ f.full_name }}</div>
                      <div class="name-secondary">{{ (f.role || 'farmer') }} • {{ (f.status || 'approved') }}</div>
                    </td>
                    <td>{{ formatDate(f.date_of_birth) }}</td>
                    <td class="resume-cell">
                      <span class="resume-label">Address</span>
                      <span class="resume-value">{{ f.address || (f.barangay_name || ('Barangay #' + (f.barangay_id ?? 'N/A'))) }}</span>
                    </td>
                    <td class="resume-cell">
                      <span class="resume-label">Phone</span>
                      <span class="resume-value">{{ f.phone_number || 'N/A' }}</span>
                    </td>
                    <td class="resume-cell">
                      <span class="resume-label">Education</span>
                      <span class="resume-value">{{ f.educational_status || 'N/A' }}</span>
                    </td>
                  </tr>
                  <tr v-if="filteredFarmers.length === 0">
                    <td colspan="7" class="p-6 text-center text-sm text-gray-500">No matches.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- SINGLE-FARMER SUMMARY -->
      <div v-else class="profile-wrapper">

        <!-- ── Hero Header Card ── -->
        <div class="profile-hero">
          <!-- Top Action Bar -->
          <div class="hero-topbar">
            <button @click="refreshSummary" class="refresh-btn" :disabled="loading">
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 8V4M6 4H10M6 4C7.45904 2.75027 9.3511 2 11.4167 2C15.895 2 19.5833 5.68833 19.5833 10.1667C19.5833 14.645 15.895 18.3333 11.4167 18.3333C7.8048 18.3333 4.74267 15.9947 3.66667 12.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ loading ? 'Loading…' : 'Refresh' }}
            </button>
            <div class="hero-actions">
              <button class="action-btn btn-edit">
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4 20H8L18.5 9.5C19.3284 8.67157 19.3284 7.32843 18.5 6.5V6.5C17.6716 5.67157 16.3284 5.67157 15.5 6.5L5 17V20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Edit
              </button>
              <button class="action-btn btn-delete">
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M5 7H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M9 7V5.5C9 4.67157 9.67157 4 10.5 4H13.5C14.3284 4 15 4.67157 15 5.5V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M8 10V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M12 10V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M16 10V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M6.5 7L7.2 18.2C7.26067 19.1707 8.06598 19.9286 9.0386 19.9286H14.9614C15.934 19.9286 16.7393 19.1707 16.8 18.2L17.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                Delete
              </button>
            </div>
          </div>

          <!-- Identity Row: avatar + name + badges -->
          <div class="hero-identity">
            <div class="hero-avatar-wrap">
              <img
                v-if="getProfilePictureUrl(selectedFarmer.profile_picture)"
                :src="getProfilePictureUrl(selectedFarmer.profile_picture)"
                alt="Profile"
                class="hero-avatar"
              />
              <div v-else class="hero-avatar hero-avatar-fallback">
                <svg class="avatar-fallback-icon avatar-fallback-icon-lg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                  <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <span class="avatar-status-ring" :class="statusDotClass(selectedFarmer.status)"></span>
            </div>
            <div class="hero-info">
              <h2 class="hero-name">{{ selectedFarmer.full_name }}</h2>
              <div class="hero-badges">
                <span class="badge badge-role">{{ selectedFarmer.role || 'Farmer' }}</span>
                <span class="badge" :class="statusBadgeClass(selectedFarmer.status)">
                  <span class="badge-dot" :class="statusDotClass(selectedFarmer.status)"></span>
                  {{ selectedFarmer.status || 'approved' }}
                </span>
              </div>
              <p class="hero-since">Member since {{ formatDate(selectedFarmer.registered_on) }}</p>
            </div>
          </div>

          <!-- Quick Info Grid: ref / barangay / phone / address -->
          <div class="quick-info-grid">
            <div class="info-tile">
              <div class="info-tile-icon">
                <svg class="tile-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M9 3L7 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M17 3L15 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M4 9H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M3 15H19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="info-tile-body">
                <div class="info-tile-label">Reference No.</div>
                <div class="info-tile-value-row">
                  <span class="info-tile-value ref-highlight">{{ selectedFarmer.reference_number || 'N/A' }}</span>
                  <button
                    v-if="selectedFarmer.reference_number"
                    @click.stop="copyRefNumber"
                    class="copy-btn"
                    :title="copiedRef ? 'Copied!' : 'Copy to clipboard'"
                  >
                    <svg v-if="copiedRef" class="copy-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M5 12.5L9.5 17L19 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg v-else class="copy-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/>
                      <path d="M7 15H6C4.89543 15 4 14.1046 4 13V6C4 4.89543 4.89543 4 6 4H13C14.1046 4 15 4.89543 15 6V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="info-tile">
              <div class="info-tile-icon">
                <svg class="tile-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 21C12 21 18 15.6274 18 10C18 6.68629 15.3137 4 12 4C8.68629 4 6 6.68629 6 10C6 15.6274 12 21 12 21Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                  <circle cx="12" cy="10" r="2.5" fill="currentColor"/>
                </svg>
              </div>
              <div class="info-tile-body">
                <div class="info-tile-label">Barangay</div>
                <div class="info-tile-value">{{ selectedFarmer.barangay_name || (selectedFarmer.barangay_id ? 'Brgy #' + selectedFarmer.barangay_id : 'N/A') }}</div>
              </div>
            </div>
            <div class="info-tile">
              <div class="info-tile-icon">
                <svg class="tile-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M6.6 10.8C8.1 13.7 10.3 15.9 13.2 17.4L15.45 15.15C15.75 14.85 16.19 14.75 16.58 14.88C17.82 15.29 19.16 15.5 20.55 15.5C21.13 15.5 21.6 15.97 21.6 16.55V20.1C21.6 20.68 21.13 21.15 20.55 21.15C10.6 21.15 2.85 13.4 2.85 3.45C2.85 2.87 3.32 2.4 3.9 2.4H7.45C8.03 2.4 8.5 2.87 8.5 3.45C8.5 4.84 8.71 6.18 9.12 7.42C9.25 7.81 9.15 8.25 8.85 8.55L6.6 10.8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="info-tile-body">
                <div class="info-tile-label">Phone Number</div>
                <div class="info-tile-value">{{ selectedFarmer.phone_number || 'N/A' }}</div>
              </div>
            </div>
            <div class="info-tile">
              <div class="info-tile-icon">
                <svg class="tile-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4 10.5L12 4L20 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6.5 9.5V19H17.5V9.5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                  <path d="M10 19V13H14V19" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="info-tile-body">
                <div class="info-tile-label">Address</div>
                <div class="info-tile-value">{{ selectedFarmer.address || 'N/A' }}</div>
              </div>
            </div>
          </div>
        </div><!-- /profile-hero -->

        <!-- Error -->
        <div v-if="summaryError" class="profile-error">{{ summaryError }}</div>

        <!-- ── Tab Navigation ── -->
        <div class="profile-tabs-nav">
          <button class="tab-pill" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
            <svg class="tab-pill-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5 19V11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M12 19V5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M19 19V8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            Overview
          </button>
          <button class="tab-pill" :class="{ active: activeTab === 'personal' }" @click="activeTab = 'personal'">
            <svg class="tab-pill-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
              <path d="M4.5 20C4.5 16.9624 7.85786 14.5 12 14.5C16.1421 14.5 19.5 16.9624 19.5 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            Personal
          </button>
          <button class="tab-pill" :class="{ active: activeTab === 'share' }" @click="activeTab = 'share'">
            <svg class="tab-pill-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 3V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M16.5 7.5C16.5 6.11929 14.4853 5 12 5C9.51472 5 7.5 6.11929 7.5 7.5C7.5 8.88071 9.51472 10 12 10C14.4853 10 16.5 11.1193 16.5 12.5C16.5 13.8807 14.4853 15 12 15C9.51472 15 7.5 13.8807 7.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Share Capital
          </button>
          <button class="tab-pill" :class="{ active: activeTab === 'assistance' }" @click="activeTab = 'assistance'">
            <svg class="tab-pill-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M8 12L10.5 14.5L16 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 3L19 7V12C19 16.4183 15.866 20.1744 12 21C8.13401 20.1744 5 16.4183 5 12V7L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
            Assistance
          </button>
        </div>

        <!-- ── Tab Content ── -->
        <div class="tab-content-area">

          <!-- Overview Tab: Financial Summary -->
          <div v-if="activeTab === 'overview'" class="tab-panel">
            <h3 class="tab-section-heading">
              <svg class="section-heading-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 3V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M16.5 7.5C16.5 6.11929 14.4853 5 12 5C9.51472 5 7.5 6.11929 7.5 7.5C7.5 8.88071 9.51472 10 12 10C14.4853 10 16.5 11.1193 16.5 12.5C16.5 13.8807 14.4853 15 12 15C9.51472 15 7.5 13.8807 7.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Financial Summary
            </h3>
            <div class="fin-cards-grid">
              <div class="fin-card fin-card-blue">
                <div class="fin-card-label">Loan Balance</div>
                <div class="fin-card-value">₱{{ formatNumber(summary?.loans?.total_remaining_balance || 0) }}</div>
                <div class="fin-card-sub">{{ summary?.loans?.active_count || 0 }} active / overdue loans</div>
              </div>
              <div class="fin-card fin-card-amber">
                <div class="fin-card-label">Machinery Outstanding</div>
                <div class="fin-card-value">₱{{ formatNumber(summary?.machinery?.outstanding_balance || 0) }}</div>
                <div class="fin-card-sub">{{ summary?.machinery?.unpaid_count || 0 }} unpaid bookings</div>
              </div>
            </div>
          </div>

          <!-- Personal Info Tab -->
          <div v-if="activeTab === 'personal'" class="tab-panel">
            <h3 class="tab-section-heading">
              <svg class="section-heading-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
                <path d="M4.5 20C4.5 16.9624 7.85786 14.5 12 14.5C16.1421 14.5 19.5 16.9624 19.5 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
              Personal Information
            </h3>
            <div class="personal-info-grid">
              <div class="pi-item"><div class="pi-label">Date of Birth</div><div class="pi-value">{{ formatDate(selectedFarmer.date_of_birth) }}</div></div>
              <div class="pi-item"><div class="pi-label">Educational Status</div><div class="pi-value">{{ selectedFarmer.educational_status || 'N/A' }}</div></div>
              <div class="pi-item"><div class="pi-label">Membership Status</div><div class="pi-value capitalize">{{ selectedFarmer.membership_status || 'N/A' }}</div></div>
              <div class="pi-item"><div class="pi-label">Membership Type</div><div class="pi-value">{{ selectedFarmer.membership_type || 'N/A' }}</div></div>
              <div class="pi-item"><div class="pi-label">Primary Crop</div><div class="pi-value">{{ selectedFarmer.primary_crop || 'N/A' }}</div></div>
              <div class="pi-item"><div class="pi-label">Land Area</div><div class="pi-value">{{ selectedFarmer.land_area ? selectedFarmer.land_area + ' sq.m' : 'N/A' }}</div></div>
              <div class="pi-item"><div class="pi-label">Farm Location</div><div class="pi-value">{{ selectedFarmer.farm_location || 'N/A' }}</div></div>
              <div class="pi-item"><div class="pi-label">Registered On</div><div class="pi-value">{{ formatDate(selectedFarmer.registered_on) }}</div></div>
              <div class="pi-item"><div class="pi-label">Last Activity</div><div class="pi-value">{{ formatDateTime(selectedFarmer.last_activity) || 'N/A' }}</div></div>
            </div>
          </div>

          <!-- Share Capital Tab -->
          <div v-if="activeTab === 'share'" class="tab-panel">
            <h3 class="tab-section-heading">
              <svg class="section-heading-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 3V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M16.5 7.5C16.5 6.11929 14.4853 5 12 5C9.51472 5 7.5 6.11929 7.5 7.5C7.5 8.88071 9.51472 10 12 10C14.4853 10 16.5 11.1193 16.5 12.5C16.5 13.8807 14.4853 15 12 15C9.51472 15 7.5 13.8807 7.5 12.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Share Capital
            </h3>
            <div class="share-cards-grid">
              <div class="fin-card fin-card-green">
                <div class="fin-card-label">Contributed</div>
                <div class="fin-card-value">₱{{ formatNumber(summary?.shareCapital?.totals?.total_contributed || 0) }}</div>
              </div>
              <div class="fin-card fin-card-red">
                <div class="fin-card-label">Withdrawn</div>
                <div class="fin-card-value">₱{{ formatNumber(summary?.shareCapital?.totals?.total_withdrawn || 0) }}</div>
              </div>
              <div class="fin-card fin-card-purple">
                <div class="fin-card-label">Balance</div>
                <div class="fin-card-value">₱{{ formatNumber(summary?.shareCapital?.totals?.balance || 0) }}</div>
              </div>
            </div>
          </div>

          <!-- Assistance Tab -->
          <div v-if="activeTab === 'assistance'" class="tab-panel">
            <h3 class="tab-section-heading">
              <svg class="section-heading-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8 12L10.5 14.5L16 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 3L19 7V12C19 16.4183 15.866 20.1744 12 21C8.13401 20.1744 5 16.4183 5 12V7L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
              Tulong na Natanggap <span class="count-chip">{{ summary?.assistance?.count || 0 }}</span>
            </h3>
            <div v-if="(summary?.assistance?.items || []).length" class="assistance-list">
              <div v-for="a in summary.assistance.items" :key="a.id" class="assistance-item">
                <div class="assist-left">
                  <div class="assist-type capitalize">{{ a.assistance_type }}</div>
                  <div class="assist-meta">{{ a.quantity }} {{ a.unit || '' }} • {{ formatDateTime(a.created_at) }}</div>
                </div>
                <span
                  class="assist-badge"
                  :class="(a.status === 'Confirmed Received' || a.status === 'confirmed_received') ? 'assist-confirmed' : 'assist-distributed'"
                >
                  {{ (a.status === 'Confirmed Received' || a.status === 'confirmed_received') ? 'Confirmed' : 'Distributed' }}
                </span>
              </div>
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon">
                <svg class="empty-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4 7.5C4 6.67157 4.67157 6 5.5 6H18.5C19.3284 6 20 6.67157 20 7.5V16.5C20 17.3284 19.3284 18 18.5 18H5.5C4.67157 18 4 17.3284 4 16.5V7.5Z" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M5 8L12 13L19 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="empty-text">No assistance records received yet.</div>
            </div>
          </div>

        </div><!-- /tab-content-area -->
      </div><!-- /profile-wrapper -->
    </div>
  </div>

</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const pageError = ref('')
const farmers = ref([])

const query = ref('')
const selectedFarmer = ref(null)

const loading = ref(false)
const summaryError = ref('')
const summary = ref(null)

const activeTab = ref('overview')
const copiedRef = ref(false)

const statusBadgeClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'approved') return 'badge-status-approved'
  if (s === 'pending')  return 'badge-status-pending'
  if (s === 'rejected') return 'badge-status-rejected'
  return 'badge-status-default'
}

const statusDotClass = (status) => {
  const s = (status || '').toLowerCase()
  if (s === 'approved') return 'status-dot-approved'
  if (s === 'pending')  return 'status-dot-pending'
  if (s === 'rejected') return 'status-dot-rejected'
  return 'status-dot-default'
}

const copyRefNumber = async () => {
  const val = selectedFarmer.value?.reference_number
  if (!val) return
  try {
    await navigator.clipboard.writeText(val)
    copiedRef.value = true
    setTimeout(() => { copiedRef.value = false }, 2000)
  } catch (e) {
    // Clipboard API unavailable
  }
}

// Helper function to get correct profile picture URL
// Handles both external Google URLs and local uploaded pictures
const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return null
  // Check if it's already a full URL (Google profile pictures start with https://)
  if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
    return profilePicture
  }
  // Otherwise, prepend localhost for uploaded pictures
  return `http://localhost:3000${profilePicture}`
}

const isAllowed = computed(() => {
  const role = authStore.currentUser?.role
  return ['admin', 'president', 'treasurer', 'agriculturist'].includes(role)
})

const fetchJson = async (url) => {
  const token = authStore.token
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`
    throw new Error(msg)
  }
  return data
}

const loadFarmers = async () => {
  pageError.value = ''
  try {
    const data = await fetchJson('/api/farmers')
    // Backend already applies barangay filtering for non-admin tokens.
    farmers.value = data.farmers || data || []
  } catch (e) {
    pageError.value = e.message || 'Failed to load farmers'
    farmers.value = []
  }
}

const filteredFarmers = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return (farmers.value || [])
    .filter(f => {
      const name = (f.full_name || '').toLowerCase()
      const refNo = (f.reference_number || '').toLowerCase()
      return name.includes(q) || refNo.includes(q)
    })
    .slice(0, 50)
})

const buildLoanSummary = (loans = []) => {
  const activeStatuses = new Set(['approved', 'active', 'overdue'])
  const active = loans.filter(l => activeStatuses.has(String(l.status || '').toLowerCase()))
  const totalRemaining = active.reduce((sum, l) => sum + parseFloat(l.remaining_balance || 0), 0)
  return { active_count: active.length, total_remaining_balance: parseFloat(totalRemaining.toFixed(2)) }
}

const refreshSummary = async () => {
  if (!selectedFarmer.value?.id) return
  loading.value = true
  summaryError.value = ''
  summary.value = null
  try {
    const farmerId = selectedFarmer.value.id
    const [assistanceRaw, shareCapitalRaw, loansRaw, machineryBalanceRaw] = await Promise.all([
      fetchJson(`/api/farmer-income/distribution/completed/${farmerId}`),
      fetchJson(`/api/share-capital/farmer/${farmerId}`),
      fetchJson(`/api/loans/farmer/${farmerId}?deviceDate=${new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0')}`),
      fetchJson(`/api/machinery/bookings/farmer-balance/${farmerId}`)
    ])

    const loansList = loansRaw?.loans || []
    const unpaidBookings = machineryBalanceRaw?.unpaid_bookings || []

    summary.value = {
      assistance: {
        count: Array.isArray(assistanceRaw) ? assistanceRaw.length : 0,
        items: Array.isArray(assistanceRaw) ? assistanceRaw : []
      },
      shareCapital: shareCapitalRaw || null,
      loans: buildLoanSummary(loansList),
      machinery: {
        outstanding_balance: machineryBalanceRaw?.total_outstanding_balance || 0,
        unpaid_count: unpaidBookings.length
      }
    }
  } catch (e) {
    summaryError.value = e.message || 'Failed to load summary'
  } finally {
    loading.value = false
  }
}

const selectFarmer = async (f) => {
  selectedFarmer.value = f
  activeTab.value = 'overview'
  // Fetch complete farmer profile to get all fields including primary_crop, membership_type, last_activity
  try {
    const fullProfile = await fetchJson(`/api/farmers/${f.id}/profile`)
    if (fullProfile) {
      selectedFarmer.value = { ...selectedFarmer.value, ...fullProfile }
    }
  } catch (e) {
    console.error('Could not fetch full profile:', e.message)
    // Continue with partial data if full profile fetch fails
  }
  await refreshSummary()
}

const resetSelection = () => {
  selectedFarmer.value = null
  summary.value = null
  summaryError.value = ''
  activeTab.value = 'overview'
}

const formatNumber = (num) => new Intl.NumberFormat('en-PH').format(num || 0)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }
  if (!isAllowed.value) {
    router.push('/dashboard')
    return
  }
  await loadFarmers()
})
</script>

<style scoped>
/* Back to Members Dashboard button */
.back-to-members-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: linear-gradient(135deg, rgba(14,25,19,0.97), rgba(10,19,15,0.96));
  border: 1px solid rgba(74, 222, 128, 0.40);
  border-radius: 10px;
  color: #86efac;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s ease;
  box-shadow: 0 2px 10px rgba(0,0,0,0.25), 0 0 0 0 rgba(74,222,128,0);
  letter-spacing: 0.3px;
}

.back-to-members-btn:hover {
  background: linear-gradient(135deg, rgba(22,163,74,0.45), rgba(16,120,54,0.55));
  border-color: rgba(74, 222, 128, 0.65);
  color: #ecfdf5;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3), 0 0 0 3px rgba(74,222,128,0.12);
  transform: translateY(-1px);
}

.back-to-members-btn:active {
  transform: translateY(0);
}

.back-btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.action-icon,
.tab-pill-icon,
.section-heading-icon,
.tile-icon-svg,
.copy-icon-svg,
.empty-icon-svg,
.avatar-fallback-icon {
  display: block;
  flex-shrink: 0;
}

.action-icon,
.tab-pill-icon,
.back-btn-icon {
  width: 16px;
  height: 16px;
}

.section-heading-icon {
  width: 18px;
  height: 18px;
}

.tile-icon-svg {
  width: 18px;
  height: 18px;
}

.copy-icon-svg {
  width: 15px;
  height: 15px;
}

.empty-icon-svg {
  width: 48px;
  height: 48px;
  margin: 0 auto;
}

.avatar-fallback-icon {
  width: 20px;
  height: 20px;
  color: rgba(220, 252, 231, 0.82);
}

.avatar-fallback-icon-lg {
  width: 34px;
  height: 34px;
}

/* Search results table */
.search-results-table {
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  width: 100%;
  max-width: 100%;
}

/* Prevent global image rules from stretching profile avatars */
.profile-avatar {
  width: 96px !important;
  height: 96px !important;
  min-width: 96px !important;
  min-height: 96px !important;
  max-width: 96px !important;
  max-height: 96px !important;
  border-radius: 9999px !important;
  object-fit: cover !important;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.modal-profile-avatar {
  width: 128px !important;
  height: 128px !important;
  min-width: 128px !important;
  min-height: 128px !important;
  max-width: 128px !important;
  max-height: 128px !important;
  border-radius: 9999px !important;
  object-fit: cover !important;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.search-results-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(161, 192, 176, 0.95);
  color: #1f4b3a;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  padding: 12px 10px;
  border-right: 1px solid rgba(120, 150, 136, 0.45);
  border-bottom: 1px solid rgba(120, 150, 136, 0.55);
}

.search-results-table thead th:last-child {
  border-right: none;
}

.search-results-table tbody td {
  padding: 18px 12px;
  font-size: 14px;
  color: #edf8f1;
  text-align: center;
  border-right: 1px solid rgba(120, 150, 136, 0.35);
  border-bottom: 1px solid rgba(120, 150, 136, 0.35);
  background: rgba(176, 196, 190, 0.10);
  white-space: normal;
  overflow-wrap: anywhere;
}

.search-results-table tbody td:nth-child(5) {
  white-space: normal;
  line-height: 1.4;
}

.search-results-table tbody td:last-child {
  border-right: none;
}

.name-cell {
  text-align: center !important;
}

.name-primary {
  font-size: 16px;
  font-weight: 700;
  color: #f4fff8;
  line-height: 1.25;
}

.name-secondary {
  margin-top: 4px;
  font-size: 12px;
  text-transform: capitalize;
  color: rgba(210, 236, 220, 0.78);
}

.resume-cell {
  text-align: left !important;
}

.resume-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(210, 236, 220, 0.68);
}

.resume-value {
  display: block;
  margin-top: 3px;
  font-size: 14px;
  font-weight: 600;
  color: #edf8f1;
  line-height: 1.35;
}

.result-row {
  cursor: pointer;
  transition: background 0.2s ease;
}

.result-row:hover td {
  background: rgba(176, 196, 190, 0.18);
}

.photo-cell {
  min-width: 96px;
}

.row-avatar {
  width: 54px;
  height: 54px;
  border-radius: 9999px;
  object-fit: cover;
  margin: 0 auto;
  display: block;
}

.row-avatar-fallback {
  background: rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

/* ── Dark green theme override ── */

/* Page background */
.min-h-screen {
  background: linear-gradient(145deg, #0a1a0f 0%, #0f2518 30%, #163020 60%, #1c3d28 100%) !important;
}

/* Page title & subtitle */
h1, .text-gray-800 { color: #ffffff !important; }
.text-gray-500 { color: rgba(200, 235, 210, 0.7) !important; }

/* Back button */
button.border { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.18) !important; color: #ffffff !important; }

/* Search & list container */
.bg-white {
  background: rgba(20, 45, 28, 0.95) !important;
  border-color: rgba(100, 200, 130, 0.18) !important;
  color: #ffffff !important;
}

/* Search input */
input[type="text"] {
  background: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(100, 200, 130, 0.3) !important;
  color: #ffffff !important;
}
input[type="text"]::placeholder { color: rgba(200, 235, 210, 0.5) !important; }

/* Farmer list items */
button.w-full.text-left {
  background: transparent !important;
  border-color: rgba(100, 200, 130, 0.15) !important;
}
button.w-full.text-left:hover { background: rgba(255,255,255,0.06) !important; }
.text-gray-900 { color: #ffffff !important; }

/* Profile header gradient */
.bg-gradient-to-r {
  background: linear-gradient(135deg, rgba(18, 50, 30, 0.98), rgba(25, 65, 40, 0.98)) !important;
  border-color: rgba(100, 200, 130, 0.15) !important;
}

/* Info boxes in profile header */
.bg-white.rounded-lg {
  background: rgba(15, 38, 22, 0.9) !important;
  border-color: rgba(100, 200, 130, 0.2) !important;
}

/* All label text */
.text-gray-500, .text-xs.font-semibold.text-gray-500 { color: rgba(180, 230, 195, 0.7) !important; }
.text-gray-600, .text-gray-700 { color: rgba(200, 235, 210, 0.85) !important; }

/* Value text in boxes */
.text-indigo-600, .text-blue-600, .text-green-600, .text-yellow-600,
.text-blue-900, .text-amber-900, .text-green-900, .text-red-900, .text-purple-900 {
  color: #ffffff !important;
}

/* Section headers */
h3 { color: #ffffff !important; }

/* Divider lines */
.border-t { border-color: rgba(100, 200, 130, 0.15) !important; }

/* Financial & share capital boxes */
.border-2 {
  border-color: rgba(100, 200, 130, 0.25) !important;
}
.bg-blue-50, .bg-amber-50, .bg-green-50, .bg-red-50, .bg-purple-50 {
  background: rgba(18, 50, 30, 0.85) !important;
}
.text-blue-600, .text-amber-600, .text-green-600, .text-red-600, .text-purple-600 {
  color: rgba(160, 230, 185, 0.9) !important;
}
.text-blue-700, .text-amber-700 { color: rgba(200, 235, 210, 0.8) !important; }

/* Assistance items */
.bg-gray-50 { background: rgba(18, 50, 30, 0.7) !important; border-color: rgba(100, 200, 130, 0.15) !important; }
.bg-gray-50:hover { background: rgba(25, 65, 40, 0.9) !important; }

/* Empty state */
.text-gray-500 { color: rgba(200, 235, 210, 0.6) !important; }

/* Error box */
.bg-red-50 { background: rgba(80, 10, 10, 0.6) !important; }

/* Refresh button */
button.border-2.border-indigo-300 {
  background: rgba(255,255,255,0.07) !important;
  border-color: rgba(100, 200, 130, 0.4) !important;
  color: #aff5c8 !important;
}
button.border-2.border-indigo-300:hover { background: rgba(100, 200, 130, 0.12) !important; }

/* Membership badge */
.bg-blue-100 { background: rgba(30, 80, 120, 0.5) !important; }
.bg-gray-100 { background: rgba(255,255,255,0.08) !important; }
.text-blue-800 { color: #a5d8f5 !important; }
.text-gray-700 { color: rgba(200, 235, 210, 0.85) !important; }

/* Confirmed badge */
.bg-green-100 { background: rgba(20, 90, 45, 0.5) !important; }
.text-green-800 { color: #a8f0c0 !important; }

/* ══════════════════════════════════════════════════════
   FARMER PROFILE REDESIGN — Modern Card UI
   ══════════════════════════════════════════════════════ */

.profile-wrapper {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Hero Card ── */
.profile-hero {
  background: linear-gradient(145deg, #0d2416 0%, #112b1a 50%, #163520 100%);
  border: 1px solid rgba(100, 200, 130, 0.22);
  border-radius: 20px;
  padding: 26px 28px 24px;
  box-shadow: 0 4px 28px rgba(0, 0, 0, 0.4);
}

.hero-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(100, 200, 130, 0.28);
  border-radius: 10px;
  color: #a8f0c0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.refresh-btn:hover:not(:disabled) { background: rgba(100, 200, 130, 0.13); }
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.hero-actions { display: flex; gap: 10px; }

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-edit  { background: rgba(59,130,246,0.14); color: #93c5fd; border: 1px solid rgba(59,130,246,0.28); }
.btn-edit:hover  { background: rgba(59,130,246,0.24); }
.btn-delete { background: rgba(239,68,68,0.12); color: #fca5a5; border: 1px solid rgba(239,68,68,0.24); }
.btn-delete:hover { background: rgba(239,68,68,0.22); }

/* Identity row */
.hero-identity {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-bottom: 26px;
}

.hero-avatar-wrap { position: relative; flex-shrink: 0; }

.hero-avatar {
  width: 96px !important; height: 96px !important;
  min-width: 96px !important; min-height: 96px !important;
  max-width: 96px !important; max-height: 96px !important;
  border-radius: 9999px !important;
  object-fit: cover !important;
  border: 3px solid rgba(100, 200, 130, 0.5) !important;
  box-shadow: 0 0 0 5px rgba(100, 200, 130, 0.1) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.hero-avatar-fallback {
  background: rgba(28, 65, 42, 0.9);
  font-size: 38px;
}

.row-avatar-fallback,
.hero-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-status-ring {
  position: absolute;
  bottom: 4px; right: 4px;
  width: 16px; height: 16px;
  border-radius: 9999px;
  border: 2.5px solid #0d2416;
}
.status-dot-approved { background: #22c55e; }
.status-dot-pending  { background: #eab308; }
.status-dot-rejected { background: #ef4444; }
.status-dot-default  { background: #6b7280; }

.hero-info { flex: 1; min-width: 0; }
.hero-name {
  font-size: 26px;
  font-weight: 800;
  color: #f0fdf4;
  line-height: 1.2;
  margin: 0 0 10px;
  word-break: break-word;
}
.hero-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 13px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.03em;
}
.badge-dot { width: 7px; height: 7px; border-radius: 9999px; flex-shrink: 0; }

.badge-role           { background: rgba(100,200,130,0.14); border: 1px solid rgba(100,200,130,0.32); color: #a8f0c0; }
.badge-status-approved{ background: rgba(34,197,94,0.14);  border: 1px solid rgba(34,197,94,0.32);  color: #86efac; }
.badge-status-pending { background: rgba(234,179,8,0.14);  border: 1px solid rgba(234,179,8,0.32);  color: #fde047; }
.badge-status-rejected{ background: rgba(239,68,68,0.14);  border: 1px solid rgba(239,68,68,0.28);  color: #fca5a5; }
.badge-status-default { background: rgba(107,114,128,0.14);border: 1px solid rgba(107,114,128,0.28);color: #d1d5db; }

.hero-since { font-size: 12px; color: rgba(200,235,210,0.5); margin: 0; }

/* Quick Info Grid */
.quick-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
@media (max-width: 640px) {
  .quick-info-grid { grid-template-columns: 1fr; }
  .hero-identity    { flex-direction: column; align-items: flex-start; }
  .fin-cards-grid, .share-cards-grid { grid-template-columns: 1fr !important; }
  .personal-info-grid { grid-template-columns: 1fr !important; }
}

.info-tile {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(255,255,255,0.035);
  border: 1px solid rgba(100,200,130,0.14);
  border-radius: 12px;
  padding: 14px 16px;
  transition: all 0.2s ease;
}
.info-tile:hover {
  background: rgba(100,200,130,0.07);
  border-color: rgba(100,200,130,0.26);
  transform: translateY(-1px);
}

.info-tile-icon {
  width: 34px; height: 34px;
  background: rgba(100,200,130,0.1);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; color: #a8f0c0;
  flex-shrink: 0;
}
.info-tile-body { flex: 1; min-width: 0; }
.info-tile-label {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  color: rgba(200,235,210,0.52);
  margin-bottom: 3px;
}
.info-tile-value {
  font-size: 14px; font-weight: 600;
  color: #edf8f1; line-height: 1.35; word-break: break-word;
}
.info-tile-value-row { display: flex; align-items: center; gap: 8px; }
.ref-highlight { font-size: 14px; font-weight: 700; color: #86efac; font-family: monospace; }

.copy-btn {
  background: rgba(100,200,130,0.11);
  border: 1px solid rgba(100,200,130,0.24);
  border-radius: 6px; color: #a8f0c0;
  font-size: 14px; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
}
.copy-btn:hover { background: rgba(100,200,130,0.22); }

/* Profile Error */
.profile-error {
  padding: 12px 16px;
  background: rgba(80,10,10,0.6);
  border: 1px solid rgba(239,68,68,0.28);
  border-radius: 10px; color: #fca5a5; font-size: 14px;
}

/* ── Tab Navigation ── */
.profile-tabs-nav {
  display: flex; gap: 6px; flex-wrap: wrap;
  background: rgba(10, 24, 15, 0.7);
  padding: 7px; border-radius: 14px;
  border: 1px solid rgba(100,200,130,0.12);
}
.tab-pill {
  flex: 1; min-width: 90px;
  padding: 10px 14px; border-radius: 10px;
  font-size: 13px; font-weight: 600;
  color: rgba(200,235,210,0.6);
  background: transparent; border: none;
  cursor: pointer; transition: all 0.2s ease;
  text-align: center; white-space: nowrap;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
}
.tab-pill:hover:not(.active) { background: rgba(100,200,130,0.08); color: rgba(200,235,210,0.9); }
.tab-pill.active {
  background: rgba(100,200,130,0.18);
  color: #a8f0c0;
  box-shadow: 0 1px 6px rgba(0,0,0,0.25);
}

/* ── Tab Content Area ── */
.tab-content-area {
  background: rgba(10, 24, 15, 0.6);
  border: 1px solid rgba(100,200,130,0.12);
  border-radius: 16px; padding: 24px;
}
.tab-panel { animation: fadeInTab 0.22s ease; }
@keyframes fadeInTab {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tab-section-heading {
  font-size: 17px; font-weight: 700; color: #d1fae5;
  margin: 0 0 18px; display: flex; align-items: center; gap: 8px;
}

/* Financial & Share Cards */
.fin-cards-grid   { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.share-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

.fin-card {
  padding: 20px 22px; border-radius: 14px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
.fin-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,0.3); }

.fin-card-blue   { background: rgba(28,60,118,0.38);  border-color: rgba(59,130,246,0.24); }
.fin-card-amber  { background: rgba(118,78,18,0.38);  border-color: rgba(245,158,11,0.24); }
.fin-card-green  { background: rgba(18,76,42,0.48);   border-color: rgba(34,197,94,0.24); }
.fin-card-red    { background: rgba(100,18,18,0.38);  border-color: rgba(239,68,68,0.24); }
.fin-card-purple { background: rgba(74,28,148,0.3);   border-color: rgba(168,85,247,0.24); }

.fin-card-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  color: rgba(200,235,210,0.58); margin-bottom: 8px;
}
.fin-card-value {
  font-size: 26px; font-weight: 800;
  color: #f0fdf4; line-height: 1.1; margin-bottom: 6px;
}
.fin-card-sub { font-size: 12px; color: rgba(200,235,210,0.55); }

/* Personal Info Grid */
.personal-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 11px; }

.pi-item {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(100,200,130,0.13);
  border-radius: 10px; padding: 13px 15px;
  transition: all 0.2s ease;
}
.pi-item:hover { background: rgba(100,200,130,0.06); }
.pi-label {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  color: rgba(200,235,210,0.52); margin-bottom: 4px;
}
.pi-value { font-size: 14px; font-weight: 600; color: #edf8f1; line-height: 1.35; }

/* Assistance List */
.assistance-list {
  display: flex; flex-direction: column; gap: 9px;
  max-height: 420px; overflow-y: auto;
}
.assistance-item {
  display: flex; align-items: center;
  justify-content: space-between; gap: 12px;
  padding: 14px 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(100,200,130,0.13);
  border-radius: 10px; transition: all 0.2s ease;
}
.assistance-item:hover { background: rgba(100,200,130,0.07); }
.assist-left { flex: 1; min-width: 0; }
.assist-type { font-size: 14px; font-weight: 600; color: #edf8f1; }
.assist-meta { font-size: 12px; color: rgba(200,235,210,0.58); margin-top: 3px; }
.assist-badge {
  flex-shrink: 0; padding: 4px 12px; border-radius: 9999px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.assist-confirmed  { background: rgba(18,86,44,0.5);  color: #a8f0c0; border: 1px solid rgba(34,197,94,0.24); }
.assist-distributed{ background: rgba(28,62,118,0.5); color: #93c5fd; border: 1px solid rgba(59,130,246,0.24); }

/* Count Chip */
.count-chip {
  display: inline-block;
  background: rgba(100,200,130,0.18); color: #a8f0c0;
  border-radius: 9999px; padding: 2px 10px;
  font-size: 13px; font-weight: 700; margin-left: 8px; vertical-align: middle;
}

/* Empty State */
.empty-state { text-align: center; padding: 48px 24px; color: rgba(200,235,210,0.45); }
.empty-icon  { margin-bottom: 12px; }
.empty-text  { font-size: 14px; }
</style>
