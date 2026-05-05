<template>
  <div class="financial-container glass-module-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Machinery Financial Management</h1>
        <p class="page-subtitle">Record expenses, income, and manage profit distribution</p>
      </div>
    </div>

    <!-- Access Denied Message -->
    <div v-if="!hasAccess" class="access-denied">
      <div class="denied-content">
        <p class="denied-icon">🔒</p>
        <p class="denied-text">Access Denied</p>
        <p class="denied-reason">Only Admin, President, Treasurer, and Auditor can access this section.</p>
      </div>
    </div>

    <div v-else>
      <!-- Barangay Context Display -->
      <div v-if="!isAdmin" class="barangay-context">
        <span class="context-badge">📍 {{ userRole === 'treasurer' ? 'Managing' : 'Viewing' }} financial data for your assigned barangay</span>
      </div>
      <div v-else class="barangay-context admin-context">
        <span class="context-badge">🌐 Admin View</span>
        <div class="admin-filter">
          <label for="barangay-select">Filter by Barangay:</label>
          <select id="barangay-select" v-model="selectedBarangayId" class="barangay-select">
            <option value="">All Barangays (Consolidated)</option>
            <option v-for="b in barangays" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
      </div>
      
      <!-- Financial Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card income-card">
          <div class="card-content">
            <span class="card-label">Total Income</span>
            <span class="card-amount">₱{{ formatNumber(profitSummary.total_income) }}</span>
          </div>
        </div>
        <div class="summary-card expense-card">
          <div class="card-content">
            <span class="card-label">Total Expenses</span>
            <span class="card-amount">₱{{ formatNumber(profitSummary.total_expenses) }}</span>
          </div>
        </div>
        <div class="summary-card profit-card" :class="{ negative: profitSummary.net_profit < 0 }">
          <div class="card-content">
            <span class="card-label">Net Profit</span>
            <span class="card-amount">₱{{ formatNumber(profitSummary.net_profit) }}</span>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- TAB 1: EXPENSES MANAGEMENT -->
      <div v-if="activeTab === 'expenses'" class="tab-content">
        <div class="section-header">
          <h2>Expense Management</h2>
          <button v-if="canManage" @click="showExpenseForm = true" class="btn-primary">+ Record Expense</button>
        </div>

        <!-- Expense Filters -->
        <div class="filters-section">
          <div class="filter-group">
            <label class="filter-label">Machinery/Equipment:</label>
            <select v-model="filters.machinery_id" class="filter-input">
              <option value="">All Machinery/Equipment</option>
              <option v-for="m in machinery" :key="m.id" :value="m.id">
                {{ m.machinery_name }} ({{ m.machinery_type }})
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Start Date:</label>
            <input v-model="filters.start_date" type="date" class="filter-input" />
          </div>
          <div class="filter-group">
            <label class="filter-label">End Date:</label>
            <input v-model="filters.end_date" type="date" class="filter-input" />
          </div>
          <div class="filter-actions">
            <button @click="loadExpenses" class="btn-secondary">Filter</button>
            <button @click="clearFilters" class="btn-secondary-outline">Clear</button>
          </div>
        </div>

        <!-- Expenses Table -->
        <div class="table-container">
          <table class="expenses-table">
            <thead>
              <tr>
                <th>Machinery/Equipment</th>
                <th>Date</th>
                <th>Particulars</th>
                <th>Ref. No.</th>
                <th>Fuel & Oil</th>
                <th>Labor</th>
                <th>Per Diem</th>
                <th>Repair & Maint.</th>
                <th>Office Supply</th>
                <th>Communication</th>
                <th>Utilities</th>
                <th>Sundries</th>
                <th>Total</th>
                <th v-if="canManage">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in filteredExpenses" :key="expense.id">
                <td><strong>{{ expense.machinery_name }}</strong></td>
                <td>{{ formatDate(expense.date_of_expense) }}</td>
                <td>{{ expense.particulars }}</td>
                <td>{{ expense.reference_number || '-' }}</td>
                <td>₱{{ formatNumber(expense.fuel_and_oil) }}</td>
                <td>₱{{ formatNumber(expense.labor_cost) }}</td>
                <td>₱{{ formatNumber(expense.per_diem) }}</td>
                <td>₱{{ formatNumber(expense.repair_and_maintenance) }}</td>
                <td>₱{{ formatNumber(expense.office_supply) }}</td>
                <td>₱{{ formatNumber(expense.communication_expense) }}</td>
                <td>₱{{ formatNumber(expense.utilities_expense) }}</td>
                <td>₱{{ formatNumber(expense.sundries) }}</td>
                <td class="amount-cell">₱{{ formatNumber(expense.total_amount) }}</td>
                <td v-if="canManage" class="actions-cell">
                  <button @click="editExpense(expense)" class="btn-edit" title="Edit">✏️</button>
                  <button @click="deleteExpense(expense.id)" class="btn-delete" title="Delete">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredExpenses.length === 0" class="empty-state">
            <p>{{ filters.machinery_id ? 'No expenses for selected machinery' : 'No expenses recorded yet' }}</p>
          </div>
        </div>
      </div>

      <!-- TAB 2: INCOME MANAGEMENT -->
      <div v-if="activeTab === 'income'" class="tab-content">
        <div class="section-header">
          <h2>💹 Income Management (Auto-Populated from Completed Bookings)</h2>
        </div>

        <!-- Income Filters -->
        <div class="filters-section">
          <div class="filter-group">
            <label class="filter-label">Machinery/Equipment:</label>
            <select v-model="filters.machinery_id" class="filter-input">
              <option value="">All Machinery/Equipment</option>
              <option v-for="m in machinery" :key="m.id" :value="m.id">
                {{ m.machinery_name }} ({{ m.machinery_type }})
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Start Date:</label>
            <input v-model="filters.start_date" type="date" class="filter-input" />
          </div>
          <div class="filter-group">
            <label class="filter-label">End Date:</label>
            <input v-model="filters.end_date" type="date" class="filter-input" />
          </div>
          <div class="filter-actions">
            <button @click="loadIncome" class="btn-secondary">Filter</button>
            <button @click="clearFilters" class="btn-secondary-outline">Clear</button>
          </div>
        </div>

        <p class="info-text">💡 Income is automatically generated from completed machinery bookings with partial or full payments.</p>

        <!-- Income Table -->
        <div class="table-container">
          <table class="income-table">
            <thead>
              <tr>
                <th>Farmer Name</th>
                <th>Machinery/Equipment</th>
                <th>Booking Date</th>
                <th>Total Amount</th>
                <th>Amount Paid</th>
                <th>Payment Status</th>
                <th>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inc in income" :key="inc.booking_id">
                <td><strong>{{ inc.farmer_name }}</strong></td>
                <td>{{ inc.machinery_name }} ({{ inc.machinery_type }})</td>
                <td>{{ formatDate(inc.booking_date) }}</td>
                <td class="amount-cell">₱{{ formatNumber(inc.original_amount) }}</td>
                <td class="amount-cell">₱{{ formatNumber(inc.income_amount) }}</td>
                <td>
                  <span :class="['status-badge', inc.payment_status.toLowerCase().replace(' ', '-')]">
                    {{ inc.payment_status }}
                  </span>
                </td>
                <td>{{ formatDate(inc.date_of_income) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="income.length === 0" class="empty-state">
            <p>No income records yet</p>
          </div>
        </div>
      </div>

      <!-- TAB 3: ACCOUNTS RECEIVABLE & COLLECTIONS -->
      <div v-if="activeTab === 'ar'" class="tab-content">
        <div class="section-header">
          <h2>Accounts Receivable & Collections</h2>
        </div>

        <!-- A/R Summary Cards -->
        <div class="summary-container">
          <div class="summary-card ar-card">
            <div class="card-icon icon-receivables">📈</div>
            <div class="card-content">
              <span class="card-label">Total Receivables</span>
              <span class="card-amount">₱{{ formatNumber(collectionsSummary.total_receivables) }}</span>
            </div>
          </div>
          <div class="summary-card collected-card">
            <div class="card-icon icon-collected">💵</div>
            <div class="card-content">
              <span class="card-label">Total Collected</span>
              <span class="card-amount">₱{{ formatNumber(collectionsSummary.total_collected) }}</span>
            </div>
          </div>
          <div class="summary-card balance-card">
            <div class="card-icon icon-balance">⚠️</div>
            <div class="card-content">
              <span class="card-label">Outstanding Balance</span>
              <span class="card-amount">₱{{ formatNumber(collectionsSummary.total_balance) }}</span>
            </div>
          </div>
        </div>

        <!-- Collections Filter -->
        <div class="filters-section">
          <div class="filter-group">
            <label class="filter-label">Machinery/Equipment:</label>
            <select v-model="filters.machinery_id" class="filter-input">
              <option value="">All Machinery/Equipment</option>
              <option v-for="m in machinery" :key="m.id" :value="m.id">
                {{ m.machinery_name }} ({{ m.machinery_type }})
              </option>
            </select>
          </div>
          <div class="filter-actions">
            <button @click="loadARData" class="btn-secondary">Filter</button>
            <button @click="clearFilters" class="btn-secondary-outline">Clear</button>
          </div>
        </div>

        <!-- A/R List -->
        <div class="ar-section">
          <div class="section-subheader">
            <h3>📑 List of Collectibles (Accounts Receivable)</h3>
          </div>
          <div class="table-container">
            <table class="ar-table">
              <thead>
                <tr>
                  <th>Farmer Name</th>
                  <th>Machinery</th>
                  <th>Booking Date</th>
                  <th>Accounts Receivable</th>
                  <th>Cash Collected</th>
                  <th>Remaining Balance</th>
                  <th v-if="canManage">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ar in arList" :key="ar.id" :data-booking-id="ar.id" :class="{ 'notification-highlight-row': highlightedBookingId == ar.id }">
                  <td>{{ ar.farmer_name }}</td>
                  <td>{{ ar.machinery_name }}</td>
                  <td>{{ formatDate(ar.booking_date) }}</td>
                  <td class="amount-cell">₱{{ formatNumber(ar.total_price) }}</td>
                  <td class="amount-cell">₱{{ formatNumber(ar.amount_collected || 0) }}</td>
                  <td class="amount-cell balance" :class="{ highlight: ar.remaining_balance > 0 }">
                    ₱{{ formatNumber(ar.total_price - (ar.amount_collected || 0)) }}
                  </td>
                  <td v-if="canManage" class="actions-cell">
                    <button @click="recordCollection(ar)" class="btn-primary-small" title="Record Payment">💳</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="arList.length === 0" class="empty-state">
              <p>No outstanding receivables</p>
            </div>
          </div>
        </div>

        <!-- Collections Transactions -->
        <div class="collections-section">
          <div class="section-subheader">
            <h3>💵 Collections Transactions</h3>
          </div>
          <div class="table-container">
            <table class="collections-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Farmer</th>
                  <th>Machinery</th>
                  <th>Collection Amount</th>
                  <th>Receipt Number</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="col in collections" :key="col.id">
                  <td>{{ formatDate(col.collection_date) }}</td>
                  <td>{{ col.farmer_name }}</td>
                  <td>{{ col.machinery_name }}</td>
                  <td class="amount-cell">₱{{ formatNumber(col.collection_amount) }}</td>
                  <td>{{ col.receipt_number || '-' }}</td>
                  <td>{{ col.remarks || '-' }}</td>
                  <!-- Delete button removed to prevent income data inconsistencies -->
                </tr>
              </tbody>
            </table>
            <div v-if="collections.length === 0" class="empty-state">
              <p>No collections recorded yet</p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: PROFIT COMPUTATION -->
      <div v-if="activeTab === 'profit'" class="tab-content">
        <div class="section-header">
          <h2>Profit Computation & Distribution</h2>
        </div>

        <div class="profit-breakdown">
          <div class="breakdown-card">
            <h3>Income Breakdown</h3>
            <p class="amount">₱{{ formatNumber(profitSummary.total_income) }}</p>
          </div>

          <div class="breakdown-card">
            <h3>Expense Breakdown</h3>
            <div class="expense-items">
              <div class="expense-item">
                <span>Fuel & Oil</span>
                <span>₱{{ formatNumber(expenseBreakdown.fuel_and_oil || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Labor Cost</span>
                <span>₱{{ formatNumber(expenseBreakdown.labor_cost || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Per Diem</span>
                <span>₱{{ formatNumber(expenseBreakdown.per_diem || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Repair & Maintenance</span>
                <span>₱{{ formatNumber(expenseBreakdown.repair_and_maintenance || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Office Supply</span>
                <span>₱{{ formatNumber(expenseBreakdown.office_supply || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Communication</span>
                <span>₱{{ formatNumber(expenseBreakdown.communication_expense || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Utilities</span>
                <span>₱{{ formatNumber(expenseBreakdown.utilities_expense || 0) }}</span>
              </div>
              <div class="expense-item">
                <span>Sundries</span>
                <span>₱{{ formatNumber(expenseBreakdown.sundries || 0) }}</span>
              </div>
              <div class="expense-item total">
                <span>Total Expenses</span>
                <span>₱{{ formatNumber(expenseBreakdown.total || 0) }}</span>
              </div>
            </div>
          </div>

          <div class="breakdown-card profit">
            <h3>Net Profit</h3>
            <p class="amount" :class="{ negative: profitSummary.net_profit < 0 }">
              ₱{{ formatNumber(profitSummary.net_profit) }}
            </p>
          </div>
        </div>

        <!-- Profit Distribution Breakdown -->
        <div v-if="profitSummary.net_profit > 0" class="profit-distribution-section">
          <h3>Profit Distribution Allocation</h3>
          <p class="info-text">Net profit is distributed as follows:</p>
          
          <div class="distribution-grid">
            <div class="distribution-card org">
              <div class="distribution-icon">🏛️</div>
              <div class="distribution-content">
                <h4>Organization</h4>
                <p class="percentage">30%</p>
                <p class="amount">₱{{ formatNumber(profitDistribution.organization) }}</p>
              </div>
            </div>

            <div class="distribution-card training">
              <div class="distribution-icon">📚</div>
              <div class="distribution-content">
                <h4>Training & Development</h4>
                <p class="percentage">20%</p>
                <p class="amount">₱{{ formatNumber(profitDistribution.training) }}</p>
              </div>
            </div>

            <div class="distribution-card members">
              <div class="distribution-icon">👥</div>
              <div class="distribution-content">
                <h4>Members Distribution</h4>
                <p class="percentage">50%</p>
                <p class="amount">₱{{ formatNumber(profitDistribution.members) }}</p>
                <p v-if="totalMembers > 0" class="per-member">
                  Per Member: ₱{{ formatNumber(profitDistribution.per_member) }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="canManage" class="distribution-actions">
            <button @click="generateProfitDistributionRecord" class="btn-primary">
              Generate Profit Distribution Record
            </button>
          </div>
        </div>

        <div v-else-if="profitSummary.net_profit === 0" class="empty-state">
          <p>No profit to distribute (Income = Expenses)</p>
        </div>

        <div v-else class="empty-state">
          <p>⚠️ Loss detected (Expenses > Income)</p>
        </div>
      </div>

      <!-- TAB 5: REPORTS -->
      <div v-if="activeTab === 'reports'" class="tab-content">
        <div class="section-header">
          <h2>Financial Reports</h2>
        </div>
        
        <!-- Report Generation Panel -->
        <div class="report-generator-panel">
          <div class="report-options-grid">
            <!-- Report Type Selection -->
            <div class="report-option-card">
              <h4>Report Period</h4>
              <div class="report-type-buttons">
                <button @click="generateReport('monthly')" class="report-type-btn" :class="{ active: reportData?.type === 'monthly' }" :disabled="reportLoading">
                  <span class="btn-text">Monthly</span>
                </button>
                <button @click="generateReport('quarterly')" class="report-type-btn" :class="{ active: reportData?.type === 'quarterly' }" :disabled="reportLoading">
                  <span class="btn-text">Quarterly</span>
                </button>
                <button @click="generateReport('annual')" class="report-type-btn" :class="{ active: reportData?.type === 'annual' }" :disabled="reportLoading">
                  <span class="btn-text">Annual</span>
                </button>
              </div>
              
              <!-- Custom Date Range -->
              <div class="custom-date-toggle">
                <label class="checkbox-inline">
                  <input type="checkbox" v-model="reportFilters.customDateRange" />
                  <span>Custom Date Range</span>
                </label>
              </div>
              <div v-if="reportFilters.customDateRange" class="custom-date-inputs">
                <div class="date-input-group">
                  <label>From:</label>
                  <input type="date" v-model="reportFilters.startDate" class="form-input-sm" />
                </div>
                <div class="date-input-group">
                  <label>To:</label>
                  <input type="date" v-model="reportFilters.endDate" class="form-input-sm" />
                </div>
                <button @click="generateReportCustom" class="btn-generate" :disabled="reportLoading || !reportFilters.startDate || !reportFilters.endDate">
                  {{ reportLoading ? 'Generating...' : 'Generate' }}
                </button>
              </div>
            </div>
            
            <!-- Report Sections Filter -->
            <div class="report-option-card">
              <h4>Include in Report</h4>
              <div class="filter-checkboxes">
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showSummary" />
                  <span>Summary Cards</span>
                </label>
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showDistribution" />
                  <span>Profit Distribution</span>
                </label>
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showAllTransactions" />
                  <span>All Transactions</span>
                </label>
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showExpenses" />
                  <span>Expense Details</span>
                </label>
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showCollections" />
                  <span>Collection Details</span>
                </label>
                <label class="filter-checkbox">
                  <input type="checkbox" v-model="reportFilters.showBookings" />
                  <span>Bookings Summary</span>
                </label>
              </div>
            </div>
            
            <!-- Print/Export Actions -->
            <div class="report-option-card actions-card">
              <h4>Export Options</h4>
              
              <!-- Orientation Toggle -->
              <div class="orientation-setting">
                <span class="orientation-label">Page Orientation</span>
                <div class="orientation-toggle">
                  <button 
                    @click="printOrientation = 'portrait'" 
                    class="orient-btn" 
                    :class="{ active: printOrientation === 'portrait' }">
                    Portrait
                  </button>
                  <button 
                    @click="printOrientation = 'landscape'" 
                    class="orient-btn" 
                    :class="{ active: printOrientation === 'landscape' }">
                    Landscape
                  </button>
                </div>
              </div>

              <div class="action-buttons">
                <button @click="printReport" class="btn-action print" :disabled="!reportData">
                  <span>Print Report</span>
                </button>
                <button class="btn-action select-all" @click="selectAllFilters">
                  <span>Select All</span>
                </button>
                <button class="btn-action clear" @click="clearAllFilters">
                  <span>Clear All</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Loading State -->
        <div v-if="reportLoading" class="report-loading">
          <div class="loading-spinner"></div>
          <p>Generating report...</p>
        </div>
        
        <!-- Report Display -->
        <div v-if="reportData && !reportLoading" class="report-display" id="printable-report">
          <!-- Report Header -->
          <div class="report-header">
            <div class="report-logo">
              <span class="logo-icon">🌾</span>
              <div class="logo-text">
                <h3>CALFFA Cooperative</h3>
                <p>Machinery Financial Report</p>
              </div>
            </div>
            <div class="report-meta">
              <h3>{{ reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1) }} Transaction Report</h3>
              <p class="report-period">
                <strong>Period:</strong> {{ formatReportDate(reportData.period.start) }} - {{ formatReportDate(reportData.period.end) }}
              </p>
              <p class="report-generated">
                Generated: {{ formatReportDate(reportData.generated_at) }}
              </p>
            </div>
          </div>
          
          <!-- Summary Cards -->
          <div v-if="reportFilters.showSummary" class="report-summary-grid">
            <div class="summary-card expense-card">
              <div class="card-icon-wrapper expense">📤</div>
              <div class="card-details">
                <span class="summary-label">Total Expenses</span>
                <span class="summary-value">₱{{ reportData.summary.total_expenses.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                <span class="summary-count">{{ reportData.counts.expenses }} records</span>
              </div>
            </div>
            <div class="summary-card income-card">
              <div class="card-icon-wrapper income">📥</div>
              <div class="card-details">
                <span class="summary-label">Total Income</span>
                <span class="summary-value">₱{{ reportData.summary.total_income.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                <span class="summary-count">{{ reportData.counts.income }} records</span>
              </div>
            </div>
            <div class="summary-card collection-card">
              <div class="card-icon-wrapper collection">💵</div>
              <div class="card-details">
                <span class="summary-label">Total Collections</span>
                <span class="summary-value">₱{{ reportData.summary.total_collections.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                <span class="summary-count">{{ reportData.counts.collections }} payments</span>
              </div>
            </div>
            <div class="summary-card" :class="reportData.summary.net_profit >= 0 ? 'profit-card' : 'loss-card'">
              <div class="card-icon-wrapper" :class="reportData.summary.net_profit >= 0 ? 'profit' : 'loss'">
                {{ reportData.summary.net_profit >= 0 ? '📈' : '📉' }}
              </div>
              <div class="card-details">
                <span class="summary-label">Net Profit/Loss</span>
                <span class="summary-value">₱{{ reportData.summary.net_profit.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                <span class="summary-count">{{ reportData.summary.net_profit >= 0 ? '✓ Profit' : '✗ Loss' }}</span>
              </div>
            </div>
          </div>
          
          <!-- Distribution Summary (only if profit) -->
          <div v-if="reportFilters.showDistribution && reportData.summary.net_profit > 0" class="distribution-summary">
            <h4>💰 Profit Distribution Breakdown</h4>
            <div class="distribution-grid">
              <div class="dist-item org">
                <div class="dist-icon">🏢</div>
                <div class="dist-details">
                  <span class="dist-label">Organization (30%)</span>
                  <span class="dist-value">₱{{ reportData.summary.distribution.organization_share.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
              <div class="dist-item training">
                <div class="dist-icon">📚</div>
                <div class="dist-details">
                  <span class="dist-label">Training (20%)</span>
                  <span class="dist-value">₱{{ reportData.summary.distribution.training_share.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
              <div class="dist-item members">
                <div class="dist-icon">👥</div>
                <div class="dist-details">
                  <span class="dist-label">Members (50%)</span>
                  <span class="dist-value">₱{{ reportData.summary.distribution.members_share.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
              <div class="dist-item per-member highlight">
                <div class="dist-icon">👤</div>
                <div class="dist-details">
                  <span class="dist-label">Per Member ({{ reportData.summary.distribution.member_count }} members)</span>
                  <span class="dist-value">₱{{ reportData.summary.distribution.per_member_share.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- All Transactions Table -->
          <div v-if="reportFilters.showAllTransactions" class="report-transactions report-section-card">
            <div class="section-title">
              <span class="section-icon">📝</span>
              <h4>All Transactions</h4>
              <span class="section-count">{{ reportData.transactions.all.length }} records</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Machinery</th>
                    <th>Description</th>
                    <th>Farmer</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="txn in reportData.transactions.all" :key="txn.id + '-' + txn.transaction_type">
                    <td>{{ formatReportDate(txn.date) }}</td>
                    <td>
                      <span class="badge" :class="getTransactionTypeClass(txn.transaction_type)">
                        {{ txn.transaction_type }}
                      </span>
                    </td>
                    <td>{{ txn.machinery_name || '-' }}</td>
                    <td class="description-cell">{{ txn.description || '-' }}</td>
                    <td>{{ txn.farmer_name || '-' }}</td>
                    <td class="text-right" :class="txn.transaction_type === 'Expense' ? 'text-red' : 'text-green'">
                      {{ txn.transaction_type === 'Expense' ? '-' : '+' }}₱{{ parseFloat(txn.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                    </td>
                  </tr>
                  <tr v-if="reportData.transactions.all.length === 0">
                    <td colspan="6" class="empty-cell">No transactions found for this period</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Detailed Expenses Table -->
          <div v-if="reportFilters.showExpenses && reportData.transactions.expenses.length > 0" class="report-section report-section-card">
            <div class="section-title">
              <span class="section-icon">📤</span>
              <h4>Expense Details</h4>
              <span class="section-count">{{ reportData.transactions.expenses.length }} records</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Machinery</th>
                    <th>Particulars</th>
                    <th>Ref #</th>
                    <th class="text-right">Fuel & Oil</th>
                    <th class="text-right">Labor</th>
                    <th class="text-right">Per Diem</th>
                    <th class="text-right">R&M</th>
                    <th class="text-right">Others</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="exp in reportData.transactions.expenses" :key="'exp-' + exp.id">
                    <td>{{ formatReportDate(exp.date) }}</td>
                    <td>{{ exp.machinery_name || '-' }}</td>
                    <td class="description-cell">{{ exp.description || '-' }}</td>
                    <td>{{ exp.reference_number || '-' }}</td>
                    <td class="text-right">₱{{ parseFloat(exp.fuel_and_oil || 0).toLocaleString() }}</td>
                    <td class="text-right">₱{{ parseFloat(exp.labor_cost || 0).toLocaleString() }}</td>
                    <td class="text-right">₱{{ parseFloat(exp.per_diem || 0).toLocaleString() }}</td>
                    <td class="text-right">₱{{ parseFloat(exp.repair_and_maintenance || 0).toLocaleString() }}</td>
                    <td class="text-right">₱{{ (parseFloat(exp.office_supply || 0) + parseFloat(exp.communication_expense || 0) + parseFloat(exp.utilities_expense || 0) + parseFloat(exp.sundries || 0)).toLocaleString() }}</td>
                    <td class="text-right text-red">₱{{ parseFloat(exp.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="9"><strong>Total Expenses</strong></td>
                    <td class="text-right text-red"><strong>₱{{ reportData.summary.total_expenses.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <!-- Collections Table -->
          <div v-if="reportFilters.showCollections && reportData.transactions.collections.length > 0" class="report-section report-section-card">
            <div class="section-title">
              <span class="section-icon">💵</span>
              <h4>Collection Details</h4>
              <span class="section-count">{{ reportData.transactions.collections.length }} payments</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Booking #</th>
                    <th>Farmer</th>
                    <th>Type</th>
                    <th>Receipt No.</th>
                    <th class="text-right">Amount</th>
                    <th class="text-right">Interest</th>
                    <th>Season</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="col in reportData.transactions.collections" :key="'col-' + col.id">
                    <td>{{ formatReportDate(col.date) }}</td>
                    <td>#{{ col.booking_id }}</td>
                    <td>{{ col.farmer_name || '-' }}</td>
                    <td>
                      <span class="badge" :class="col.payment_type === 'full' ? 'badge-full' : 'badge-partial'">
                        {{ col.payment_type === 'full' ? 'Full' : 'Partial' }}
                      </span>
                    </td>
                    <td>{{ col.receipt_number || '-' }}</td>
                    <td class="text-right text-green">₱{{ parseFloat(col.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td class="text-right">{{ col.interest_applied ? '₱' + parseFloat(col.interest_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '-' }}</td>
                    <td>{{ col.interest_season ? 'Season ' + col.interest_season : '-' }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="5"><strong>Total Collections</strong></td>
                    <td class="text-right text-green"><strong>₱{{ reportData.summary.total_collections.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</strong></td>
                    <td class="text-right"><strong>₱{{ reportData.summary.total_interest_collected.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <!-- Bookings Summary -->
          <div v-if="reportFilters.showBookings && reportData.transactions.bookings.length > 0" class="report-section report-section-card">
            <div class="section-title">
              <span class="section-icon">📅</span>
              <h4>Bookings Summary</h4>
              <span class="section-count">{{ reportData.transactions.bookings.length }} bookings</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Booking #</th>
                    <th>Machinery</th>
                    <th>Farmer</th>
                    <th>Status</th>
                    <th class="text-right">Total Price</th>
                    <th class="text-right">Paid</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="bk in reportData.transactions.bookings" :key="'bk-' + bk.id">
                    <td>{{ formatReportDate(bk.date) }}</td>
                    <td>#{{ bk.booking_id }}</td>
                    <td>{{ bk.machinery_name || '-' }}</td>
                    <td>{{ bk.farmer_name || '-' }}</td>
                    <td>
                      <span class="badge" :class="'badge-' + (bk.status || '').toLowerCase().replace(' ', '-')">
                        {{ bk.status }}
                      </span>
                    </td>
                    <td class="text-right">₱{{ parseFloat(bk.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td class="text-right">₱{{ parseFloat(bk.total_paid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td>
                      <span class="badge" :class="'badge-' + (bk.payment_status || '').toLowerCase()">
                        {{ bk.payment_status || 'Unpaid' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Report Footer -->
          <div class="report-footer">
            <p>This report was generated automatically by CALFFA Financial Management System</p>
            <p class="footer-date">Report Date: {{ new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- EXPENSE FORM MODAL -->
    <div v-if="showExpenseForm" class="modal-overlay" @click.self="showExpenseForm = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>{{ editingExpense ? 'Edit Expense' : 'Record New Expense' }}</h2>
          <button @click="showExpenseForm = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Machinery / Equipment *</label>
            <select v-model="expenseForm.machinery_id" class="form-input">
              <option value="">-- Select Machinery/Equipment --</option>
              <option v-for="m in machinery" :key="m.id" :value="m.id">
                {{ m.machinery_name }} ({{ m.machinery_type }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Date of Expense *</label>
            <input v-model="expenseForm.date_of_expense" type="date" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Particulars (Details) *</label>
              <input v-model="expenseForm.particulars" type="text" class="form-input" placeholder="e.g., Fuel for machinery maintenance" />
            </div>
            <div class="form-group">
              <label>Receipt/Reference Number *</label>
              <input v-model="expenseForm.reference_number" type="text" class="form-input" placeholder="Enter receipt/reference number" required />
            </div>
          </div>

          <div class="expense-items-grid">
            <div class="form-group">
              <label>Fuel & Oil</label>
              <input v-model.number="expenseForm.fuel_and_oil" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Labor Cost (Operator & Helper)</label>
              <input v-model.number="expenseForm.labor_cost" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Per Diem (Incentive/hectare or hour)</label>
              <input v-model.number="expenseForm.per_diem" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Repair & Maintenance</label>
              <input v-model.number="expenseForm.repair_and_maintenance" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Office Supply (Ballpen, etc.)</label>
              <input v-model.number="expenseForm.office_supply" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Communication (Load, Internet)</label>
              <input v-model.number="expenseForm.communication_expense" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Utilities (Water & Electricity)</label>
              <input v-model.number="expenseForm.utilities_expense" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
            <div class="form-group">
              <label>Sundries (Other Expenses)</label>
              <input v-model.number="expenseForm.sundries" type="number" step="0.01" class="form-input" @input="updateTotal" />
            </div>
          </div>

          <div class="form-group">
            <label>Total Amount (Auto-Calculated) *</label>
            <input v-model.number="expenseForm.total_amount" type="number" step="0.01" class="form-input total-input" readonly />
            <small class="calculated">₱{{ formatNumber(expenseForm.total_amount) }}</small>
          </div>

          <div class="modal-actions">
            <button @click="showExpenseForm = false" class="btn-secondary">Cancel</button>
            <button @click="saveExpense" class="btn-success">{{ editingExpense ? 'Update' : 'Record' }} Expense</button>
          </div>
        </div>
      </div>
    </div>

    <!-- INCOME FORM MODAL -->
    <div v-if="showIncomeForm" class="modal-overlay" @click.self="showIncomeForm = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Record Income</h2>
          <button @click="showIncomeForm = false" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Date of Income *</label>
            <input v-model="incomeForm.date_of_income" type="date" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Machinery ID *</label>
              <input v-model.number="incomeForm.machinery_id" type="number" class="form-input" />
            </div>
            <div class="form-group">
              <label>Booking ID *</label>
              <input v-model.number="incomeForm.booking_id" type="number" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Income Amount *</label>
            <input v-model.number="incomeForm.income_amount" type="number" step="0.01" class="form-input" />
          </div>

          <div class="form-group">
            <label>Remarks</label>
            <textarea v-model="incomeForm.remarks" class="form-input" placeholder="Optional notes"></textarea>
          </div>

          <div class="modal-actions">
            <button @click="showIncomeForm = false" class="btn-secondary">Cancel</button>
            <button @click="saveIncome" class="btn-success">Record Income</button>
          </div>
        </div>
      </div>
    </div>

    <!-- COLLECTION FORM MODAL -->
    <div v-if="showCollectionForm" class="modal-overlay" @click.self="showCollectionForm = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2>💳 Record Payment / Collection</h2>
          <button @click="showCollectionForm = false" class="btn-close">×</button>
        </div>
        <div class="modal-body" v-if="editingCollection">
          <!-- Receivable Details -->
          <div class="form-group highlight-box">
            <label>Account Receivable Details:</label>
            <div class="details-grid">
              <div><strong>Farmer:</strong> {{ editingCollection.farmer_name }}</div>
              <div><strong>Machinery:</strong> {{ editingCollection.machinery_name }}</div>
              <div><strong>Total Amount:</strong> ₱{{ formatNumber(editingCollection.total_price) }}</div>
              <div v-if="editingCollection.pending_interest > 0"><strong>Includes Interest:</strong> ₱{{ formatNumber(editingCollection.pending_interest) }}</div>
              <div><strong>Already Collected:</strong> ₱{{ formatNumber(editingCollection.amount_collected || 0) }}</div>
              <div><strong>Current Balance:</strong> ₱{{ formatNumber(editingCollection.total_price - (editingCollection.amount_collected || 0)) }}</div>
              <div><strong>Due Date:</strong> {{ formatDate(getDueDate(editingCollection.booking_date)) }} <span v-if="isOverdue" class="overdue-flag">⚠️ OVERDUE</span></div>
            </div>
          </div>

          <!-- Payment Type Selection -->
          <fieldset class="form-group payment-type-group">
            <legend>Payment Type *</legend>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="collectionForm.paymentType" type="radio" value="full" @change="setFullPaymentAmount" />
                <span>Full Payment</span>
                <small>(Pay complete balance)</small>
              </label>
              <label class="radio-label">
                <input v-model="collectionForm.paymentType" type="radio" value="partial" />
                <span>Partial Payment</span>
                <small>(Pay partial amount)</small>
              </label>
            </div>
          </fieldset>

          <!-- Payment Amount -->
          <div class="form-row">
            <div class="form-group">
              <label>Payment Amount *</label>
              <input 
                v-model.number="collectionForm.paymentAmount" 
                type="number" 
                step="0.01" 
                class="form-input"
                :placeholder="collectionForm.paymentType === 'full' ? 'Full balance ' + formatNumber(remainingBalance) : 'Enter partial amount'"
                @input="validatePaymentAmount"
                :readonly="collectionForm.paymentType === 'full'"
              />
              <small v-if="collectionForm.paymentType === 'full'" class="info-text info-success">
                ✓ Auto-filled with full balance: ₱{{ formatNumber(remainingBalance) }}
              </small>
              <small v-if="showPartialWarning" class="warning-text">
                ⚠️ This amount equals the remaining balance. Consider using Full Payment instead.
              </small>
            </div>
            <div class="form-group">
              <label>Collection Date *</label>
              <input v-model="collectionForm.collectionDate" type="date" class="form-input" />
            </div>
          </div>

          <!-- Interest Option (for Partial Payments) -->
          <div v-if="collectionForm.paymentType === 'partial'" class="form-group payment-interest-box">
            <!-- Interest already applied on first payment - show info only -->
            <div v-if="interestAlreadyApplied" class="interest-already-applied">
              <span class="info-success">✓ Interest already applied: ₱{{ formatNumber(editingCollection.pending_interest) }}</span>
              <small>Interest was applied on the first payment and remains fixed until balance is fully paid.</small>
            </div>
            <!-- First payment was made without interest - decision is locked -->
            <div v-else-if="!isFirstPayment" class="interest-already-applied">
              <small class="info-muted">Interest was not applied on the first payment. The decision is locked for this booking.</small>
            </div>
            <!-- First payment: treasurer can decide -->
            <template v-else-if="canApplyInterest">
              <label class="checkbox-label">
                <input v-model="collectionForm.addInterest" type="checkbox" />
                <span><strong>Add Interest (one-time, first payment only)</strong></span>
              </label>
              <small v-if="isOverdue">{{ interestSeason.label }} - {{ monthsElapsed }} month(s) overdue from due date</small>
              <small v-else>Due date has not passed yet. You may still choose to apply interest.</small>
              
              <div v-if="collectionForm.addInterest" class="interest-details">
                <div class="detail-row">
                  <span>Interest Calculation ({{ (interestSeason.rate * 100) }}% of remaining balance ₱{{ formatNumber(remainingBalance) }}):</span>
                  <span>₱{{ formatNumber(interestAmount) }}</span>
                </div>
                <div class="detail-row highlight">
                  <span><strong>Interest will be added to remaining balance (one-time only)</strong></span>
                </div>
              </div>
            </template>
          </div>

          <!-- Receipt Number -->
          <div class="form-group">
            <label>Receipt Number *</label>
            <input v-model="collectionForm.receiptNumber" type="text" class="form-input" placeholder="Enter receipt/reference number" required />
          </div>

          <!-- Remarks -->
          <div class="form-group">
            <label>Remarks</label>
            <textarea v-model="collectionForm.remarks" class="form-input" placeholder="Additional notes or details..."></textarea>
          </div>

          <!-- Summary -->
          <div class="modal-summary">
            <table class="summary-table">
              <tr>
                <td>Balance Due:</td>
                <td class="amount">₱{{ formatNumber(remainingBalance) }}</td>
              </tr>
              <tr>
                <td>Payment Amount:</td>
                <td class="amount">₱{{ formatNumber(collectionForm.paymentAmount || 0) }}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total Collection:</strong></td>
                <td class="amount"><strong>₱{{ formatNumber(totalCollectionAmount) }}</strong></td>
              </tr>
              <tr v-if="collectionForm.addInterest && canApplyInterest">
                <td>Interest ({{ interestSeason.label }}):</td>
                <td class="amount">+ ₱{{ formatNumber(interestAmount) }}</td>
              </tr>
              <tr v-if="collectionForm.paymentType === 'partial'" class="balance-row">
                <td><strong>Remaining Balance After:</strong></td>
                <td class="amount"><strong>₱{{ formatNumber(remainingBalanceAfter) }}</strong></td>
              </tr>
            </table>
          </div>

          <div class="modal-actions">
            <button @click="showCollectionForm = false" class="btn-secondary">Cancel</button>
            <button @click="saveCollection" class="btn-success">Record Collection</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Messages -->
    <div v-if="alert.show" :class="['alert', 'alert-' + alert.type]">
      <span>{{ alert.message }}</span>
      <button @click="alert.show = false" class="alert-close">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const highlightedBookingId = ref(null);

// Get current user role
const userRole = computed(() => authStore.currentUser?.role);
const userBarangayId = computed(() => authStore.currentUser?.barangay_id);

// Admin barangay filter
const barangays = ref([]);
const selectedBarangayId = ref('');

// Authorization check - now includes auditor for viewing
const hasAccess = computed(() => {
  const role = authStore.currentUser?.role;
  return ['admin', 'president', 'treasurer', 'auditor'].includes(role);
});

// Check if user is treasurer (can manage/edit data)
const isTreasurer = computed(() => userRole.value === 'treasurer');

// Check if user is admin (sees only profit and reports tabs)
const isAdmin = computed(() => userRole.value === 'admin');

// Check if user can manage (only treasurer)
const canManage = computed(() => isTreasurer.value);

// Check if view only (president, auditor - no edit buttons)
const isViewOnly = computed(() => ['president', 'auditor'].includes(userRole.value));

// Compute filtered expenses based on selected machinery
const filteredExpenses = computed(() => {
  if (!filters.value.machinery_id) {
    return expenses.value;
  }
  return expenses.value.filter(exp => exp.machinery_id === parseInt(filters.value.machinery_id));
});

// Collection Form Computed Properties
const remainingBalance = computed(() => {
  if (!editingCollection.value) return 0;
  return editingCollection.value.total_price - (editingCollection.value.amount_collected || 0);
});

const totalCollectionAmount = computed(() => {
  // Total collection is just the payment amount (interest is added to remaining balance)
  return collectionForm.value.paymentAmount || 0;
});

const remainingBalanceAfter = computed(() => {
  if (collectionForm.value.paymentType === 'full') return 0;
  // Remaining balance = (Current Balance - Payment Amount) + Interest (only if being applied now)
  const base = remainingBalance.value - (collectionForm.value.paymentAmount || 0);
  const interest = (collectionForm.value.addInterest && canApplyInterest.value) ? interestAmount.value : 0;
  return base + interest;
});

const showPartialWarning = computed(() => {
  if (collectionForm.value.paymentType !== 'partial') return false;
  return collectionForm.value.paymentAmount >= remainingBalance.value * 0.99; // 99% or more of balance
});

const getDueDate = (bookingDate) => {
  if (!bookingDate) return null;
  const d = new Date(bookingDate);
  d.setDate(d.getDate() + 30);
  return d;
};

// Calculate months elapsed since due date (30 days after booking) for progressive interest
const monthsElapsed = computed(() => {
  if (!editingCollection.value || !editingCollection.value.booking_date) return 0;
  const bookingDate = new Date(editingCollection.value.booking_date);
  const dueDate = new Date(bookingDate);
  dueDate.setDate(dueDate.getDate() + 30); // Due date is 30 days after booking
  const today = new Date();
  const diffMs = today - dueDate;
  if (diffMs <= 0) return 0; // Not yet overdue
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  return diffMonths;
});

// Check if booking is overdue (past 30 days from booking date)
const isOverdue = computed(() => {
  if (!editingCollection.value || !editingCollection.value.booking_date) return false;
  const bookingDate = new Date(editingCollection.value.booking_date);
  const dueDate = new Date(bookingDate);
  dueDate.setDate(dueDate.getDate() + 30);
  return new Date() > dueDate;
});

// Check if the selected collection date is after the due date
const isPaymentAfterDueDate = computed(() => {
  if (!editingCollection.value || !editingCollection.value.booking_date || !collectionForm.value.collectionDate) return false;
  const bookingDate = new Date(editingCollection.value.booking_date);
  const dueDate = new Date(bookingDate);
  dueDate.setDate(dueDate.getDate() + 30);
  const paymentDate = new Date(collectionForm.value.collectionDate);
  return paymentDate > dueDate;
});

// Check if interest was already applied to this booking
const interestAlreadyApplied = computed(() => {
  return (parseFloat(editingCollection.value?.pending_interest) || 0) > 0;
});

// Check if this is the first payment (no prior payments recorded)
const isFirstPayment = computed(() => {
  const status = editingCollection.value?.payment_status;
  return status === 'Unpaid' || status === 'unpaid';
});

// Interest can only be added if: partial payment, first payment, and not already applied
const canApplyInterest = computed(() => {
  return collectionForm.value.paymentType === 'partial'
    && isFirstPayment.value
    && !interestAlreadyApplied.value;
});

// Determine which interest season applies (based on months overdue from due date)
const interestSeason = computed(() => {
  const months = monthsElapsed.value;
  if (months <= 6) return { season: 1, rate: 0.02, label: `Season 1 (0-6mo overdue): 2%` };
  return { season: 2, rate: 0.04, label: `Season 2 (6+mo overdue): 4%` };
});

const interestAmount = computed(() => {
  if (!collectionForm.value.addInterest || !canApplyInterest.value) return 0;
  // Interest is calculated on the whole remaining balance at the time of first application
  const rate = interestSeason.value.rate;
  return parseFloat((remainingBalance.value * rate).toFixed(2));
});

// Profit Distribution Calculation (30% Org, 20% Training, 50% Members)
const profitDistribution = computed(() => {
  const netProfit = profitSummary.value.net_profit || 0;
  const organization = netProfit * 0.30;      // 30% for organization
  const training = netProfit * 0.20;          // 20% for training
  const members = netProfit * 0.50;           // 50% for members distribution
  const perMember = totalMembers.value > 0 ? members / totalMembers.value : 0;
  
  return {
    organization: organization,
    training: training,
    members: members,
    per_member: perMember
  };
});

// Redirect if no access
if (!hasAccess.value) {
  onMounted(() => {
    if (!hasAccess.value) {
      router.push('/dashboard');
    }
  });
}

// Tabs - filtered based on role
// Admin: Only sees Profit Computation and Reports
// Others (Treasurer, President, Auditor): See all tabs
const activeTab = ref('expenses');
const allTabs = [
  { id: 'expenses', label: 'Expenses' },
  { id: 'income', label: 'Income' },
  { id: 'ar', label: 'A/R & Collections' },
  { id: 'profit', label: 'Profit Computation' },
  { id: 'reports', label: 'Reports' }
];

const tabs = computed(() => {
  if (isAdmin.value) {
    // Admin only sees profit and reports tabs
    return allTabs.filter(tab => ['profit', 'reports'].includes(tab.id));
  }
  return allTabs;
});

// Set default active tab based on role
watch(() => userRole.value, (role) => {
  if (role === 'admin') {
    activeTab.value = 'profit';
  }
}, { immediate: true });

// State
const expenses = ref([]);
const income = ref([]);
const machinery = ref([]);
const arList = ref([]);
const collections = ref([]);
const collectionsSummary = ref({
  total_receivables: 0,
  total_collected: 0,
  total_balance: 0
});
const profitSummary = ref({
  total_income: 0,
  total_expenses: 0,
  net_profit: 0
});
const expenseBreakdown = ref({});
const totalMembers = ref(0); // Total cooperative members for distribution calculation

// Report data
const reportData = ref(null);
const reportLoading = ref(false);
const reportFilters = ref({
  showSummary: true,
  showDistribution: true,
  showAllTransactions: true,
  showExpenses: true,
  showCollections: true,
  showBookings: true,
  customDateRange: false,
  startDate: '',
  endDate: ''
});

const printOrientation = ref('landscape');

const showExpenseForm = ref(false);
const showIncomeForm = ref(false);
const showCollectionForm = ref(false);
const editingExpense = ref(null);
const editingCollection = ref(null);

const filters = ref({
  machinery_id: '',
  start_date: '',
  end_date: ''
});

const expenseForm = ref({
  machinery_id: '',
  date_of_expense: '',
  particulars: '',
  reference_number: '',
  fuel_and_oil: 0,
  labor_cost: 0,
  per_diem: 0,
  repair_and_maintenance: 0,
  office_supply: 0,
  communication_expense: 0,
  utilities_expense: 0,
  sundries: 0,
  total_amount: 0
});

const incomeForm = ref({
  date_of_income: '',
  machinery_id: '',
  booking_id: '',
  income_amount: '',
  remarks: ''
});

const collectionForm = ref({
  paymentType: 'full', // 'full' or 'partial'
  paymentAmount: 0,
  collectionDate: new Date().toISOString().split('T')[0],
  receiptNumber: '',
  remarks: '',
  addInterest: false,
  interestSeason: 1  // Track which season's interest applies (1 or 2)
});

const alert = ref({
  show: false,
  message: '',
  type: 'success'
});

// Methods
const API_BASE_URL = 'http://localhost:3000/api';

const formatNumber = (num) => {
  if (!num) return '0.00';
  return parseFloat(num).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-PH');
};

const calculateExpenseTotal = () => {
  const parseNum = (val) => {
    const num = parseFloat(val) || 0;
    return Math.max(0, num); // Ensure no negative values
  };
  
  const total = parseNum(expenseForm.value.fuel_and_oil) +
                parseNum(expenseForm.value.labor_cost) +
                parseNum(expenseForm.value.per_diem) +
                parseNum(expenseForm.value.repair_and_maintenance) +
                parseNum(expenseForm.value.office_supply) +
                parseNum(expenseForm.value.communication_expense) +
                parseNum(expenseForm.value.utilities_expense) +
                parseNum(expenseForm.value.sundries);
  
  // Round to 2 decimal places to avoid floating point errors
  return Math.round(total * 100) / 100;
};

const updateTotal = () => {
  expenseForm.value.total_amount = calculateExpenseTotal();
};

const normalizeNumericFields = (form) => {
  const numericFields = [
    'fuel_and_oil',
    'labor_cost',
    'per_diem',
    'repair_and_maintenance',
    'office_supply',
    'communication_expense',
    'utilities_expense',
    'sundries',
    'total_amount'
  ];
  
  numericFields.forEach(field => {
    const val = parseFloat(form[field]) || 0;
    form[field] = Math.max(0, val);
  });
  
  return form;
};

const loadExpenses = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.machinery_id && { machinery_id: filters.value.machinery_id }),
      ...(filters.value.start_date && { start_date: filters.value.start_date }),
      ...(filters.value.end_date && { end_date: filters.value.end_date })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/expenses?${params}`);
    const data = await response.json();
    
    if (data.success) {
      expenses.value = data.expenses;
    }
  } catch (error) {
    console.error('Error loading expenses:', error);
    showAlert('Failed to load expenses', 'error');
  }
};

const loadMachinery = async () => {
  try {
    // Load machinery filtered by barangay for non-admin users
    const token = authStore.token;
    const response = await fetch(`${API_BASE_URL}/machinery/inventory`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    
    if (data.success) {
      machinery.value = data.inventory || [];
    }
  } catch (error) {
    console.error('Error loading machinery:', error);
  }
};

const loadBarangays = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/barangays`);
    const data = await response.json();
    if (data.success) {
      barangays.value = data.barangays || [];
    }
  } catch (error) {
    console.error('Error loading barangays:', error);
  }
};

const loadTotalMembers = async () => {
  try {
    // Load members for the user's barangay (for non-admin)
    const token = authStore.token;
    const response = await fetch(`${API_BASE_URL}/farmers`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    const data = await response.json();
    
    if (data.success) {
      // For non-admin users, filter by barangay
      const farmers = data.farmers || [];
      if (userRole.value !== 'admin' && userBarangayId.value) {
        totalMembers.value = farmers.filter(f => f.barangay_id === userBarangayId.value && f.status === 'approved').length;
      } else {
        totalMembers.value = farmers.filter(f => f.status === 'approved').length;
      }
    }
  } catch (error) {
    console.error('Error loading total members:', error);
  }
};

const loadIncome = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.machinery_id && { machinery_id: filters.value.machinery_id }),
      ...(filters.value.start_date && { start_date: filters.value.start_date }),
      ...(filters.value.end_date && { end_date: filters.value.end_date })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/income?${params}`);
    const data = await response.json();
    
    if (data.success) {
      income.value = data.income;
    }
  } catch (error) {
    console.error('Error loading income:', error);
    showAlert('Failed to load income records', 'error');
  }
};

const loadProfitSummary = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.start_date && { start_date: filters.value.start_date }),
      ...(filters.value.end_date && { end_date: filters.value.end_date }),
      ...(isAdmin.value && selectedBarangayId.value && { barangay_id: selectedBarangayId.value })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/profit-summary?${params}`);
    const data = await response.json();
    
    if (data.success) {
      profitSummary.value = data.summary;
    }
  } catch (error) {
    console.error('Error loading profit summary:', error);
  }
};

const loadExpenseBreakdown = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.start_date && { start_date: filters.value.start_date }),
      ...(filters.value.end_date && { end_date: filters.value.end_date }),
      ...(isAdmin.value && selectedBarangayId.value && { barangay_id: selectedBarangayId.value })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/expenses-breakdown?${params}`);
    const data = await response.json();
    
    if (data.success) {
      expenseBreakdown.value = data.breakdown;
    }
  } catch (error) {
    console.error('Error loading expense breakdown:', error);
  }
};

const saveExpense = async () => {
  try {
    // Validate required fields
    if (!expenseForm.value.machinery_id) {
      showAlert('Please select a Machinery/Equipment', 'error');
      return;
    }
    
    if (!expenseForm.value.date_of_expense) {
      showAlert('Please select a Date of Expense', 'error');
      return;
    }
    
    if (!expenseForm.value.particulars || expenseForm.value.particulars.trim() === '') {
      showAlert('Please enter Particulars (Details of expense)', 'error');
      return;
    }

    if (!expenseForm.value.reference_number || expenseForm.value.reference_number.trim() === '') {
      showAlert('Receipt/Reference number is required', 'error');
      return;
    }
    
    if (!expenseForm.value.total_amount || expenseForm.value.total_amount <= 0) {
      showAlert('Total Amount must be greater than 0', 'error');
      return;
    }
    
    const method = editingExpense.value ? 'PUT' : 'POST';
    const url = editingExpense.value 
      ? `${API_BASE_URL}/machinery-financial/expenses/${editingExpense.value.id}`
      : `${API_BASE_URL}/machinery-financial/expenses`;
    
    const payloadData = normalizeNumericFields({ ...expenseForm.value });
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payloadData,
        user_id: authStore.currentUser.id
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert(
        editingExpense.value ? 'Expense updated successfully' : 'Expense recorded successfully',
        'success'
      );
      showExpenseForm.value = false;
      editingExpense.value = null;
      resetExpenseForm();
      loadExpenses();
      loadProfitSummary();
      loadExpenseBreakdown();
    } else {
      showAlert(data.message || 'Failed to save expense', 'error');
    }
  } catch (error) {
    console.error('Error saving expense:', error);
    showAlert('Failed to save expense', 'error');
  }
};

const saveIncome = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/machinery-financial/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...incomeForm.value,
        user_id: authStore.currentUser.id
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('Income recorded successfully', 'success');
      showIncomeForm.value = false;
      resetIncomeForm();
      loadIncome();
      loadProfitSummary();
    } else {
      showAlert(data.message || 'Failed to save income', 'error');
    }
  } catch (error) {
    console.error('Error saving income:', error);
    showAlert('Failed to save income', 'error');
  }
};

const editExpense = (expense) => {
  editingExpense.value = expense;
  const normalized = normalizeNumericFields({ ...expense });
  expenseForm.value = normalized;
  showExpenseForm.value = true;
};

const deleteExpense = async (id) => {
  if (!confirm('Are you sure you want to delete this expense?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/machinery-financial/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: authStore.currentUser.id })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('Expense deleted successfully', 'success');
      loadExpenses();
      loadProfitSummary();
      loadExpenseBreakdown();
    } else {
      showAlert(data.message || 'Failed to delete expense', 'error');
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    showAlert('Failed to delete expense', 'error');
  }
};

const deleteIncome = async (id) => {
  if (!confirm('Are you sure you want to delete this income record?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/machinery-financial/income/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: authStore.currentUser.id })
    });
    
    if (response.ok) {
      showAlert('Income deleted successfully', 'success');
      loadIncome();
      loadProfitSummary();
    }
  } catch (error) {
    console.error('Error deleting income:', error);
    showAlert('Failed to delete income', 'error');
  }
};

// ==================== ACCOUNTS RECEIVABLE & COLLECTIONS ====================

const loadARData = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.machinery_id && { machinery_id: filters.value.machinery_id })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/ar?${params}`);
    const data = await response.json();
    
    if (data.success) {
      arList.value = data.ar || [];
      collectionsSummary.value = data.summary || {
        total_receivables: 0,
        total_collected: 0,
        total_balance: 0
      };
    }
  } catch (error) {
    console.error('Error loading AR data:', error);
    showAlert('Failed to load A/R data', 'error');
  }
};

const loadCollections = async () => {
  try {
    const params = new URLSearchParams({
      user_id: authStore.currentUser.id,
      ...(filters.value.machinery_id && { machinery_id: filters.value.machinery_id })
    });
    
    const response = await fetch(`${API_BASE_URL}/machinery-financial/collections?${params}`);
    const data = await response.json();
    
    if (data.success) {
      collections.value = data.collections || [];
    }
  } catch (error) {
    console.error('Error loading collections:', error);
    showAlert('Failed to load collections', 'error');
  }
};

const recordCollection = (ar) => {
  editingCollection.value = ar;
  showCollectionForm.value = true;
};

const deleteCollection = async (id) => {
  if (!confirm('Are you sure you want to delete this collection record?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/machinery-financial/collections/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: authStore.currentUser.id })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showAlert('Collection deleted successfully', 'success');
      loadCollections();
      loadARData();
      loadProfitSummary();
    }
  } catch (error) {
    console.error('Error deleting collection:', error);
    showAlert('Failed to delete collection', 'error');
  }
};

const setFullPaymentAmount = () => {
  // Auto-fill full payment with remaining balance
  collectionForm.value.paymentAmount = remainingBalance.value;
  collectionForm.value.addInterest = false; // Disable interest for full payments
};

const validatePaymentAmount = () => {
  if (collectionForm.value.paymentType === 'full') {
    // For full payment, always match remaining balance
    collectionForm.value.paymentAmount = remainingBalance.value;
  } else if (collectionForm.value.paymentType === 'partial') {
    // For partial payment, ensure it doesn't exceed remaining balance
    if (collectionForm.value.paymentAmount > remainingBalance.value) {
      collectionForm.value.paymentAmount = remainingBalance.value;
      showAlert('Payment amount cannot exceed remaining balance', 'error');
    }
    // If partial amount equals full balance, auto-switch to Full Payment
    if (collectionForm.value.paymentAmount > 0 && Math.abs(collectionForm.value.paymentAmount - remainingBalance.value) < 0.01) {
      collectionForm.value.paymentType = 'full';
      collectionForm.value.addInterest = false;
      showAlert('Amount equals full balance — switched to Full Payment automatically.', 'success');
    }
  }
};

const saveCollection = async () => {
  try {
    // Validation
    if (!collectionForm.value.collectionDate) {
      showAlert('Please select collection date', 'error');
      return;
    }
    
    if (collectionForm.value.paymentAmount <= 0) {
      showAlert('Payment amount must be greater than 0', 'error');
      return;
    }

    if (!collectionForm.value.receiptNumber || collectionForm.value.receiptNumber.trim() === '') {
      showAlert('Receipt number is required', 'error');
      return;
    }
    
    if (collectionForm.value.paymentAmount > remainingBalance.value + 0.01) {
      showAlert('Payment amount cannot exceed remaining balance (₱' + formatNumber(remainingBalance.value) + ')', 'error');
      return;
    }

    // Block partial payment if amount equals full balance
    if (collectionForm.value.paymentType === 'partial' && Math.abs(collectionForm.value.paymentAmount - remainingBalance.value) < 0.01) {
      collectionForm.value.paymentType = 'full';
      collectionForm.value.addInterest = false;
      showAlert('Amount equals full balance — switched to Full Payment.', 'success');
      return;
    }

    // Force-clear interest if conditions aren't met (safety check)
    if (collectionForm.value.addInterest && !canApplyInterest.value) {
      collectionForm.value.addInterest = false;
    }
    
    // Update interest season based on months elapsed
    collectionForm.value.interestSeason = interestSeason.value.season;
    
    // Prepare collection data
    const collectionData = {
      booking_id: editingCollection.value.booking_id || editingCollection.value.id,
      machinery_id: editingCollection.value.machinery_id,
      collection_amount: collectionForm.value.paymentAmount,
      collection_date: collectionForm.value.collectionDate,
      payment_method: 'cash', // Always cash for face-to-face payment
      receipt_number: collectionForm.value.receiptNumber.trim(),
      remarks: collectionForm.value.remarks || null,
      user_id: authStore.currentUser.id,
      // New fields for tracking
      payment_type: collectionForm.value.paymentType, // 'full' or 'partial'
      include_interest: collectionForm.value.addInterest && canApplyInterest.value,
      interest_amount: (collectionForm.value.addInterest && canApplyInterest.value) ? interestAmount.value : 0,
      interest_season: (collectionForm.value.addInterest && canApplyInterest.value) ? collectionForm.value.interestSeason : 0,
      total_collection: totalCollectionAmount.value
    };
    
    // Save collection to backend
    const response = await fetch(`${API_BASE_URL}/machinery-financial/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectionData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // If partial payment with interest, show interest amount in message
      const interestMsg = collectionForm.value.addInterest && collectionForm.value.paymentType === 'partial' 
        ? ` (including ₱${formatNumber(interestAmount.value)} interest)`
        : '';
      
      showAlert(
        `Collection recorded successfully: ₱${formatNumber(collectionForm.value.paymentAmount)}${interestMsg}. Payment moved to income section.`,
        'success'
      );
      
      showCollectionForm.value = false;
      resetCollectionForm();
      loadCollections();
      loadARData();
      loadIncome(); // Refresh income to show new collection
      loadProfitSummary();
    } else {
      showAlert(data.message || 'Failed to record collection', 'error');
    }
  } catch (error) {
    console.error('Error saving collection:', error);
    showAlert('Failed to record collection', 'error');
  }
};

const resetCollectionForm = () => {
  collectionForm.value = {
    paymentType: 'full',
    paymentAmount: 0,
    collectionDate: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    remarks: '',
    addInterest: false,
    interestSeason: 1
  };
  editingCollection.value = null;
};

const clearFilters = () => {
  filters.value.machinery_id = '';
  filters.value.start_date = '';
  filters.value.end_date = '';
  loadExpenses();
  loadIncome();
  loadProfitSummary();
  loadExpenseBreakdown();
};

const distributeProfit = () => {
  showAlert('Profit distribution feature coming soon', 'success');
};

const generateProfitDistributionRecord = async () => {
  try {
    if (!canManage.value) {
      showAlert('Only treasurers can generate distribution records.', 'error');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/machinery-financial/profit-distribution/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: authStore.currentUser.id,
        start_date: filters.value.start_date || null,
        end_date: filters.value.end_date || null,
        distribution_period: `${filters.value.start_date || 'beginning'} to ${filters.value.end_date || 'present'}`
      })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('Profit distribution generated and secured in blockchain ledger.', 'success');
    } else {
      showAlert(data.message || 'Failed to generate profit distribution.', 'error');
    }
  } catch (error) {
    console.error('Error generating profit distribution record:', error);
    showAlert('Failed to generate profit distribution.', 'error');
  }
};

const generateReport = async (type) => {
  if (!authStore.currentUser?.id) {
    showAlert('User not authenticated', 'error');
    return;
  }
  
  reportLoading.value = true;
  try {
    let url = `${API_BASE_URL}/machinery-financial/reports/transactions?user_id=${authStore.currentUser.id}&type=${type}`;
    if (isAdmin.value && selectedBarangayId.value) {
      url += `&barangay_id=${selectedBarangayId.value}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      reportData.value = data.report;
      showAlert(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully`, 'success');
    } else {
      showAlert(data.message || 'Failed to generate report', 'error');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    showAlert('Failed to generate report', 'error');
  } finally {
    reportLoading.value = false;
  }
};

const formatReportDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-PH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getTransactionTypeClass = (type) => {
  switch (type) {
    case 'Expense': return 'badge-expense';
    case 'Income': return 'badge-income';
    case 'Collection': return 'badge-collection';
    default: return '';
  }
};

// Report filter helper functions
const selectAllFilters = () => {
  reportFilters.value.showSummary = true;
  reportFilters.value.showDistribution = true;
  reportFilters.value.showAllTransactions = true;
  reportFilters.value.showExpenses = true;
  reportFilters.value.showCollections = true;
  reportFilters.value.showBookings = true;
};

const clearAllFilters = () => {
  reportFilters.value.showSummary = false;
  reportFilters.value.showDistribution = false;
  reportFilters.value.showAllTransactions = false;
  reportFilters.value.showExpenses = false;
  reportFilters.value.showCollections = false;
  reportFilters.value.showBookings = false;
};

// Generate report with custom date range
const generateReportCustom = async () => {
  if (!authStore.currentUser?.id) {
    showAlert('User not authenticated', 'error');
    return;
  }
  
  if (!reportFilters.value.startDate || !reportFilters.value.endDate) {
    showAlert('Please select both start and end dates', 'error');
    return;
  }
  
  reportLoading.value = true;
  try {
    let url = `${API_BASE_URL}/machinery-financial/reports/transactions?user_id=${authStore.currentUser.id}&type=custom&start_date=${reportFilters.value.startDate}&end_date=${reportFilters.value.endDate}`;
    if (isAdmin.value && selectedBarangayId.value) {
      url += `&barangay_id=${selectedBarangayId.value}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      reportData.value = data.report;
      showAlert('Custom date range report generated successfully', 'success');
    } else {
      showAlert(data.message || 'Failed to generate report', 'error');
    }
  } catch (error) {
    console.error('Error generating report:', error);
    showAlert('Failed to generate report', 'error');
  } finally {
    reportLoading.value = false;
  }
};

// Print report function — legacy-like stable flow
const printReport = () => {
  if (!reportData.value) {
    showAlert('No report data to print', 'error');
    return;
  }

  const printContents = document.getElementById('printable-report');
  if (!printContents) {
    showAlert('Report content not found', 'error');
    return;
  }

  const orientation = ['portrait', 'landscape'].includes(printOrientation.value)
    ? printOrientation.value
    : 'portrait';

  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) {
    showAlert('Please allow popups to print the report', 'error');
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>CALFFA Machinery Financial Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 20px; background: #fff; }

    .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2d6a4f; padding-bottom: 15px; margin-bottom: 20px; }
    .report-logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { font-size: 32px; }
    .logo-text h3 { font-size: 18px; color: #2d6a4f; }
    .logo-text p { font-size: 12px; color: #666; }
    .report-meta { text-align: right; }
    .report-meta h3 { font-size: 16px; color: #2d6a4f; }
    .report-period, .report-generated { font-size: 11px; color: #666; margin-top: 3px; }

    .report-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 10px; }
    .card-icon-wrapper { font-size: 24px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
    .card-icon-wrapper.expense { background: #fce4ec; }
    .card-icon-wrapper.income { background: #e8f5e9; }
    .card-icon-wrapper.collection { background: #fff3e0; }
    .card-icon-wrapper.profit { background: #e8f5e9; }
    .card-icon-wrapper.loss { background: #fce4ec; }
    .summary-label { font-size: 11px; color: #888; display: block; }
    .summary-value { font-size: 16px; font-weight: 700; display: block; color: #222; }
    .summary-count { font-size: 10px; color: #aaa; display: block; }
    .expense-card { border-left: 3px solid #e53935; }
    .income-card { border-left: 3px solid #43a047; }
    .collection-card { border-left: 3px solid #fb8c00; }
    .profit-card { border-left: 3px solid #2e7d32; }
    .loss-card { border-left: 3px solid #c62828; }

    .distribution-summary { margin-bottom: 20px; }
    .distribution-summary h4 { font-size: 14px; margin-bottom: 10px; color: #2d6a4f; }
    .distribution-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .dist-item { border: 1px solid #ddd; border-radius: 8px; padding: 10px; display: flex; align-items: center; gap: 8px; }
    .dist-icon { font-size: 20px; }
    .dist-label { font-size: 11px; color: #888; display: block; }
    .dist-value { font-size: 14px; font-weight: 700; display: block; }
    .dist-item.highlight { background: #f0fdf4; border-color: #86efac; }

    .section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #e0e0e0; }
    .section-title h4 { font-size: 14px; color: #333; }
    .section-icon { font-size: 16px; }
    .section-count { font-size: 11px; color: #999; margin-left: auto; }

    .report-section-card, .report-transactions { margin-bottom: 20px; page-break-inside: avoid; }
    .table-container { overflow-x: visible; }
    table.data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    table.data-table th { background: #f5f5f5; font-weight: 600; padding: 8px 10px; text-align: left; border: 1px solid #ddd; color: #444; }
    table.data-table td { padding: 6px 10px; border: 1px solid #eee; color: #333; }
    table.data-table tbody tr:nth-child(even) { background: #fafafa; }
    .text-right { text-align: right; }
    .text-red { color: #e53935; }
    .text-green { color: #2e7d32; }
    .total-row td { background: #f5f5f5; font-weight: 600; border-top: 2px solid #ccc; }
    .description-cell { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .empty-cell { text-align: center; color: #999; padding: 20px; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
    .badge-expense, .badge-Expense { background: #fce4ec; color: #c62828; }
    .badge-income, .badge-Income { background: #e8f5e9; color: #2e7d32; }
    .badge-collection, .badge-Collection { background: #fff3e0; color: #e65100; }
    .badge-full { background: #e8f5e9; color: #2e7d32; }
    .badge-partial { background: #fff3e0; color: #e65100; }
    .badge-completed { background: #e8f5e9; color: #2e7d32; }
    .badge-pending { background: #fff3e0; color: #e65100; }
    .badge-unpaid { background: #fce4ec; color: #c62828; }
    .badge-paid { background: #e8f5e9; color: #2e7d32; }

    .report-footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e0e0e0; text-align: center; color: #999; font-size: 11px; }
    .footer-date { margin-top: 3px; }

    @media print {
      body { padding: 0; }
      @page { size: A4 ${orientation}; margin: 8mm; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  ${printContents.innerHTML}
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  const triggerPrint = () => {
    if (printWindow.closed) return;
    printWindow.focus();
    printWindow.print();
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 300);
  };

  // Wait for full render/images like the previous stable behavior
  printWindow.onload = () => {
    setTimeout(triggerPrint, 250);
  };

  // Fallback for browsers that don't reliably fire onload on document.write
  setTimeout(() => {
    if (!printWindow.closed) {
      triggerPrint();
    }
  }, 1200);
};

const resetExpenseForm = () => {
  expenseForm.value = {
    machinery_id: '',
    date_of_expense: '',
    particulars: '',
    reference_number: '',
    fuel_and_oil: 0,
    labor_cost: 0,
    per_diem: 0,
    repair_and_maintenance: 0,
    office_supply: 0,
    communication_expense: 0,
    utilities_expense: 0,
    sundries: 0,
    total_amount: 0
  };
};

const resetIncomeForm = () => {
  incomeForm.value = {
    date_of_income: '',
    machinery_id: '',
    booking_id: '',
    income_amount: '',
    remarks: ''
  };
};

const showAlert = (message, type = 'success') => {
  alert.value = { show: true, message, type };
  setTimeout(() => {
    alert.value.show = false;
  }, 3000);
};

// Watch for admin barangay filter changes
watch(selectedBarangayId, () => {
  if (isAdmin.value) {
    loadProfitSummary();
    loadExpenseBreakdown();
    // Clear report data when filter changes
    reportData.value = null;
  }
});

// Load data on mount
// Ctrl+P handler: intercept and trigger report print when on reports tab with data
const handleKeyDown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    if (activeTab.value === 'reports' && reportData.value) {
      e.preventDefault();
      printReport();
    }
  }
};

onMounted(async () => {
  // Listen for Ctrl+P
  window.addEventListener('keydown', handleKeyDown);

  if (hasAccess.value) {
    loadExpenses();
    loadIncome();
    loadARData();
    loadCollections();
    loadProfitSummary();
    loadExpenseBreakdown();
    loadMachinery();
    loadTotalMembers();
    // Load barangays for admin filter
    if (isAdmin.value) {
      loadBarangays();
    }
  }

  // Handle notification highlight
  if (route.query.highlight && route.query.type === 'booking') {
    highlightedBookingId.value = route.query.highlight;
    // Switch to AR tab
    activeTab.value = 'ar';
    await nextTick();
    setTimeout(() => {
      const el = document.querySelector(`[data-booking-id="${route.query.highlight}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => { highlightedBookingId.value = null; }, 6000);
    }, 500);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
/* Notification highlight for table rows */
.notification-highlight-row {
  animation: highlightRowPulse 2s ease-in-out 3;
  background: #fef2f2 !important;
  outline: 2px solid #ef4444;
  outline-offset: -2px;
}

.notification-highlight-row td {
  background: #fef2f2 !important;
  color: #991b1b;
  font-weight: 600;
}

@keyframes highlightRowPulse {
  0%, 100% { box-shadow: inset 0 0 0 2px rgba(74, 222, 128, 0.2); }
  50% { box-shadow: inset 0 0 0 2px rgba(74, 222, 128, 0.6); }
}

/* ===== GLASSMORPHIC GREEN THEME ===== */
.financial-container {
  --glass-bg: rgba(29, 43, 33, 0.92);
  --glass-bg-soft: rgba(35, 52, 41, 0.84);
  --glass-panel: rgba(31, 48, 36, 0.94);
  --glass-line: rgba(255, 255, 255, 0.1);
  --glass-line-strong: rgba(255, 255, 255, 0.18);
  --text-main: #eefde6;
  --text-muted: rgba(220, 238, 211, 0.78);
  --text-soft: rgba(220, 238, 211, 0.62);
  --green: #34d399;
  --yellow: #86efac;
  --blue: #22c55e;
  --teal: #2dd4bf;
  --lime: #a3e635;
  --red: #f87171;
  
  min-height: 100vh;
  padding: 28px;
  background: linear-gradient(145deg, #0f1712 0%, #132119 22%, #1a2b20 45%, #243b2c 72%, #2f4a38 100%);
  position: relative;
  isolation: isolate;
  overflow: visible;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: var(--text-main);
}

.financial-container::before,
.financial-container::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}

.financial-container::before {
  background:
    radial-gradient(ellipse 82% 56% at 12% 88%, rgba(17, 94, 41, 0.22) 0%, transparent 62%),
    radial-gradient(ellipse 75% 55% at 92% 10%, rgba(34, 197, 94, 0.14) 0%, transparent 64%),
    radial-gradient(circle at 50% 16%, rgba(45, 212, 191, 0.11) 0%, transparent 22%),
    linear-gradient(130deg, rgba(163, 230, 53, 0.03) 0%, transparent 38%, rgba(45, 212, 191, 0.03) 100%);
  animation: ambienceDrift 16s ease-in-out infinite alternate;
}

.financial-container::after {
  background:
    radial-gradient(circle at 94% 8%, rgba(34, 197, 94, 0.2) 0%, transparent 17%),
    radial-gradient(circle at 8% 86%, rgba(74, 222, 128, 0.16) 0%, transparent 20%),
    radial-gradient(circle at 80% 74%, rgba(45, 212, 191, 0.18) 0%, transparent 18%),
    radial-gradient(circle at 22% 30%, rgba(163, 230, 53, 0.14) 0%, transparent 16%),
    repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.015) 0px, rgba(255, 255, 255, 0.015) 1px, transparent 1px, transparent 14px);
  filter: blur(10px);
  animation: orbPulse 11s ease-in-out infinite;
}

@keyframes ambienceDrift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  100% {
    transform: translate3d(-10px, 8px, 0) scale(1.03);
  }
}

@keyframes orbPulse {
  0%,
  100% {
    opacity: 0.9;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.financial-container > * {
  position: relative;
  z-index: 1;
}

.page-header {
  margin-bottom: 28px;
  padding: 36px 40px;
  background: linear-gradient(135deg, rgba(28, 41, 31, 0.94) 0%, rgba(35, 54, 40, 0.9) 56%, rgba(48, 78, 62, 0.84) 100%);
  border-radius: 26px;
  border: 1px solid var(--glass-line);
  box-shadow:
    18px 18px 34px rgba(8, 14, 10, 0.5),
    -14px -14px 26px rgba(42, 61, 46, 0.4),
    inset 1px 1px 0 rgba(255, 255, 255, 0.08),
    inset -1px -1px 0 rgba(0, 0, 0, 0.34);
  position: relative;
  overflow: hidden;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 760px;
  margin-left: 0;
  margin-right: auto;
  align-items: flex-start;
  text-align: left;
}

.page-header::before {
  content: '';
  position: absolute;
  inset: -35% -10% auto auto;
  width: 240px;
  height: 240px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.22) 0%, rgba(45, 212, 191, 0) 68%);
  pointer-events: none;
}

.page-header::after {
  content: '';
  position: absolute;
  inset: auto auto -50% -8%;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(163, 230, 53, 0.18) 0%, rgba(163, 230, 53, 0) 70%);
  pointer-events: none;
}

.page-header h1 {
  font-size: 38px;
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.9px;
  margin: 0;
  background: linear-gradient(90deg, #86efac 0%, #4ade80 45%, #22c55e 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-subtitle {
  color: var(--text-muted);
  margin: 0;
  font-size: 16px;
  line-height: 1.45;
  font-weight: 500;
}

.access-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 32px;
}

.denied-content {
  text-align: center;
  background: var(--glass-bg);
  border: 1px solid var(--glass-line);
  border-radius: 24px;
  padding: 48px;
  backdrop-filter: blur(18px);
  box-shadow:
    16px 16px 30px rgba(8, 14, 10, 0.52),
    -14px -14px 28px rgba(42, 61, 46, 0.44),
    inset 1px 1px 0 rgba(255, 255, 255, 0.08);
}

.denied-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.denied-text {
  font-size: 24px;
  color: var(--text-main);
  margin-bottom: 8px;
  font-weight: 700;
}

.denied-reason {
  color: var(--text-soft);
  font-size: 14px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.distribution-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.summary-card {
  background: linear-gradient(145deg, rgba(32, 48, 37, 0.96), rgba(24, 36, 28, 0.94));
  border: 1px solid rgba(190, 235, 203, 0.24);
  border-radius: 18px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow:
    12px 12px 24px rgba(8, 13, 10, 0.52),
    0 0 0 1px rgba(20, 32, 24, 0.5),
    inset 1px 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -20px 24px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow:
    18px 18px 32px rgba(8, 13, 10, 0.56),
    0 14px 28px rgba(16, 56, 33, 0.26),
    inset 1px 1px 0 rgba(255, 255, 255, 0.1);
}

.summary-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 88% 12%, rgba(163, 230, 53, 0.14) 0%, rgba(163, 230, 53, 0) 44%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.04) 0%, transparent 55%);
  pointer-events: none;
}

.summary-card::after {
  content: '';
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 999px;
  right: -36px;
  bottom: -40px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.16) 0%, rgba(45, 212, 191, 0) 70%);
  pointer-events: none;
}

.summary-card:nth-child(odd) {
  animation: cardFloat 9s ease-in-out infinite;
}

.summary-card:nth-child(even) {
  animation: cardFloat 11s ease-in-out infinite reverse;
}

.income-card {
  border-image: linear-gradient(135deg, rgba(74, 222, 128, 0.8), rgba(74, 222, 128, 0.2)) 1;
}

.expense-card {
  border-image: linear-gradient(135deg, rgba(74, 222, 128, 0.75), rgba(22, 163, 74, 0.25)) 1;
}

.profit-card {
  border-image: linear-gradient(135deg, rgba(34, 197, 94, 0.85), rgba(16, 185, 129, 0.28)) 1;
}

.profit-card.negative {
  border-image: linear-gradient(135deg, rgba(248, 113, 113, 0.85), rgba(251, 191, 36, 0.2)) 1;
}

.card-icon {
  font-size: 42px;
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.24), rgba(22, 163, 74, 0.22));
  flex-shrink: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-label {
  color: #111;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  margin-bottom: 6px;
  text-shadow: none;
}

.card-amount {
  font-size: 33px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.7px;
  color: #1a5c2a;
  text-shadow: none;
}

.tabs-container {
  display: flex;
  gap: 14px;
  margin-bottom: 26px;
  flex-wrap: nowrap;
  width: 100%;
}

.tab {
  padding: 15px 26px;
  border: 1px solid rgba(134, 239, 172, 0.35);
  background: linear-gradient(135deg, rgba(236, 253, 245, 0.95), rgba(220, 252, 231, 0.9));
  cursor: pointer;
  font-size: 18px;
  font-weight: 800;
  color: #14532d;
  border-radius: 16px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  min-height: 54px;
  flex: 1 1 0;
  text-align: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(3, 16, 10, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.tab:hover {
  background: linear-gradient(135deg, rgba(220, 252, 231, 1), rgba(187, 247, 208, 0.96));
  border-color: rgba(22, 163, 74, 0.45);
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(3, 16, 10, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.tab.active {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 60%, #166534 100%);
  border-color: rgba(167, 243, 208, 0.65);
  color: #f0fdf4;
  box-shadow: 0 12px 22px rgba(6, 78, 35, 0.35), inset 0 1px 0 rgba(220, 252, 231, 0.22);
}

@media (max-width: 768px) {
  .tabs-container {
    flex-wrap: wrap;
  }

  .tab {
    padding: 13px 20px;
    font-size: 16px;
    min-height: 48px;
    flex: 1 1 calc(50% - 10px);
  }
}

.tab-content {
  background: var(--glass-bg);
  border: 1px solid var(--glass-line);
  border-radius: 18px;
  padding: 24px 28px;
  backdrop-filter: blur(18px);
  box-shadow:
    14px 14px 26px rgba(8, 13, 10, 0.5),
    0 0 0 1px rgba(20, 32, 24, 0.45),
    inset 1px 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -26px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.tab-content::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 10%, rgba(163, 230, 53, 0.08) 0%, rgba(163, 230, 53, 0) 28%),
    radial-gradient(circle at 88% 88%, rgba(45, 212, 191, 0.08) 0%, rgba(45, 212, 191, 0) 30%);
  pointer-events: none;
}

@keyframes cardFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main);
}

.filters-section {
  display: flex;
  gap: 14px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: end;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(187, 247, 208, 0.22);
  background: linear-gradient(135deg, rgba(39, 58, 45, 0.72), rgba(26, 41, 32, 0.7));
}

.filter-input,
.filter-select-glass {
  padding: 11px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  font-size: 15px;
  background: rgba(39, 58, 45, 0.92);
  color: var(--text-main);
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.34), inset -2px -2px 4px rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;
  min-height: 44px;
}

.filter-input:focus,
.filter-select-glass:focus {
  outline: none;
  border-color: var(--green);
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.34), 0 0 0 3px rgba(74, 222, 128, 0.1);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 190px;
  flex: 1;
}

.filter-label {
  font-size: 13px;
  font-weight: 800;
  color: rgba(220, 238, 211, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.75px;
}

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
  align-self: end;
}

.table-container {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid var(--glass-line);
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.expenses-table,
.income-table,
.ar-table,
.collections-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}

.expenses-table thead,
.income-table thead,
.ar-table thead,
.collections-table thead {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
}

.expenses-table th,
.income-table th,
.ar-table th,
.collections-table th {
  padding: 16px 18px;
  text-align: left;
  font-weight: 800;
  color: var(--text-main);
  border-bottom: 2px solid rgba(74, 222, 128, 0.2);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(74, 222, 128, 0.08);
}

.expenses-table td,
.income-table td,
.ar-table td,
.collections-table td {
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  font-size: 14px;
  font-weight: 600;
}

.expenses-table tbody tr:nth-child(even),
.income-table tbody tr:nth-child(even),
.ar-table tbody tr:nth-child(even),
.collections-table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.03);
}

.expenses-table tbody tr:hover,
.income-table tbody tr:hover,
.ar-table tbody tr:hover,
.collections-table tbody tr:hover {
  background: rgba(74, 222, 128, 0.12);
  transition: all 0.2s ease;
}

.amount-cell {
  font-weight: 800;
  font-size: 15px;
  color: #b7f7c8;
  font-family: 'Courier New', monospace;
}

.amount-cell.balance {
  color: #bbf7d0;
  font-weight: 800;
}

.amount-cell.balance.highlight {
  background: rgba(248, 113, 113, 0.25);
  color: #fecaca;
  font-weight: 900;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(248, 113, 113, 0.4);
}

.ar-section,
.collections-section {
  margin-top: 24px;
}

.section-subheader {
  margin-bottom: 16px;
}

.section-subheader h3 {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}

.ar-card {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.18), rgba(22, 163, 74, 0.12));
  border: 1px solid rgba(74, 222, 128, 0.24);
  padding: 12px;
  border-radius: 12px;
}

.collected-card {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.1));
  border: 1px solid rgba(74, 222, 128, 0.2);
  padding: 12px;
  border-radius: 12px;
}

.balance-card {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(248, 113, 113, 0.1));
  border: 1px solid rgba(248, 113, 113, 0.2);
  padding: 12px;
  border-radius: 12px;
}

/* A/R summary cards: equal-size responsive layout */
.summary-container {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-container > .summary-card {
  min-height: 148px;
  height: 100%;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 11px;
  border-radius: 16px;
  transition: transform 220ms ease, box-shadow 240ms ease, border-color 220ms ease;
}

.summary-container > .summary-card:hover {
  transform: translateY(-3px) scale(1.01);
  border-color: rgba(187, 247, 208, 0.42);
  box-shadow: 0 16px 28px rgba(2, 10, 6, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.summary-container > .summary-card .card-content {
  align-items: center;
}

.summary-container > .summary-card .card-label {
  color: #f1fdf5;
  font-size: 12.5px;
  font-weight: 900;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  margin-bottom: 4px;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}

.summary-container > .summary-card .card-amount {
  font-size: clamp(2.1rem, 3.7vw, 2.5rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.15);
}

.summary-container > .summary-card .card-icon {
  width: 52px;
  height: 52px;
  font-size: 30px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.26);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.28);
  transition: transform 220ms ease, box-shadow 240ms ease, filter 220ms ease;
}

.summary-container > .summary-card:hover .card-icon {
  transform: translateY(-1px) scale(1.06);
  filter: saturate(1.08);
  box-shadow: 0 12px 22px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.32);
}

.summary-container .ar-card .card-icon.icon-receivables {
  background: linear-gradient(135deg, rgba(134, 239, 172, 0.42), rgba(34, 197, 94, 0.28));
}

.summary-container .collected-card .card-icon.icon-collected {
  background: linear-gradient(135deg, rgba(187, 247, 208, 0.4), rgba(16, 185, 129, 0.28));
}

.summary-container .balance-card .card-icon.icon-balance {
  background: linear-gradient(135deg, rgba(254, 202, 202, 0.75), rgba(248, 113, 113, 0.55));
  border-color: rgba(239, 68, 68, 0.45);
  color: #7f1d1d;
  font-size: 32px;
  box-shadow: 0 12px 22px rgba(127, 29, 29, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.summary-container .ar-card .card-amount {
  color: #86efac;
}

.summary-container .collected-card .card-amount {
  color: #bbf7d0;
}

.summary-container .balance-card .card-amount {
  color: #fca5a5;
}

@media (max-width: 980px) {
  .summary-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .summary-container {
    grid-template-columns: 1fr;
  }
}

.btn-primary-small {
  padding: 8px 14px;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.26), rgba(22, 163, 74, 0.2));
  color: var(--green);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary-small:hover {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.36), rgba(22, 163, 74, 0.3));
  border-color: var(--green);
  transform: translateY(-1px);
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.full-payment {
  background: rgba(74, 222, 128, 0.2);
  color: #b7f7c8;
}

.status-badge.partial-payment {
  background: rgba(74, 222, 128, 0.2);
  color: #d1fae5;
}

.status-badge.unpaid {
  background: rgba(248, 113, 113, 0.2);
  color: #fecaca;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  color: var(--green);
}

.btn-edit:hover {
  opacity: 0.9;
}

.btn-delete:hover {
  opacity: 0.9;
  color: var(--red);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-soft);
}

.info-text {
  padding: 12px 16px;
  background: rgba(34, 197, 94, 0.12);
  border-left: 4px solid var(--green);
  color: #d1fae5;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
}

.profit-breakdown {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-items: start;
}

.breakdown-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(190, 235, 203, 0.18);
  border-radius: 14px;
  padding: 20px 22px;
  backdrop-filter: blur(6px);
}

.breakdown-card h3 {
  margin: 0 0 14px 0;
  font-size: 16px;
  color: #b6f7cb;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
}

.amount {
  font-size: 29px;
  font-weight: 900;
  color: #4ade80;
  margin: 0;
  text-shadow: 0 0 12px rgba(74, 222, 128, 0.35);
}

.amount.negative {
  color: var(--red);
}

.expense-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 14px;
}

.expense-item span:first-child {
  color: rgba(220, 238, 211, 0.82);
  font-weight: 600;
}

.expense-item span:last-child {
  color: #86efac;
  font-weight: 800;
  font-size: 14px;
  font-family: monospace;
}

.expense-item.total {
  font-weight: 800;
  border-top: 1px solid rgba(190, 235, 203, 0.3);
  border-bottom: none;
  margin-top: 4px;
  padding-top: 8px;
}

.expense-item.total span:first-child {
  color: #eefde6;
  font-size: 14px;
}

.expense-item.total span:last-child {
  color: #4ade80;
  font-size: 16px;
}

.profit {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(34, 197, 94, 0.08));
  border: 1px solid rgba(52, 211, 153, 0.25);
  padding: 20px 22px;
  border-radius: 14px;
}

.profit-distribution-section {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid rgba(190, 235, 203, 0.15);
}

.profit-distribution-section h3 {
  margin: 0 0 6px 0;
  font-size: 22px;
  font-weight: 800;
  color: #b6f7cb;
  letter-spacing: 0.3px;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 360px));
  gap: 32px;
  
  margin-top: 20px;
  justify-content: center;
}

.distribution-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0;
  padding: 30px 20px 24px;
  border-radius: 18px;
  background: rgba(22, 35, 27, 0.82);
  border: 1px solid rgba(190, 235, 203, 0.16);
  border-top: 3px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.06);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.distribution-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  border-radius: 18px 18px 0 0;
}

.distribution-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.38);
}

.distribution-card.org {
  background: linear-gradient(160deg, rgba(251, 191, 36, 0.13) 0%, rgba(22, 35, 27, 0.9) 60%);
  border-color: rgba(251, 191, 36, 0.28);
}
.distribution-card.org::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

.distribution-card.training {
  background: linear-gradient(160deg, rgba(45, 212, 191, 0.13) 0%, rgba(22, 35, 27, 0.9) 60%);
  border-color: rgba(45, 212, 191, 0.28);
}
.distribution-card.training::before { background: linear-gradient(90deg, #0d9488, #2dd4bf); }

.distribution-card.members {
  background: linear-gradient(160deg, rgba(74, 222, 128, 0.13) 0%, rgba(22, 35, 27, 0.9) 60%);
  border-color: rgba(74, 222, 128, 0.28);
}
.distribution-card.members::before { background: linear-gradient(90deg, #16a34a, #4ade80); }

.distribution-icon {
  font-size: 52px;
  line-height: 1;
  margin-bottom: 14px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
}

.distribution-content {
  width: 100%;
}

.distribution-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: rgba(220, 238, 211, 0.75);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.9px;
}

.distribution-content .percentage {
  margin: 0 auto 12px;
  display: inline-block;
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 999px;
  padding: 2px 18px;
  letter-spacing: 0.5px;
}

.distribution-content .amount {
  margin: 0 0 0 0;
  font-size: 29px;
  font-weight: 900;
  color: #4ade80;
  font-family: monospace;
  text-shadow: 0 0 14px rgba(74, 222, 128, 0.4);
}

.distribution-card.org .distribution-content .amount { color: #fbbf24; text-shadow: 0 0 14px rgba(251, 191, 36, 0.4); }
.distribution-card.training .distribution-content .amount { color: #2dd4bf; text-shadow: 0 0 14px rgba(45, 212, 191, 0.4); }

.distribution-content .per-member {
  margin: 10px 0 0 0;
  font-size: 13px;
  font-weight: 700;
  color: rgba(220, 238, 211, 0.65);
  background: rgba(255,255,255,0.06);
  border-radius: 8px;
  padding: 4px 10px;
  display: inline-block;
}

.reports-section {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-success {
  padding: 12px 22px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.btn-primary {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.24), rgba(96, 165, 250, 0.18));
  color: var(--green);
  border: 1px solid rgba(74, 222, 128, 0.3);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.34), rgba(96, 165, 250, 0.28));
  border-color: var(--green);
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-2px);
}

.btn-secondary-outline {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-main);
  padding: 12px 22px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-secondary-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.18);
}

.btn-success {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.32), rgba(74, 222, 128, 0.2));
  color: var(--green);
  border: 1px solid rgba(74, 222, 128, 0.4);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.btn-success:hover {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.42), rgba(74, 222, 128, 0.3));
  border-color: var(--green);
  transform: translateY(-2px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--glass-panel);
  border: 1px solid var(--glass-line-strong);
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow:
    20px 20px 40px rgba(0, 0, 0, 0.4),
    inset 1px 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  padding: 20px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-soft);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-close:hover {
  color: var(--text-main);
}

.modal-body {
  padding: 20px 28px;
}

.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group label {
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-main);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  padding: 11px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  background: rgba(39, 58, 45, 0.92);
  color: var(--text-main);
  min-height: 44px;
  transition: all 0.2s ease;
}

.form-input::placeholder {
  color: var(--text-soft);
}

.form-input:focus {
  outline: none;
  border-color: var(--green);
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.34), 0 0 0 3px rgba(74, 222, 128, 0.1);
}

.expense-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.total-input {
  font-size: 16px;
  font-weight: 700;
  background: rgba(74, 222, 128, 0.1);
  border: 2px solid var(--green);
  cursor: not-allowed;
  color: var(--green);
}

.total-input:readonly {
  background: rgba(74, 222, 128, 0.15);
  color: var(--green);
}

.calculated {
  font-size: 12px;
  color: var(--text-soft);
  margin-top: 4px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.alert {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  z-index: 999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes slideUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.alert-success {
  background: rgba(74, 222, 128, 0.18);
  color: #b7f7c8;
  border-color: rgba(74, 222, 128, 0.3);
}

.alert-error {
  background: rgba(248, 113, 113, 0.18);
  color: #fecaca;
  border-color: rgba(248, 113, 113, 0.3);
}

.alert-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.7;
}

.alert-close:hover {
  opacity: 1;
}

.info-text {
  color: var(--text-soft);
  font-size: 14px;
  margin-bottom: 16px;
}

/* Collection Form Styles */
.highlight-box {
  background: rgba(96, 165, 250, 0.1);
  border: 2px solid var(--blue);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 14px;
  color: var(--text-main);
}

.details-grid div {
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.details-grid div:nth-child(even) {
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding-right: 12px;
}

.details-grid div:nth-child(odd):not(:first-child) {
  padding-left: 12px;
}

.payment-type-group {
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.payment-type-group legend {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--text-main);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
  color: var(--text-main);
}

.radio-label:hover {
  background: rgba(255, 255, 255, 0.08);
}

.radio-label input[type="radio"] {
  margin-top: 4px;
  cursor: pointer;
}

.radio-label span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.radio-label small {
  font-size: 12px;
  color: var(--text-soft);
  font-weight: normal;
}

.payment-interest-box {
  background: rgba(251, 191, 36, 0.1);
  border: 2px solid var(--yellow);
  padding: 16px;
  border-radius: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-main);
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
}

.interest-details {
  margin-top: 12px;
  padding: 12px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.detail-row.highlight {
  background: #fef08a;
  padding: 8px;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 8px;
}

.modal-summary {
  margin-top: 20px;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.summary-table tr {
  border-bottom: 1px solid #d1d5db;
}

.summary-table td {
  padding: 8px 0;
}

.summary-table td:last-child {
  text-align: right;
  padding-right: 8px;
}

.summary-table .amount {
  font-weight: 600;
  color: #1f2937;
}

.summary-table .total-row {
  background: #d1fae5;
  font-weight: 600;
}

.summary-table .total-row td {
  padding: 8px;
  border-radius: 4px;
}

.summary-table .balance-row {
  background: #dbeafe;
  font-weight: 600;
}

.summary-table .balance-row td {
  padding: 8px;
  border-radius: 4px;
}

.modal-large {
  max-width: 700px;
}

.warning-text {
  color: #d97706;
  font-size: 13px;
  font-weight: 500;
  margin-top: 4px;
}

/* Report Styles */
.report-display {
  margin-top: 24px;
}

.report-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.report-header h3 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
}

.report-period, .report-generated {
  margin: 4px 0;
  opacity: 0.9;
}

.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  padding: 16px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-card .summary-label {
  font-size: 0.85rem;
  font-weight: 500;
  opacity: 0.8;
}

.summary-card .summary-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.summary-card .summary-count {
  font-size: 0.75rem;
  opacity: 0.7;
}

.expense-card {
  background: linear-gradient(135deg, #fecaca 0%, #fee2e2 100%);
  color: #991b1b;
}

.income-card {
  background: linear-gradient(135deg, #a7f3d0 0%, #d1fae5 100%);
  color: #065f46;
}

.collection-card {
  background: linear-gradient(135deg, #bfdbfe 0%, #dbeafe 100%);
  color: #1e40af;
}

.profit-card {
  background: linear-gradient(135deg, #86efac 0%, #bbf7d0 100%);
  color: #14532d;
}

.loss-card {
  background: linear-gradient(135deg, #fca5a5 0%, #fecaca 100%);
  color: #7f1d1d;
}

.distribution-summary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.distribution-summary h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.dist-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dist-item.highlight {
  background: #fef3c7;
  border-color: #f59e0b;
}

.dist-label {
  font-size: 0.85rem;
  color: #6b7280;
}

.dist-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.report-transactions, .report-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.report-transactions h4, .report-section h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.badge-expense {
  background: #fee2e2;
  color: #991b1b;
}

.badge-income {
  background: #d1fae5;
  color: #065f46;
}

.badge-collection {
  background: #dbeafe;
  color: #1e40af;
}

.badge-full {
  background: #d1fae5;
  color: #065f46;
}

.badge-partial {
  background: #fef3c7;
  color: #92400e;
}

.badge-completed {
  background: #d1fae5;
  color: #065f46;
}

.badge-in-use {
  background: #dbeafe;
  color: #1e40af;
}

.badge-pending {
  background: #fef3c7;
  color: #92400e;
}

.badge-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.badge-paid {
  background: #d1fae5;
  color: #065f46;
}

.badge-unpaid {
  background: #fee2e2;
  color: #991b1b;
}

.text-red {
  color: #dc2626;
}

.text-green {
  color: #16a34a;
}

.text-right {
  text-align: right;
}

.empty-cell {
  text-align: center;
  padding: 24px;
  color: #6b7280;
  font-style: italic;
}

.total-row {
  background: #f3f4f6;
  font-weight: 600;
}

.total-row td {
  padding: 12px 8px;
}

/* Enhanced Report Panel Styles */
.report-generator-panel {
  background: linear-gradient(140deg,
    rgba(14, 36, 27, 0.92) 0%,
    rgba(17, 48, 33, 0.9) 52%,
    rgba(12, 32, 25, 0.94) 100%);
  border: 1px solid rgba(121, 169, 138, 0.36);
  border-radius: 18px;
  padding: 22px;
  margin-bottom: 24px;
  box-shadow:
    0 18px 34px rgba(5, 14, 10, 0.36),
    inset 0 1px 0 rgba(184, 230, 201, 0.1);
}

.report-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.report-option-card {
  background: linear-gradient(155deg,
    rgba(24, 49, 38, 0.88) 0%,
    rgba(21, 44, 35, 0.9) 58%,
    rgba(17, 34, 28, 0.94) 100%);
  border-radius: 14px;
  padding: 18px;
  box-shadow:
    0 10px 22px rgba(5, 12, 9, 0.34),
    inset 0 1px 0 rgba(184, 230, 201, 0.08);
  border: 1px solid rgba(126, 170, 141, 0.3);
}

.report-option-card h4 {
  margin: 0 0 16px 0;
  font-size: 1.08rem;
  color: #ecfdf5;
  font-weight: 700;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.report-type-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.report-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 18px;
  border: 1px solid rgba(150, 203, 171, 0.38);
  border-radius: 10px;
  background: linear-gradient(138deg,
    rgba(174, 112, 35, 0.76) 0%,
    rgba(124, 166, 74, 0.72) 100%);
  color: #f7fff9;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 80px;
}

.report-type-btn:hover {
  border-color: rgba(182, 238, 201, 0.58);
  transform: translateY(-1px);
  filter: brightness(1.06) saturate(1.04);
}

.report-type-btn.active {
  border-color: rgba(196, 246, 213, 0.76);
  background: linear-gradient(138deg,
    rgba(221, 126, 33, 0.92) 0%,
    rgba(102, 182, 102, 0.9) 100%);
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(62, 116, 72, 0.28);
}

.report-type-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.report-type-btn .btn-icon {
  font-size: 1.45rem;
  margin-bottom: 4px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.report-type-btn .btn-text {
  font-size: 0.85rem;
  font-weight: 700;
}

.custom-date-toggle {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 196, 165, 0.26);
}

.checkbox-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #ecfdf5;
  font-weight: 600;
}

.checkbox-inline input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #16a34a;
}

.custom-date-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
  background: rgba(12, 32, 23, 0.58);
  border-radius: 8px;
  border: 1px solid rgba(132, 182, 150, 0.24);
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-input-group label {
  font-size: 12px;
  color: #cde7d7;
  font-weight: 600;
}

.form-input-sm {
  padding: 8px 12px;
  border: 1px solid rgba(137, 188, 156, 0.38);
  border-radius: 6px;
  font-size: 13px;
  min-width: 140px;
  background: rgba(11, 30, 22, 0.64);
  color: #f0fff5;
}

.form-input-sm:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1);
}

.btn-generate {
  padding: 8px 16px;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  align-self: flex-end;
  transition: background 0.2s;
}

.btn-generate:hover {
  background: #15803d;
}

.btn-generate:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.filter-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: linear-gradient(140deg,
    rgba(18, 42, 31, 0.9) 0%,
    rgba(23, 51, 38, 0.92) 100%);
  border-radius: 10px;
  border: 1px solid rgba(136, 186, 153, 0.32);
  cursor: pointer;
  font-size: 0.88rem;
  transition: all 0.2s;
  box-shadow: inset 0 1px 0 rgba(184, 230, 201, 0.08);
}

.filter-checkbox:hover {
  border-color: rgba(178, 233, 196, 0.54);
  background: linear-gradient(140deg,
    rgba(22, 50, 36, 0.95) 0%,
    rgba(26, 59, 43, 0.97) 100%);
  transform: translateY(-1px);
}

.filter-checkbox span {
  color: #f1fff7;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
}

.filter-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #16a34a;
}

.actions-card .action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.orientation-setting {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid rgba(136, 186, 153, 0.3);
  border-radius: 10px;
  background: rgba(14, 36, 26, 0.5);
}

.orientation-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #d8f3e3;
  margin-bottom: 6px;
}

.orientation-toggle {
  display: flex;
  gap: 6px;
}

.orient-btn {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid rgba(143, 194, 162, 0.4);
  border-radius: 8px;
  background: linear-gradient(135deg,
    rgba(173, 108, 40, 0.78),
    rgba(93, 168, 96, 0.78));
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 700;
  transition: all 0.2s;
  text-align: center;
  color: #f6fff9;
}

.orient-btn:hover {
  border-color: rgba(191, 242, 207, 0.72);
  transform: translateY(-1px);
}

.orient-btn.active {
  border-color: rgba(201, 248, 215, 0.82);
  background: linear-gradient(135deg,
    rgba(220, 123, 31, 0.95),
    rgba(89, 180, 97, 0.94));
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(55, 110, 68, 0.3);
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid rgba(152, 203, 171, 0.45);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.2s;
  color: #f6fff9;
  box-shadow: 0 6px 16px rgba(7, 15, 11, 0.3);
}

.btn-action.print {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
}

.btn-action.print:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
}

.btn-action.print:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-action.select-all {
  background: linear-gradient(135deg, rgba(212, 123, 39, 0.88), rgba(104, 173, 99, 0.88));
  color: #f6fff9;
}

.btn-action.select-all:hover {
  filter: brightness(1.06);
}

.btn-action.clear {
  background: linear-gradient(135deg, rgba(183, 105, 35, 0.86), rgba(100, 160, 89, 0.84));
  color: #fff6f6;
}

.btn-action.clear:hover {
  filter: brightness(1.06);
}

.btn-action .btn-icon {
  font-size: 1.15rem;
  line-height: 1;
}

/* Loading state */
.report-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Enhanced Report Display */
.report-display {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: linear-gradient(135deg, #166534 0%, #15803d 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.report-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 48px;
}

.logo-text h3 {
  margin: 0;
  font-size: 22px;
}

.logo-text p {
  margin: 4px 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.report-meta {
  text-align: right;
}

.report-meta h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.report-period, .report-generated {
  margin: 4px 0;
  font-size: 13px;
  opacity: 0.9;
}

/* Enhanced Summary Cards */
.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-icon-wrapper {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 28px;
}

.card-icon-wrapper.expense { background: #fee2e2; }
.card-icon-wrapper.income { background: #dcfce7; }
.card-icon-wrapper.collection { background: #dbeafe; }
.card-icon-wrapper.profit { background: #bbf7d0; }
.card-icon-wrapper.loss { background: #fecaca; }

.card-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-details .summary-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.card-details .summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.card-details .summary-count {
  font-size: 12px;
  color: #9ca3af;
}

/* Enhanced Distribution */
.distribution-summary {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #bbf7d0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.distribution-summary h4 {
  margin: 0 0 20px;
  color: #166534;
  font-size: 16px;
  font-weight: 600;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.dist-item.highlight {
  background: #fef3c7;
  border-color: #fbbf24;
}

.dist-icon {
  font-size: 28px;
}

.dist-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dist-details .dist-label {
  font-size: 12px;
  color: #6b7280;
}

.dist-details .dist-value {
  font-size: 18px;
  font-weight: 600;
  color: #166534;
}

/* Report Section Cards */
.report-section-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.section-icon {
  font-size: 20px;
}

.section-title h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.section-count {
  margin-left: auto;
  font-size: 12px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 4px 10px;
  border-radius: 12px;
}

.report-section-card .table-container {
  padding: 0;
}

.report-section-card .data-table {
  margin: 0;
}

.description-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Report Footer */
.report-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  color: #6b7280;
  font-size: 12px;
}

.footer-date {
  margin-top: 4px;
  color: #9ca3af;
}

/* Responsive for Report */
@media (max-width: 1200px) {
  .report-summary-grid,
  .distribution-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .report-meta {
    text-align: center;
  }
  
  .report-logo {
    flex-direction: column;
    text-align: center;
  }
  
  .report-summary-grid,
  .distribution-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-checkboxes {
    grid-template-columns: 1fr;
  }
}

/* View Only Badge */
.view-only-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.88rem;
  font-weight: 700;
  margin-left: 12px;
  border: 1px solid rgba(187, 247, 208, 0.4);
  box-shadow: 0 6px 12px rgba(20, 83, 45, 0.25);
}

.view-only-badge .badge-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 12px;
  line-height: 1;
}

/* Barangay Context Styles */
.barangay-context {
  background: rgba(22, 163, 74, 0.14);
  border: 1px solid rgba(74, 222, 128, 0.24);
  border-radius: 12px;
  padding: 12px 20px;
  margin-bottom: 20px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.barangay-context.admin-context {
  background: rgba(74, 222, 128, 0.1);
  border-color: rgba(74, 222, 128, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.context-badge {
  font-size: 0.95rem;
  font-weight: 700;
  color: #d1fae5;
}

.admin-context .context-badge {
  color: var(--green);
}

/* Main KPI row: stacked label (subtitle) + amount, no icons */
.summary-cards > .summary-card {
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 6px;
}

.summary-cards > .summary-card .card-content {
  align-items: center;
}

.summary-cards > .summary-card .card-label {
  color: #111827;
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
  margin-bottom: 4px;
}

.summary-cards > .summary-card .card-amount {
  color: #111827;
  font-size: clamp(1.85rem, 4.2vw, 2.25rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

/* Same adjustment for generated report summary cards */
.report-summary-grid .income-card,
.report-summary-grid .profit-card,
.report-summary-grid .loss-card {
  justify-content: center;
  text-align: center;
}

.report-summary-grid .income-card .card-details,
.report-summary-grid .profit-card .card-details,
.report-summary-grid .loss-card .card-details {
  align-items: center;
}

.report-summary-grid .income-card .summary-value,
.report-summary-grid .expense-card .summary-value,
.report-summary-grid .collection-card .summary-value,
.report-summary-grid .profit-card .summary-value,
.report-summary-grid .loss-card .summary-value {
  color: #1a5c2a;
}

/* Expense Breakdown readability: make rows bolder and clearer */
.profit-breakdown .breakdown-card:nth-child(2) .expense-item {
  padding: 8px 0;
}

.profit-breakdown .breakdown-card:nth-child(2) .expense-item span:first-child {
  font-weight: 800;
  color: #effbe8;
  letter-spacing: 0.2px;
}

.profit-breakdown .breakdown-card:nth-child(2) .expense-item span:last-child {
  font-weight: 900;
  font-size: 15px;
  color: #f8fff5;
}

.profit-breakdown .breakdown-card:nth-child(2) .expense-item.total span:first-child,
.profit-breakdown .breakdown-card:nth-child(2) .expense-item.total span:last-child {
  font-weight: 900;
}

.admin-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.admin-filter label {
  font-weight: 700;
  color: var(--text-main);
}

.barangay-select {
  padding: 10px 14px;
  border: 1px solid rgba(190, 235, 203, 0.35);
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f3ffef;
  background: rgba(25, 37, 29, 0.96);
  min-width: 270px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 6px 14px rgba(0, 0, 0, 0.22);
}

.barangay-select:focus {
  outline: none;
  border-color: var(--green);
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.18), 0 8px 18px rgba(0, 0, 0, 0.28);
}

.barangay-select option {
  background: #f3fff1;
  color: #142016;
}

/* Profit distribution cards: centered 3-column layout with wider spacing */
.profit-distribution-section .distribution-grid {
  grid-template-columns: repeat(3, minmax(250px, 320px));
  column-gap: 56px;
  row-gap: 28px;
  justify-content: center;
  align-items: stretch;
  width: 100%;
  margin-top: 28px;
}

@media (max-width: 1200px) {
  .profit-distribution-section .distribution-grid {
    grid-template-columns: repeat(2, minmax(240px, 320px));
    column-gap: 32px;
  }
}

@media (max-width: 768px) {
  .profit-distribution-section .distribution-grid {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin-left: auto;
    margin-right: auto;
    row-gap: 18px;
  }

  .page-header {
    padding: 26px 20px;
    border-radius: 20px;
  }

  .header-content {
    gap: 10px;
  }

  .page-header h1 {
    font-size: 30px;
    line-height: 1.12;
  }

  .page-subtitle {
    font-size: 14px;
    line-height: 1.45;
  }
}

/* Print Styles */
@media print {
  .report-generator-panel,
  .tabs-container,
  .main-header,
  .sidebar { display: none !important; }
  
  .report-display {
    box-shadow: none;
    border: none;
    padding: 0;
  }
  
  .barangay-context {
    display: none;
  }
}
</style>
