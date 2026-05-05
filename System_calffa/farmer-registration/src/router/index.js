// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import FarmerSignup from '../views/FarmerSignup.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import Login from '../views/Login.vue'
import GoogleRegistration from '../views/GoogleRegistration.vue'
import BarangayNoticePage from '../views/BarangayNoticePage.vue'
import FarmerTablePage from '../views/FarmerTablePage.vue'
import MembersSummaryPage from '../views/MembersSummaryPage.vue'
import { useAuthStore } from '../stores/authStore'

import AuthenticatedLayout from '../layouts/AuthenticatedLayout.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/signup', component: FarmerSignup },
  { path: '/login', component: Login, meta: { requiresGuest: true } },
  { path: '/google-registration', component: GoogleRegistration, meta: { requiresGuest: true } },
  { path: '/barangay-notice', component: BarangayNoticePage, meta: { requiresAuth: true } },

  { 
    path: '/', 
    component: AuthenticatedLayout,
    meta: { requiresAuth: true },
    children: [
      // Dashboard Route (unified for all users)
      { path: 'welcome', redirect: '/dashboard' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'admin', redirect: '/dashboard' },
      
      // Operations Routes
      
      // Community Routes
      { path: 'loan', component: () => import('../views/LoanPage.vue') },
      { path: 'admin-loans', component: () => import('../views/AdminLoansPage.vue'), meta: { requiresLoanManagement: true } },
      { path: 'officer-loans', component: () => import('../views/OfficerLoansPage.vue'), meta: { requiresOfficerLoan: true } },
      { path: 'loan-ai-assessment', name: 'LoanAIAssessment', component: () => import('../views/LoanAIAssessmentPage.vue'), meta: { requiresLoanManagement: true } },
      
      // Farmer Income Routes
      { path: 'farmer-income', component: () => import('../views/FarmerIncomePage.vue'), meta: { requiresFarmer: true } },
      { path: 'farmer-income-hub', component: () => import('../views/FarmerIncomeHubPage.vue'), meta: { requiresFarmingAccess: true } },
      { path: 'president-income-verify', component: () => import('../views/PresidentFarmerIncomePage.vue'), meta: { requiresPresident: true } },
      { path: 'officer-farmer-income', component: () => import('../views/OfficerFarmerIncomePage.vue'), meta: { requiresOfficer: true } },
      { path: 'agriculturist-income-review', component: () => import('../views/AgriculturistIncomeReviewPage.vue'), meta: { requiresAgriculturist: true } },
      
      // Machinery Routes
      { path: 'machinery-management', component: () => import('../views/MachineryManagementPage.vue'), meta: { requiresMachinery: true } },
      { path: 'machinery-booking', component: () => import('../views/MachineryBookingPage.vue'), meta: { requiresFarmer: true } },
      { path: 'machinery-approval', component: () => import('../views/MachineryApprovalPage.vue'), meta: { requiresOperator: true } },
      { path: 'machinery-financial', component: () => import('../views/MachineryFinancialPage.vue'), meta: { requiresFinancial: true } },
      { path: 'blockchain-verification', component: () => import('../views/BlockchainVerificationPage.vue'), meta: { requiresBlockchainAudit: true } },
      
      // Insights Routes
      { path: 'news', component: () => import('../views/NewsPage.vue') },
      { path: 'president-news-approvals', component: () => import('../views/PresidentNewsApprovalsPage.vue'), meta: { requiresPresident: true } },
      { path: 'announcement', component: () => import('../views/AnnouncementPage.vue') },
      
      // Members Route (accessible to all)
      { path: 'farmers-table', component: FarmerTablePage },
      { path: 'members-summary', component: MembersSummaryPage, meta: { requiresFarmingAccess: true } },
      
      // Barangays Route
      { path: 'barangays', component: () => import('../views/BarangaysPage.vue') },
      
      // Admin-Only Routes
      { path: 'system-activity', component: () => import('../views/SystemActivityPage.vue'), meta: { requiresAdmin: true } },
      { path: 'financial-overview', component: () => import('../views/FinancialOverviewPage.vue'), meta: { requiresFinancial: true } },
      { path: 'share-capital', component: () => import('../views/ShareCapitalPage.vue') },
      { path: 'notification-center', component: () => import('../views/NotificationCenterPage.vue'), meta: { requiresAdmin: true } },
      { path: 'audit-logs', component: () => import('../views/AuditLogs.vue'), meta: { requiresAdmin: true } },
      { path: 'settings', component: () => import('../views/Settings.vue') }
    ]
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isLoggedIn()
  const userRole = authStore.currentUser?.role

  // Check if route requires authentication
  // Check both route meta and parent meta for nested routes
  const requiresAuth = to.meta.requiresAuth || (to.matched.some(record => record.meta.requiresAuth))
  if (requiresAuth && !isLoggedIn) {
    next('/login')
    return
  }

  // Non-members can only access machinery booking page
  // Redirect them automatically if they try to access other routes
  const membershipStatus = authStore.currentUser?.membership_status
  const isNonMember = membershipStatus === 'non-member'
  const isMachineryBookingRoute = to.path === '/machinery-booking'
  
  if (isLoggedIn && isNonMember && !isMachineryBookingRoute) {
    // Non-members can only access machinery booking, redirect them
    next('/machinery-booking')
    return
  }

  // Check if route requires admin role
  // Check both route meta and parent meta for nested routes
  const requiresAdmin = to.meta.requiresAdmin || (to.matched.some(record => record.meta.requiresAdmin))
  if (requiresAdmin && userRole !== 'admin') {
    alert('Access denied. Admin privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires operator role (includes operation_manager and business_manager)
  const requiresOperator = to.meta.requiresOperator || (to.matched.some(record => record.meta.requiresOperator))
  if (requiresOperator && !['operator', 'operation_manager', 'business_manager', 'admin'].includes(userRole)) {
    alert('Access denied. Operator privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires financial access (admin, president, treasurer)
  const requiresFinancial = to.meta.requiresFinancial || (to.matched.some(record => record.meta.requiresFinancial))
  if (requiresFinancial && !['admin', 'president', 'treasurer'].includes(userRole)) {
    alert('Access denied. Only Admin, President, and Treasurer can access financial management.')
    next('/dashboard')
    return
  }

  const requiresBlockchainAudit = to.meta.requiresBlockchainAudit || (to.matched.some(record => record.meta.requiresBlockchainAudit))
  if (requiresBlockchainAudit && !['admin', 'president', 'treasurer', 'auditor'].includes(userRole)) {
    alert('Access denied. Only Admin, President, Treasurer, and Auditor can access blockchain verification.')
    next('/dashboard')
    return
  }

  // Check if route requires loan management access (admin, treasurer, president)
  const requiresLoanManagement = to.meta.requiresLoanManagement || (to.matched.some(record => record.meta.requiresLoanManagement))
  if (requiresLoanManagement && !['admin', 'treasurer', 'president'].includes(userRole)) {
    alert('Access denied. Only Admin, Treasurer, and President can access loan management.')
    next('/dashboard')
    return
  }

  // Check if route requires machinery management access (admin, president)
  const requiresMachinery = to.meta.requiresMachinery || (to.matched.some(record => record.meta.requiresMachinery))
  if (requiresMachinery && !['admin', 'president'].includes(userRole)) {
    alert('Access denied. Admin or President privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires officer role (president, treasurer, auditor, agriculturist)
  const requiresOfficer = to.meta.requiresOfficer || (to.matched.some(record => record.meta.requiresOfficer))
  if (requiresOfficer && !['president', 'treasurer', 'auditor', 'agriculturist', 'admin'].includes(userRole)) {
    alert('Access denied. Officer privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires officer loan access
  const requiresOfficerLoan = to.meta.requiresOfficerLoan || (to.matched.some(record => record.meta.requiresOfficerLoan))
  if (requiresOfficerLoan && !['president', 'treasurer', 'operation_manager', 'business_manager', 'operator', 'admin'].includes(userRole)) {
    alert('Access denied. Officers can access this page.')
    next('/dashboard')
    return
  }

  // Check if route requires president role
  const requiresPresident = to.meta.requiresPresident || (to.matched.some(record => record.meta.requiresPresident))
  if (requiresPresident && userRole !== 'president') {
    alert('Access denied. President privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires farmer role
  const requiresFarmer = to.meta.requiresFarmer || (to.matched.some(record => record.meta.requiresFarmer))
  if (requiresFarmer && !['farmer', 'president', 'treasurer', 'auditor', 'admin'].includes(userRole)) {
    alert('Access denied. Farmer or Officer privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires agriculturist role
  const requiresAgriculturist = to.meta.requiresAgriculturist || (to.matched.some(record => record.meta.requiresAgriculturist))
  if (requiresAgriculturist && userRole !== 'agriculturist') {
    alert('Access denied. Agriculturist privileges required.')
    next('/dashboard')
    return
  }

  // Check if route requires farming access (president, officers, or agriculturist)
  const requiresFarmingAccess = to.meta.requiresFarmingAccess || (to.matched.some(record => record.meta.requiresFarmingAccess))
  if (requiresFarmingAccess && !['president', 'treasurer', 'auditor', 'agriculturist', 'admin'].includes(userRole)) {
    alert('Access denied. Officer or Agriculturist privileges required.')
    next('/dashboard')
    return
  }

  // Redirect guests away from authenticated routes
  if (to.meta.requiresGuest && isLoggedIn) {
    // Redirect all users to unified dashboard
    next('/dashboard')
    return
  }

  next()
})
