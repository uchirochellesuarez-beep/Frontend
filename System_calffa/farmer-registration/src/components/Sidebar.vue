<template>
  <div class="sidebar-wrapper" v-if="!isNonMember">
    <!-- Sidebar Navigation -->
    <nav :class="['sidebar', { 'farmer-theme': isFarmer }]">
      <div class="backdrop-sidebar" :class="isFarmer ? 'backdrop-theme-farmer' : 'backdrop-theme'"></div>

    <!-- Logo Header -->
    <div class="sidebar-header">
      <div class="calffa-logo-container">
        <div class="logo-img-wrap">
          <div class="logo-ring-outer"></div>
          <div class="logo-ring-inner"></div>
          <img
            src="https://tse1.mm.bing.net/th/id/OIP.6bwLRZ62anox4000YCXuQwAAAA?rs=1&pid=ImgDetMain&o=7&rm=3"
            alt="CaLFFA Logo"
            class="calffa-logo-img"
          />
        </div>
        <div class="calffa-text">
          <div class="calffa-brand">CaLFFA</div>
          <div class="calffa-tagline">Cooperative Farmers</div>
          <div class="calffa-divider"></div>
        </div>
      </div>
    </div>

    <!-- Navigation Sections with Grouped Items -->
    <div class="nav-sections">
      <!-- FARM MANAGEMENT Section -->
      <div class="nav-section">
        <div class="section-header">
          <span class="section-title">FARM MANAGEMENT</span>
        </div>
        <ul class="nav-list">
          <li
            v-for="item in farmManagementItems"
            :key="item.route"
            :class="{ active: isActiveRoute(item.route) }"
            @click="handleMenuClick(item)"
          >
            <router-link class="nav-link" :to="item.route" :aria-label="item.text">
              <component :is="item.icon" class="icon-component" size="20" color="currentColor"></component>
              <span class="text">{{ item.text }}</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- OPERATIONS Section -->
      <div class="nav-section" v-if="!isBarangayManagpi">
        <div class="section-header">
          <span class="section-title">OPERATIONS</span>
        </div>
        <ul class="nav-list">
          <li
            v-for="item in operationsItems"
            :key="item.route"
            :class="{ active: isActiveRoute(item.route) }"
            @click="handleMenuClick(item)"
          >
            <router-link class="nav-link" :to="item.route" :aria-label="item.text">
              <component :is="item.icon" class="icon-component" size="20" color="currentColor"></component>
              <span class="text">{{ item.text }}</span>
              <span 
                v-if="item.badge" 
                class="nav-badge"
              >
                {{ item.badge }}
              </span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Community Section (Farmers and eligible officers) -->
      <div class="nav-section" v-if="canCommunity && !isBarangayManagpi">
        <div class="section-header">
          <span class="section-title">COMMUNITY</span>
        </div>
        <ul class="nav-list">
          <li
            v-for="item in communityItems"
            :key="item.route"
            :class="{ active: isActiveRoute(item.route) }"
            @click="handleMenuClick(item)"
          >
            <router-link class="nav-link" :to="item.route" :aria-label="item.text">
              <component :is="item.icon" class="icon-component" size="20" color="currentColor"></component>
              <span class="text">{{ item.text }}</span>
              <span 
                v-if="item.badge" 
                class="nav-badge"
              >
                {{ item.badge }}
              </span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Member Management Section (Admin and President only) -->
      <div class="nav-section" v-if="canManageMembers">
        <div class="section-header">
          <span class="section-title">MEMBER MANAGEMENT</span>
        </div>
        <ul class="nav-list">
          <li
            :class="{ active: isActiveRoute('/farmers-table') }"
            @click="handleMenuClick({ text: 'Members', route: '/farmers-table' })"
          >
            <router-link class="nav-link" to="/farmers-table" aria-label="Members">
              <MembersIcon class="icon-component" size="20" color="currentColor"></MembersIcon>
              <span class="text">Members</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Loan Management Section (Treasurer and President only) -->
      <div class="nav-section" v-if="canManageLoans && !isAdmin && !isBarangayManagpi">
        <div class="section-header">
          <span class="section-title">LOAN MANAGEMENT</span>
        </div>
        <ul class="nav-list">
          <li
            :class="{ active: isActiveRoute('/admin-loans') }"
            @click="handleMenuClick({ text: 'Loan Management', route: '/admin-loans' })"
          >
            <router-link class="nav-link" to="/admin-loans" aria-label="Loan Management">
              <MoneyIcon class="icon-component" size="20" color="currentColor"></MoneyIcon>
              <span class="text">Loan Management</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Machinery Management Section (President only) -->
      <div class="nav-section" v-if="isPresident && !isAdmin && !isBarangayManagpi">
        <div class="section-header">
          <span class="section-title">MACHINERY MANAGEMENT</span>
        </div>
        <ul class="nav-list">
          <li
            :class="{ active: isActiveRoute('/machinery-management') }"
            @click="handleMenuClick({ text: 'Machinery Management System', route: '/machinery-management' })"
          >
            <router-link class="nav-link" to="/machinery-management" aria-label="Machinery Management System">
              <MachineryIcon class="icon-component" size="20" color="currentColor"></MachineryIcon>
              <span class="text">Machinery Management System</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Farmer Income Section (President, Officers, Agriculturist) -->
      <div class="nav-section" v-if="canAccessFarmerIncomeHub && !isAdmin && !isBarangayManagpi">
        <div class="section-header">
          <span class="section-title">KITA NG MAGSASAKA</span>
        </div>
        <ul class="nav-list">
          <li
            :class="{ active: isActiveRoute('/farmer-income-hub') }"
            @click="handleMenuClick({ text: 'Farmer Income Records', route: '/farmer-income-hub' })"
          >
            <router-link class="nav-link" to="/farmer-income-hub" aria-label="Farmer Income Records">
              <DocumentIcon class="icon-component" size="20" color="currentColor"></DocumentIcon>
              <span class="text">Farmer Income Records</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Members Summary (Agriculturist) -->
      <div class="nav-section" v-if="canViewMembersSummary && !isBarangayManagpi">
        <div class="section-header">
          <span class="section-title">MEMBERS</span>
        </div>
        <ul class="nav-list">
          <li
            :class="{ active: isActiveRoute('/members-summary') }"
            @click="handleMenuClick({ text: 'Members Summary', route: '/members-summary' })"
          >
            <router-link class="nav-link" to="/members-summary" aria-label="Members Summary">
              <MembersIcon class="icon-component" size="20" color="currentColor"></MembersIcon>
              <span class="text">Members Summary</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Insights Section -->
      <div class="nav-section">
        <div class="section-header">
          <span class="section-title">INSIGHTS</span>
        </div>
        <ul class="nav-list">
          <li
            v-for="item in insightsItems"
            :key="item.route"
            :class="{ active: isActiveRoute(item.route) }"
            @click="handleMenuClick(item)"
          >
            <router-link class="nav-link" :to="item.route" :aria-label="item.text">
              <component :is="item.icon" class="icon-component" size="20" color="currentColor"></component>
              <span class="text">{{ item.text }}</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Admin Section (if admin) -->
      <div class="nav-section" v-if="isAdmin">
        <div class="section-header">
          <span class="section-title">ADMIN</span>
        </div>
        <ul class="nav-list">
          <li
            v-for="item in adminItems"
            :key="item.route"
            :class="{ active: isActiveRoute(item.route) }"
            @click="handleMenuClick(item)"
          >
            <router-link class="nav-link" :to="item.route" :aria-label="item.text">
              <component :is="item.icon" class="icon-component" size="20" color="currentColor"></component>
              <span class="text">{{ item.text }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </div>

  </nav>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import DashboardIcon from "./icons/DashboardIcon.vue";
import MachineryIcon from "./icons/MachineryIcon.vue";
import MoneyIcon from "./icons/MoneyIcon.vue";
import MembersIcon from "./icons/MembersIcon.vue";
import DocumentIcon from "./icons/DocumentIcon.vue";
import ApprovalIcon from "./icons/ApprovalIcon.vue";
import BankIcon from "./icons/BankIcon.vue";
import NewsIcon from "./icons/NewsIcon.vue";
import AnnouncementIcon from "./icons/AnnouncementIcon.vue";
import FarmIcon from "./icons/FarmIcon.vue";
import SettingsIcon from "./icons/SettingsIcon.vue";
import AnalyticsIcon from "./icons/AnalyticsIcon.vue";

const emit = defineEmits(['menu-click', 'active-menu', 'toggle']);

const route = useRoute();
const authStore = useAuthStore();
const isCollapsed = ref(false);

const currentUser = computed(() => authStore.currentUser);
const isAdmin = computed(() => currentUser.value?.role === 'admin');
const isPresident = computed(() => currentUser.value?.role === 'president');
const isOperator = computed(() => currentUser.value?.role === 'operator');
const isFarmer = computed(() => currentUser.value?.role === 'farmer');
const isOfficer = computed(() => {
  const role = currentUser.value?.role;
  return ['president', 'treasurer', 'auditor', 'agriculturist'].includes(role);
});
const canManageApprovals = computed(() => {
  const role = currentUser.value?.role;
  return ['operator', 'operation_manager', 'business_manager'].includes(role);
});
const canManageFinancial = computed(() => {
  const role = currentUser.value?.role;
  return ['admin', 'president', 'treasurer'].includes(role);
});
const canViewBlockchainAudit = computed(() => {
  const role = currentUser.value?.role;
  return ['admin', 'president', 'treasurer', 'auditor'].includes(role);
});
const canManageMembers = computed(() => {
  // Admin and President can manage members
  const role = currentUser.value?.role;
  return ['admin', 'president'].includes(role);
});

const canViewMembersSummary = computed(() => {
  // Agriculturist can view barangay-scoped member summaries
  const role = currentUser.value?.role;
  return role === 'agriculturist';
});
const canManageLoans = computed(() => {
  // Admin, Treasurer, and President can manage loans
  const role = currentUser.value?.role;
  return ['admin', 'treasurer', 'president'].includes(role);
});
const canAccessFarmerIncome = computed(() => {
  // All officers (President, Treasurer, Auditor) can view eligible farmer income records
  // Agriculturist and Admin excluded
  const role = currentUser.value?.role;
  return ['president', 'treasurer', 'auditor'].includes(role);
});
const canVerifyFarmerIncome = computed(() => {
  // Only President can verify submitted income records
  const role = currentUser.value?.role;
  return role === 'president';
});
const canReviewFarmerIncome = computed(() => {
  // Only Agriculturist can review and manage distribution for eligible records
  const role = currentUser.value?.role;
  return role === 'agriculturist';
});

const canAccessFarmerIncomeHub = computed(() => {
  // President, Officers, and Agriculturist can access the farmer income hub
  const role = currentUser.value?.role;
  return ['president', 'treasurer', 'auditor', 'agriculturist'].includes(role);
});

const canCommunity = computed(() => {
  // Farmers and officers (except agriculturist) can see community section for loans
  const role = currentUser.value?.role;
  return ['farmer', 'treasurer', 'president', 'operation_manager', 'business_manager', 'operator'].includes(role);
});

// Check if user is from Managpi barangay (id = 2) - transactions not available
const isBarangayManagpi = computed(() => {
  return currentUser.value?.barangay_id === 2;
});

// Check if user is a non-member - non-members don't have sidebar access
const isNonMember = computed(() => {
  return currentUser.value?.membership_status === 'non-member';
});

// Handle menu item click
const handleMenuClick = (item) => {
  emit('menu-click', { route: item.route, item });
  emit('active-menu', { activeRoute: item.route, item });
};

// Navigation items organized by category
const farmManagementItems = [
  { text: "Dashboard", route: "/dashboard", icon: DashboardIcon },
];

const operationsItems = computed(() => {
  const items = [];
  const role = currentUser.value?.role;
  
  // Machinery Booking for farmers only (and admins can see all)
  if (!isAdmin.value && currentUser.value?.role === 'farmer') {
    items.push({ text: "Machinery Booking", route: "/machinery-booking", icon: MachineryIcon });
  }
  
  // Machinery Approval for operators, operation managers, business managers, and admins
  if (canManageApprovals.value && !isAdmin.value) {
    items.push({ text: "Machinery Approval", route: "/machinery-approval", icon: ApprovalIcon });
  }

  // Machinery Financial Management for admin, president, and treasurer
  if (canManageFinancial.value) {
    items.push({ text: "Machinery Financial", route: "/machinery-financial", icon: MoneyIcon });
  }

  // Share Capital (Savings) for farmer + financial officers
  if (['admin', 'farmer', 'treasurer', 'president'].includes(role)) {
    items.push({ text: 'Share Capital', route: '/share-capital', icon: BankIcon });
  }
  
  return items;
});

const communityItems = computed(() => {
  const role = currentUser.value?.role;
  const items = [];
  
  // Loans - different route for officers vs farmers
  if (role === 'farmer') {
    items.push({ text: "Loans", route: "/loan", icon: MoneyIcon });
  } else if (['treasurer', 'president', 'operation_manager', 'business_manager', 'operator'].includes(role)) {
    items.push({ text: "Loans", route: "/officer-loans", icon: MoneyIcon });
  }
  
  // Kita sa Pagsasaka - for farmers and officers (except admin/agriculturist)
  if (role === 'farmer') {
    items.push({ text: "Kita sa Pagsasaka", route: "/farmer-income", icon: FarmIcon });
  } else if (['president', 'treasurer', 'auditor'].includes(role)) {
    items.push({ text: "Kita sa Pagsasaka", route: "/farmer-income", icon: FarmIcon });
  }
  
  return items;
});

const insightsItems = [
  { text: "News", route: "/news", icon: NewsIcon, badge: null },
  { text: "Announcements", route: "/announcement", icon: AnnouncementIcon, badge: 1 },
];

const adminItems = [
  // { text: "Barangays", route: "/barangays", icon: BankIcon, badge: null },  // REMOVED - Barangays are now fixed
  { text: "Loan Management", route: "/admin-loans", icon: MoneyIcon, badge: null },
  { text: "Machinery Management", route: "/machinery-management", icon: MachineryIcon, badge: null },
  { text: "System Activity", route: "/system-activity", icon: DocumentIcon, badge: null },
  { text: "Financial Overview", route: "/financial-overview", icon: MoneyIcon, badge: null },
];

const isActiveRoute = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

</script>

<style scoped>
/* Sidebar Wrapper */
.sidebar-wrapper {
  position: relative;
  height: 100%;
}

.sidebar {
  position: fixed;
  top: 70px;
  left: 0;
  width: 260px;
  height: calc(100vh - 70px);
  background: linear-gradient(
    168deg,
    #0b1610 0%,
    #10251a 22%,
    #153226 48%,
    #1a3d2e 72%,
    #1f4a38 100%
  );
  color: white;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-shadow:
    18px 0 40px rgba(4, 12, 8, 0.55),
    6px 0 16px rgba(0, 0, 0, 0.22),
    inset -1px 0 0 rgba(255, 255, 255, 0.07),
    inset 1px 0 0 rgba(0, 0, 0, 0.45);
  border-right: 1px solid rgba(52, 90, 68, 0.45);
  z-index: 999;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* Ensure sidebar stays fixed and doesn't resize */
  will-change: width;
  backface-visibility: hidden;
  transform: translateZ(0);
  /* Prevent sidebar from moving during scroll */
  position: fixed !important;
}

.sidebar.farmer-theme {
  background: linear-gradient(
    168deg,
    #3d2618 0%,
    #4a301f 24%,
    #5a3a26 52%,
    #68452c 78%,
    #745032 100%
  );
  border-right: 1px solid rgba(200, 155, 108, 0.32);
  box-shadow:
    18px 0 40px rgba(18, 10, 6, 0.52),
    6px 0 16px rgba(0, 0, 0, 0.2),
    inset -1px 0 0 rgba(255, 233, 205, 0.07),
    inset 1px 0 0 rgba(0, 0, 0, 0.42);
}

.sidebar .backdrop-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.14;
  mix-blend-mode: multiply;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(ellipse 90% 55% at 18% 8%, rgba(74, 222, 128, 0.12) 0%, transparent 42%),
    radial-gradient(ellipse 70% 50% at 88% 92%, rgba(250, 204, 21, 0.08) 0%, transparent 40%),
    repeating-linear-gradient(
      145deg,
      transparent,
      transparent 40px,
      rgba(255, 255, 255, 0.018) 40px,
      rgba(255, 255, 255, 0.018) 80px
    );
  pointer-events: none;
  opacity: 0.22;
}

.sidebar.farmer-theme::before {
  background-image:
    radial-gradient(ellipse 90% 55% at 15% 10%, rgba(252, 211, 77, 0.1) 0%, transparent 45%),
    radial-gradient(ellipse 70% 50% at 90% 90%, rgba(134, 239, 172, 0.06) 0%, transparent 42%),
    repeating-linear-gradient(
      145deg,
      transparent,
      transparent 40px,
      rgba(255, 255, 255, 0.02) 40px,
      rgba(255, 255, 255, 0.02) 80px
    );
}

.sidebar-header {
  padding: 1.35rem 1.15rem 1.25rem;
  border-bottom: none;
  position: relative;
  background: transparent;
  margin-bottom: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  overflow: hidden;
}

.sidebar-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background: transparent;
  pointer-events: none;
}

.calffa-logo-container {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.toggle-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease, filter 0.28s ease;
  flex-shrink: 0;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  filter: brightness(1.08);
  transform: scale(1.04);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.18),
    0 0 18px rgba(74, 222, 128, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.toggle-btn:active {
  transform: scale(0.95);
}

.toggle-icon {
  font-weight: 700;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar.collapsed .calffa-text {
  display: none;
}

.sidebar.collapsed .calffa-logo-container {
  justify-content: center;
}

.sidebar.collapsed .section-header {
  display: none;
}

.sidebar.collapsed .text,
.sidebar.collapsed .nav-badge,
.sidebar.collapsed .section-header,
.sidebar.collapsed .version-text {
  display: none;
}

.sidebar.collapsed .nav-link {
  justify-content: center;
  padding: 12px;
  gap: 0;
}

.sidebar.collapsed .icon {
  font-size: 24px;
}

.sidebar.collapsed .icon-component {
  width: 34px;
  height: 34px;
  min-width: 34px;
  min-height: 34px;
}

.sidebar.collapsed .icon-component :deep(svg) {
  width: 19px;
  height: 19px;
}

.rice-logo {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
  animation: sway 3s ease-in-out infinite;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@keyframes sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

/* Logo image */
.logo-img-wrap {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  overflow: visible;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-ring-outer {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  background: conic-gradient(
    from 210deg,
    rgba(34, 197, 94, 0.92),
    rgba(250, 204, 21, 0.82),
    rgba(21, 128, 61, 0.95),
    rgba(52, 211, 153, 0.88),
    rgba(234, 179, 8, 0.78),
    rgba(34, 197, 94, 0.92)
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #fff calc(100% - 2.5px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3.5px), #fff calc(100% - 2.5px));
  filter: drop-shadow(0 0 10px rgba(52, 211, 153, 0.4)) drop-shadow(0 0 16px rgba(234, 179, 8, 0.22));
  pointer-events: none;
  z-index: 0;
}

.logo-ring-inner {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 1px solid rgba(253, 224, 71, 0.42);
  box-shadow:
    inset 0 0 16px rgba(34, 197, 94, 0.12),
    0 0 12px rgba(52, 211, 153, 0.15);
  pointer-events: none;
  z-index: 1;
}

.sidebar.farmer-theme .logo-ring-outer {
  background: conic-gradient(
    from 200deg,
    rgba(250, 204, 21, 0.9),
    rgba(52, 211, 153, 0.72),
    rgba(180, 118, 62, 0.88),
    rgba(253, 224, 71, 0.85),
    rgba(34, 197, 94, 0.65),
    rgba(250, 204, 21, 0.9)
  );
  filter: drop-shadow(0 0 12px rgba(250, 204, 21, 0.32)) drop-shadow(0 0 14px rgba(74, 222, 128, 0.2));
}

.sidebar.farmer-theme .logo-ring-inner {
  border-color: rgba(252, 211, 77, 0.38);
  box-shadow:
    inset 0 0 14px rgba(250, 204, 21, 0.1),
    0 0 10px rgba(250, 204, 21, 0.12);
}

.calffa-logo-img {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center top;
  display: block;
  border: 2px solid rgba(187, 247, 208, 0.55);
  box-shadow:
    0 0 22px rgba(74, 222, 128, 0.38),
    0 0 36px rgba(234, 179, 8, 0.15),
    0 6px 22px rgba(0, 0, 0, 0.55);
  filter: brightness(1.06) saturate(1.22) contrast(1.1) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  transition: filter 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease;
  position: relative;
  z-index: 2;
}

.calffa-logo-img:hover {
  filter: brightness(1.12) saturate(1.28) contrast(1.12) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  box-shadow:
    0 0 32px rgba(74, 222, 128, 0.48),
    0 0 40px rgba(234, 179, 8, 0.22),
    0 8px 26px rgba(0, 0, 0, 0.62);
  transform: scale(1.04);
}

.sidebar.farmer-theme .calffa-logo-img {
  border-color: rgba(253, 224, 71, 0.5);
  box-shadow:
    0 0 22px rgba(250, 204, 21, 0.28),
    0 0 28px rgba(74, 222, 128, 0.18),
    0 6px 22px rgba(0, 0, 0, 0.52);
}

.calffa-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.calffa-brand {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 38%, #86efac 72%, #fde68a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.15;
  filter: drop-shadow(0 1px 10px rgba(52, 211, 153, 0.2));
}

.calffa-tagline {
  font-size: 10.5px;
  color: rgba(209, 250, 229, 0.82);
  font-weight: 600;
  letter-spacing: 0.85px;
  line-height: 1.35;
  text-transform: uppercase;
}

.sidebar.farmer-theme .calffa-brand {
  background: linear-gradient(135deg, #fffbeb 0%, #fde68a 35%, #fcd34d 70%, #86efac 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 1px 8px rgba(250, 204, 21, 0.18));
}

.sidebar.farmer-theme .calffa-tagline {
  color: rgba(254, 243, 199, 0.88);
}

.calffa-divider {
  margin-top: 8px;
  height: 2px;
  width: 88px;
  background: linear-gradient(90deg, rgba(74, 222, 128, 0.65), rgba(250, 204, 21, 0.35), transparent);
  border-radius: 4px;
}

.sidebar.farmer-theme .calffa-divider {
  background: linear-gradient(90deg, rgba(252, 211, 77, 0.6), rgba(74, 222, 128, 0.35), transparent);
}

/* Navigation Sections */
.nav-sections {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 1.15rem 0 1.65rem;
  position: relative;
  z-index: 1;
}

.nav-section {
  margin-bottom: 1.65rem;
}

.nav-section:last-child {
  margin-bottom: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding: 0.55rem 1rem;
  margin: 0 0.85rem 0.65rem;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.08px;
  color: rgba(220, 242, 228, 0.9);
  border: 1px solid rgba(100, 140, 118, 0.28);
  border-radius: 14px;
  background: linear-gradient(152deg, rgba(28, 48, 36, 0.88), rgba(18, 32, 26, 0.9));
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(186, 220, 198, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.28);
}

.sidebar.farmer-theme .section-header {
  color: rgba(255, 244, 224, 0.92);
  border: 1px solid rgba(210, 170, 125, 0.3);
  background: linear-gradient(152deg, rgba(92, 62, 40, 0.88), rgba(68, 44, 28, 0.9));
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 230, 200, 0.1),
    inset 0 -1px 0 rgba(30, 18, 10, 0.35);
}

.section-icon {
  display: none;
}

.section-icon-component {
  display: none;
}

.section-title {
  flex: 1;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.52rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.72rem 0.95rem;
  color: rgba(236, 252, 241, 0.95);
  text-decoration: none;
  border-radius: 14px;
  font-weight: 600;
  transition:
    background 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.3s ease,
    filter 0.3s ease;
  font-size: 14px;
  position: relative;
  border: 1px solid rgba(100, 138, 118, 0.22);
  margin-bottom: 0;
  min-height: 48px;
  cursor: pointer;
  user-select: none;
  background: linear-gradient(152deg, rgba(26, 44, 34, 0.92), rgba(18, 32, 26, 0.9));
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.22),
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 -1px 0 rgba(0, 0, 0, 0.2) inset;
}

.sidebar.farmer-theme .nav-link {
  color: rgba(255, 246, 230, 0.96);
  border: 1px solid rgba(200, 160, 118, 0.22);
  background: linear-gradient(152deg, rgba(88, 58, 38, 0.92), rgba(68, 44, 28, 0.9));
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.24),
    0 1px 0 rgba(255, 235, 210, 0.05) inset,
    0 -1px 0 rgba(0, 0, 0, 0.22) inset;
}

.nav-link:hover {
  background: linear-gradient(152deg, rgba(34, 56, 44, 0.96), rgba(24, 40, 32, 0.95));
  color: #faffff;
  transform: translateX(2px);
  filter: brightness(1.04);
  border-color: rgba(134, 200, 160, 0.38);
  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.26),
    0 0 20px rgba(74, 222, 128, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
}

.sidebar.farmer-theme .nav-link:hover {
  background: linear-gradient(152deg, rgba(112, 76, 48, 0.96), rgba(88, 58, 36, 0.95));
  color: #fffaf3;
  border-color: rgba(236, 200, 152, 0.42);
  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.28),
    0 0 22px rgba(252, 211, 77, 0.1),
    0 1px 0 rgba(255, 240, 220, 0.06) inset;
}

.nav-link:active {
  background: rgba(38, 68, 52, 0.9);
  transform: translateX(2px);
}

.nav-link:focus {
  outline: 2px solid rgba(134, 239, 172, 0.52);
  outline-offset: 2px;
  background: rgba(35, 66, 49, 0.82);
}

/* Active state with soft green background and leaf accent */
.active .nav-link {
  color: #faffff;
  border-color: rgba(134, 239, 172, 0.45);
  font-weight: 700;
  background: linear-gradient(152deg, rgba(28, 72, 52, 0.96), rgba(22, 58, 44, 0.94));
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.28),
    0 0 0 1px rgba(167, 243, 198, 0.2) inset,
    0 0 32px rgba(74, 222, 128, 0.28),
    0 0 52px rgba(52, 211, 153, 0.1);
}

.sidebar.farmer-theme .active .nav-link {
  color: #fffdf8;
  border-color: rgba(245, 200, 140, 0.5);
  background: linear-gradient(152deg, rgba(118, 78, 46, 0.97), rgba(92, 58, 34, 0.95));
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 228, 188, 0.18) inset,
    0 0 26px rgba(252, 211, 77, 0.18),
    0 0 40px rgba(250, 204, 21, 0.06);
}

.active .nav-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, #fde047 0%, #4ade80 55%, #22c55e 100%);
  box-shadow: 0 0 12px rgba(250, 204, 21, 0.55), 0 0 14px rgba(74, 222, 128, 0.35);
}

.sidebar.farmer-theme .active .nav-link::before {
  background: linear-gradient(180deg, #fde68a 0%, #fbbf24 45%, #86efac 100%);
  box-shadow: 0 0 12px rgba(253, 224, 71, 0.45), 0 0 10px rgba(74, 222, 128, 0.25);
}

.leaf-accent {
  display: none;
}

.icon {
  font-size: 20px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.25s ease;
  border-radius: 6px;
}

.icon-component {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.28s ease, background 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease;
  border-radius: 12px;
  padding: 0;
  background: rgba(16, 32, 24, 0.55);
  border: 1px solid rgba(120, 168, 140, 0.22);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15) inset;
}

.icon-component :deep(svg) {
  width: 20px;
  height: 20px;
  display: block;
  flex-shrink: 0;
}

.sidebar.farmer-theme .icon-component {
  background: rgba(62, 40, 26, 0.58);
  border: 1px solid rgba(200, 160, 118, 0.22);
}

.nav-link:hover .icon {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.1);
}

.nav-link:hover .icon-component {
  transform: scale(1.04);
  background: rgba(40, 72, 56, 0.5);
  border-color: rgba(160, 220, 180, 0.35);
  box-shadow: 0 0 14px rgba(74, 222, 128, 0.12);
}

.sidebar.farmer-theme .nav-link:hover .icon-component {
  background: rgba(120, 78, 48, 0.45);
  border-color: rgba(230, 190, 140, 0.35);
  box-shadow: 0 0 12px rgba(252, 211, 77, 0.1);
}

.active .nav-link .icon-component {
  background: rgba(34, 88, 62, 0.55);
  border-color: rgba(167, 243, 198, 0.35);
  box-shadow: 0 0 16px rgba(74, 222, 128, 0.15);
}

.sidebar.farmer-theme .active .nav-link .icon-component {
  background: rgba(100, 64, 36, 0.55);
  border-color: rgba(253, 224, 71, 0.32);
  box-shadow: 0 0 14px rgba(252, 211, 77, 0.12);
}

.nav-link:active .icon {
  transform: scale(0.95);
}

.nav-link:active .icon-component {
  transform: scale(0.95);
}

.text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.25s ease;
}

.nav-badge {
  background: linear-gradient(135deg, #fde047 0%, #f59e0b 100%);
  color: #1a2e1f;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  min-width: 20px;
  text-align: center;
  box-shadow:
    0 4px 12px rgba(245, 158, 11, 0.28),
    0 1px 0 rgba(255, 255, 255, 0.35) inset;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.sidebar-footer {
  padding: 1.15rem 1rem;
  border-top: 1px solid rgba(80, 120, 98, 0.28);
  margin-top: auto;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.22));
  text-align: center;
  position: relative;
  z-index: 1;
  box-shadow: 0 -6px 18px rgba(0, 0, 0, 0.12);
}

.sidebar.farmer-theme .sidebar-footer {
  border-top-color: rgba(180, 140, 100, 0.28);
}

.farmer-mode {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.version-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Courier New', monospace;
}

/* Hide scrollbars (keep scrolling: wheel / trackpad / touch) */
.sidebar::-webkit-scrollbar,
.nav-sections::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* Ensure sidebar width never changes */
.sidebar {
  min-width: 0;
  max-width: none;
  /* Prevent any width changes */
  flex-shrink: 0;
  flex-grow: 0;
}

/* MOBILE RESPONSIVENESS */
/* Small Mobile (≤ 480px) */
@media (max-width: 480px) {
  .sidebar {
    width: 192px;
    top: 70px;
    height: calc(100vh - 70px);
  }

  .sidebar.collapsed {
    width: 66px;
  }

  .sidebar-header {
    padding: 12px 12px;
    margin-bottom: 4px;
  }

  .sidebar.collapsed .sidebar-header {
    padding: 12px 6px;
  }

  .calffa-logo-container {
    gap: 8px;
  }

  .sidebar.collapsed .calffa-logo-container {
    gap: 4px;
  }

  .toggle-btn {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }

  .sidebar.collapsed .toggle-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .toggle-icon {
    font-size: 14px;
  }

  .rice-logo {
    width: 40px;
    height: 40px;
    font-size: 20px;
    border-radius: 8px;
  }

  .calffa-brand {
    font-size: 14px;
    letter-spacing: 0.5px;
  }

  .calffa-tagline {
    font-size: 8px;
  }

  .nav-sections {
    padding: 10px 0 12px;
  }

  .nav-section {
    margin-bottom: 16px;
  }

  .section-header {
    padding: 7px 10px;
    margin: 0 8px 6px;
    font-size: 11px;
    gap: 6px;
    letter-spacing: 0.8px;
  }

  .section-icon {
    display: none;
  }

  .nav-list {
    padding: 0 6px;
    gap: 5px;
  }

  .nav-link {
    padding: 7px 8px;
    font-size: 12px;
    gap: 7px;
    min-height: 38px;
    border-radius: 12px;
  }

  .icon,
  .icon-component {
    font-size: 16px;
    width: 30px;
    height: 30px;
    min-width: 30px;
    min-height: 30px;
    border-radius: 10px;
    padding: 0;
  }

  .icon-component :deep(svg) {
    width: 17px;
    height: 17px;
  }

  .text {
    font-size: 10.5px;
  }

  .nav-badge {
    font-size: 8px;
    padding: 1px 4px;
    min-width: 14px;
  }

  .sidebar-footer {
    padding: 12px;
  }

  .farmer-mode {
    font-size: 10px;
    margin-bottom: 2px;
  }

  .version-text {
    font-size: 8px;
  }
}

/* Mobile (481px - 768px) */
@media (min-width: 481px) and (max-width: 768px) {
  .sidebar {
    width: 210px;
    top: 70px;
    height: calc(100vh - 70px);
  }

  .sidebar.collapsed {
    width: 70px;
  }

  .sidebar-header {
    padding: 16px 14px;
    margin-bottom: 6px;
  }

  .sidebar.collapsed .sidebar-header {
    padding: 16px 8px;
  }

  .calffa-logo-container {
    gap: 10px;
  }

  .sidebar.collapsed .calffa-logo-container {
    gap: 4px;
  }

  .toggle-btn {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .sidebar.collapsed .toggle-btn {
    width: 30px;
    height: 30px;
    font-size: 16px;
  }

  .rice-logo {
    width: 44px;
    height: 44px;
    font-size: 24px;
    border-radius: 10px;
  }

  .calffa-brand {
    font-size: 16px;
  }

  .calffa-tagline {
    font-size: 9px;
  }

  .nav-sections {
    padding: 14px 0 16px;
  }

  .nav-section {
    margin-bottom: 22px;
  }

  .section-header {
    padding: 8px 12px;
    margin: 0 10px 7px;
    font-size: 11.5px;
    gap: 8px;
    letter-spacing: 0.9px;
  }

  .nav-list {
    padding: 0 7px;
    gap: 5px;
  }

  .nav-link {
    padding: 8px 9px;
    font-size: 12px;
    gap: 9px;
    min-height: 40px;
    border-radius: 12px;
  }

  .icon,
  .icon-component {
    font-size: 17px;
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    border-radius: 11px;
    padding: 0;
  }

  .icon-component :deep(svg) {
    width: 18px;
    height: 18px;
  }

  .text {
    font-size: 11px;
  }

  .nav-badge {
    font-size: 10px;
    padding: 1px 5px;
    min-width: 18px;
  }

  .sidebar-footer {
    padding: 16px;
  }

  .farmer-mode {
    font-size: 11px;
    margin-bottom: 3px;
  }

  .version-text {
    font-size: 9px;
  }
}

/* Tablet (769px - 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 240px;
    top: 70px;
    height: calc(100vh - 70px);
  }

  .sidebar.collapsed {
    width: 80px;
  }

  .sidebar-header {
    padding: 20px 18px;
    margin-bottom: 8px;
  }

  .sidebar.collapsed .sidebar-header {
    padding: 20px 10px;
  }

  .calffa-logo-container {
    gap: 12px;
  }

  .sidebar.collapsed .calffa-logo-container {
    gap: 4px;
  }

  .toggle-btn {
    width: 34px;
    height: 34px;
    font-size: 19px;
  }

  .sidebar.collapsed .toggle-btn {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }

  .rice-logo {
    width: 50px;
    height: 50px;
    font-size: 28px;
  }

  .calffa-brand {
    font-size: 18px;
  }

  .calffa-tagline {
    font-size: 10px;
  }

  .nav-sections {
    padding: 18px 0;
  }

  .nav-section {
    margin-bottom: 32px;
  }

  .section-header {
    padding: 11px 18px;
    margin-bottom: 10px;
    font-size: 13px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .nav-list {
    padding: 0 10px;
    gap: 6px;
  }

  .nav-link {
    padding: 11px 12px;
    font-size: 13px;
    gap: 11px;
    min-height: 46px;
    border-radius: 13px;
  }

  .icon {
    font-size: 19px;
    width: 27px;
    height: 27px;
  }

  .icon-component {
    width: 34px;
    height: 34px;
    min-width: 34px;
    min-height: 34px;
    border-radius: 12px;
  }

  .icon-component :deep(svg) {
    width: 19px;
    height: 19px;
  }

  .text {
    font-size: 13px;
  }

  .nav-badge {
    font-size: 10px;
    padding: 2px 6px;
    min-width: 19px;
  }

  .sidebar-footer {
    padding: 18px;
  }

  .farmer-mode {
    font-size: 11px;
    margin-bottom: 3px;
  }

  .version-text {
    font-size: 9px;
  }
}

/* Desktop (1025px+) */
@media (min-width: 1025px) {
  .sidebar {
    width: 260px;
    top: 70px;
    height: calc(100vh - 70px);
  }

  .sidebar.collapsed {
    width: 80px;
  }

  .sidebar-header {
    padding: 24px 20px;
  }

  .sidebar.collapsed .sidebar-header {
    padding: 24px 12px;
  }

  .calffa-logo-container {
    gap: 14px;
  }

  .sidebar.collapsed .calffa-logo-container {
    gap: 4px;
  }

  .toggle-btn {
    display: none;
  }

  .sidebar.collapsed .toggle-btn {
    display: none;
  }

  .nav-sections {
    padding: 20px 0;
  }

  .nav-link {
    min-height: 48px;
  }
}

/* Landscape Orientation - Reduce Height */
@media (max-height: 600px) {
  .sidebar-header {
    padding: 12px 16px;
    margin-bottom: 4px;
  }

  .rice-logo {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .calffa-brand {
    font-size: 14px;
  }

  .calffa-tagline {
    font-size: 8px;
  }

  .nav-sections {
    padding: 12px 0;
  }

  .nav-section {
    margin-bottom: 14px;
  }

  .section-header {
    padding: 8px 16px;
    margin-bottom: 4px;
    font-size: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .nav-link {
    padding: 8px 10px;
    font-size: 12px;
    min-height: 36px;
    border-radius: 12px;
  }

  .icon {
    font-size: 16px;
    width: 20px;
    height: 20px;
  }

  .icon-component {
    width: 30px;
    height: 30px;
    min-width: 30px;
    min-height: 30px;
    border-radius: 10px;
  }

  .icon-component :deep(svg) {
    width: 17px;
    height: 17px;
  }

  .sidebar-footer {
    padding: 12px;
  }

  .farmer-mode {
    font-size: 10px;
    margin-bottom: 2px;
  }

  .version-text {
    font-size: 8px;
  }
}
</style>
