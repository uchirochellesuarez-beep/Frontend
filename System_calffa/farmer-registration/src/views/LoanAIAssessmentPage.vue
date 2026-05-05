<template>
  <!-- Loan AI Assessment & Decision Support Page -->
  <div class="loan-ai-assessment-page">
    <!-- Page Header -->
    <div class="page-header mb-4">
      <h2 class="mb-1">
        <i class="fas fa-brain text-primary"></i>
        Loan AI Decision Support
      </h2>
      <p class="text-muted mb-0">
        ML-based analysis for farmer loan eligibility, credit scoring, and risk monitoring
      </p>
    </div>

    <!-- Tabs for Different Views -->
    <div class="ai-tabs">
      <ul class="nav nav-tabs" role="tablist">
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'risk' }" href="#" @click.prevent="activeTab = 'risk'">
            <i class="fas fa-chart-line mr-2"></i> Barangay Risk Analysis
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'highrisk' }" href="#" @click.prevent="activeTab = 'highrisk'">
            <i class="fas fa-exclamation-triangle text-danger mr-2"></i> High-Risk Farmers
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'individual' }" href="#" @click.prevent="activeTab = 'individual'">
            <i class="fas fa-user-check text-info mr-2"></i> Individual Assessment
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" :class="{ active: activeTab === 'settings' }" href="#" @click.prevent="activeTab = 'settings'">
            <i class="fas fa-cog mr-2"></i> Settings & Info
          </a>
        </li>
      </ul>

      <!-- Tab 1: Risk Summary -->
      <div v-if="activeTab === 'risk'" class="tab-content-wrapper">
        <div class="barangay-selector mb-3">
          <label for="barangay-select">Select Barangay:</label>
          <select
            id="barangay-select"
            v-model="selectedBarangay"
            class="form-control"
            @change="onBarangayChange"
          >
            <option :value="null">Choose a barangay...</option>
            <option v-for="barangay in barangays" :key="barangay.id" :value="barangay.id">
              {{ barangay.name }}
            </option>
          </select>
        </div>
        <barangay-risk-summary v-if="selectedBarangay" :barangayId="selectedBarangay" />
        <div v-else class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          Please select a barangay to view the risk analysis.
        </div>
      </div>

      <!-- Tab 2: High-Risk Monitoring -->
      <div v-if="activeTab === 'highrisk'" class="tab-content-wrapper">
        <div class="barangay-selector mb-3">
          <label for="barangay-select-2">Select Barangay:</label>
          <select
            id="barangay-select-2"
            v-model="selectedBarangayForMonitoring"
            class="form-control"
            @change="onBarangayChangeMonitoring"
          >
            <option :value="null">Choose a barangay...</option>
            <option v-for="barangay in barangays" :key="barangay.id" :value="barangay.id">
              {{ barangay.name }}
            </option>
          </select>
        </div>
        <high-risk-monitoring v-if="selectedBarangayForMonitoring" :barangayId="selectedBarangayForMonitoring" />
        <div v-else class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          Please select a barangay to view high-risk farmers.
        </div>
      </div>

      <!-- Tab 3: Individual Assessment -->
      <div v-if="activeTab === 'individual'" class="tab-content-wrapper">
        <div class="farmer-selector mb-3">
          <label for="farmer-select">Select Farmer:</label>
          <form @submit.prevent="loadFarmerAssessment">
            <div class="input-group">
              <input
                v-model="farmerSearchQuery"
                type="text"
                class="form-control"
                placeholder="Enter farmer name or reference number..."
              />
              <div class="input-group-append">
                <button class="btn btn-outline-primary" type="submit">
                  <i class="fas fa-search"></i>
                  Search
                </button>
              </div>
            </div>
          </form>
          <div v-if="searchResults.length > 0" class="farmer-results mt-2">
            <div class="list-group">
              <button
                v-for="farmer in searchResults"
                :key="farmer.id"
                type="button"
                class="list-group-item list-group-item-action"
                @click="selectFarmerForAssessment(farmer.id)"
              >
                <strong>{{ farmer.full_name }}</strong>
                <small class="d-block text-muted">{{ farmer.reference_number }}</small>
              </button>
            </div>
          </div>
        </div>

        <farmer-credit-assessment
          v-if="selectedFarmerId"
          :key="selectedFarmerId"
          :farmerId="selectedFarmerId"
        />
        <div v-else class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          Search and select a farmer to view their credit assessment.
        </div>
      </div>

      <!-- Tab 4: System Settings & Info -->
      <div v-if="activeTab === 'settings'" class="tab-content-wrapper">
        <div class="tab-content-wrapper">
          <div class="settings-section">
            <h5 class="mb-3">
              <i class="fas fa-info-circle"></i>
              System Information
            </h5>

            <div class="info-card mb-4">
              <h6>ML Scoring Model</h6>
              <ul class="list-unstyled">
                <li><strong>Model Type:</strong> Decision Support Classifier</li>
                <li><strong>Classification Types:</strong> Good Payer, Average Payer, High-Risk Payer</li>
                <li><strong>Scoring Range:</strong> 0-100 points</li>
                <li><strong>Update Frequency:</strong> Real-time (on demand)</li>
              </ul>
            </div>

            <div class="info-card mb-4">
              <h6>Risk Classification Thresholds</h6>
              <ul class="list-unstyled">
                <li>
                  <span class="badge badge-success">GOOD PAYER</span>
                  Credit Score ≥ 70
                </li>
                <li>
                  <span class="badge badge-warning">AVERAGE PAYER</span>
                  Credit Score 40-69
                </li>
                <li>
                  <span class="badge badge-danger">HIGH-RISK PAYER</span>
                  Credit Score &lt; 40
                </li>
              </ul>
            </div>

            <div class="info-card mb-4">
              <h6>Score Calculation Weights</h6>
              <div class="row">
                <div class="col-md-6">
                  <ul class="list-unstyled">
                    <li><strong>Payment History:</strong> 40%</li>
                    <li><strong>Default History:</strong> 30%</li>
                  </ul>
                </div>
                <div class="col-md-6">
                  <ul class="list-unstyled">
                    <li><strong>Loan Volume:</strong> 15%</li>
                    <li><strong>Activity Recency:</strong> 15%</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="info-card">
              <h6 class="text-info">
                <i class="fas fa-lightbulb"></i>
                Key Features
              </h6>
              <ul class="list-unstyled">
                <li>✓ Automatic credit score calculation from historical data</li>
                <li>✓ Risk classification to support decision-making</li>
                <li>✓ Payment history tracking and on-time rate calculation</li>
                <li>✓ Default monitoring and identification</li>
                <li>✓ Barangay-level risk summary and trends</li>
                <li>✓ High-risk farmer alerts and monitoring lists</li>
                <li>✓ No automatic loan approval (decision support only)</li>
              </ul>
            </div>

            <hr class="my-4" />

            <div class="info-card">
              <h6 class="text-warning">
                <i class="fas fa-warning"></i>
                Important Notes
              </h6>
              <ul class="list-unstyled small">
                <li>⚠ ML classifications are <strong>informational only</strong> for decision support</li>
                <li>⚠ Final loan approval decisions remain with loan administrators</li>
                <li>⚠ High-risk classification does not automatically deny loans</li>
                <li>⚠ Loan eligibility still requires zero outstanding balance</li>
                <li>⚠ Assessments are generated from historical loan and payment data</li>
              </ul>
            </div>

            <hr class="my-4" />

            <div class="action-buttons">
              <button
                @click="downloadReport"
                class="btn btn-primary mr-2"
                :disabled="!selectedBarangay"
              >
                <i class="fas fa-download mr-2"></i>
                Download Barangay Report
              </button>
              <button
                @click="exportToCSV"
                class="btn btn-secondary"
                :disabled="!selectedBarangay"
              >
                <i class="fas fa-file-csv mr-2"></i>
                Export to CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BarangayRiskSummary from '../components/BarangayRiskSummary.vue';
import HighRiskMonitoring from '../components/HighRiskMonitoring.vue';
import FarmerCreditAssessment from '../components/FarmerCreditAssessment.vue';

export default {
  name: 'LoanAIAssessmentPage',
  components: {
    BarangayRiskSummary,
    HighRiskMonitoring,
    FarmerCreditAssessment
  },
  data() {
    return {
      activeTab: 'risk',
      selectedBarangay: null,
      selectedBarangayForMonitoring: null,
      selectedFarmerId: null,
      barangays: [],
      searchResults: [],
      farmerSearchQuery: '',
      loadingBarangays: true,
      token: localStorage.getItem('token')
    };
  },
  methods: {
    async loadBarangays() {
      try {
        this.loadingBarangays = true;
        const response = await fetch('/api/barangays', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load barangays');
        }

        const result = await response.json();
        this.barangays = result.barangays || result.data || result;
      } catch (err) {
        console.error('Error loading barangays:', err);
        if (this.$toastr) {
          this.$toastr.error('Failed to load barangays');
        }
      } finally {
        this.loadingBarangays = false;
      }
    },
    async loadFarmerAssessment() {
      if (!this.farmerSearchQuery.trim()) {
        this.searchResults = [];
        return;
      }

      try {
        const response = await fetch(
          `/api/farmers?search=${encodeURIComponent(this.farmerSearchQuery)}&limit=5`,
          {
            headers: {
              'Authorization': `Bearer ${this.token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to search farmers');
        }

        const result = await response.json();
        this.searchResults = result.data || result.farmers || [];
      } catch (err) {
        console.error('Error searching farmers:', err);
        this.searchResults = [];
      }
    },
    selectFarmerForAssessment(farmerId) {
      this.selectedFarmerId = farmerId;
      this.searchResults = [];
      this.farmerSearchQuery = '';
    },
    onBarangayChange() {
      // No action needed, BarangayRiskSummary will reactively load
    },
    onBarangayChangeMonitoring() {
      // No action needed, HighRiskMonitoring will reactively load
    },
    downloadReport() {
      if (this.$toastr) {
        this.$toastr.info('Report download feature coming soon');
      }
    },
    exportToCSV() {
      if (this.$toastr) {
        this.$toastr.info('CSV export feature coming soon');
      }
    }
  },
  mounted() {
    this.loadBarangays();
  }
};
</script>

<style scoped>
.loan-ai-assessment-page {
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  color: #333;
  font-weight: 600;
}

.page-header .text-muted {
  font-size: 0.95rem;
}

.tab-content-wrapper {
  padding: 2rem 1rem;
}

.barangay-selector,
.farmer-selector {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.barangay-selector label,
.farmer-selector label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.farmer-results {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.list-group-item {
  border: none;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
}

.list-group-item:hover {
  background-color: #f5f5f5;
}

.list-group-item:last-child {
  border-bottom: none;
}

.settings-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.info-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.info-card h6 {
  color: #333;
  font-weight: 600;
}

.info-card ul li {
  padding: 0.25rem 0;
  color: #666;
}

.badge {
  margin-right: 0.5rem;
}

.action-buttons {
  padding: 1rem 0;
}

.action-buttons button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .tab-content-wrapper {
    padding: 1rem;
  }
  
  .barangay-selector,
  .farmer-selector,
  .settings-section {
    padding: 1rem;
  }
}

/* Dashboard theme override */
.loan-ai-assessment-page {
  background: linear-gradient(145deg, #0f1712 0%, #132119 22%, #1a2b20 45%, #243b2c 72%, #2f4a38 100%) !important;
  color: #eefde6;
}

.page-header,
.barangay-selector,
.farmer-selector,
.settings-section,
.farmer-results,
.info-card,
.alert,
.card {
  background: rgba(28, 42, 33, 0.92) !important;
  border: 1px solid rgba(190, 235, 203, 0.14) !important;
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.30), inset 1px 1px 0 rgba(255,255,255,0.05) !important;
  color: #eefde6 !important;
}

.page-header h2,
.info-card h6,
.barangay-selector label,
.farmer-selector label { color: #eefde6 !important; }

.page-header .text-muted,
.info-card ul li,
.text-muted,
.list-group-item,
.alert { color: rgba(220, 238, 211, 0.78) !important; }

.nav-tabs {
  border-bottom-color: rgba(190, 235, 203, 0.2) !important;
}

.nav-tabs .nav-link {
  color: rgba(220, 238, 211, 0.78) !important;
  background: rgba(255,255,255,0.05) !important;
  border-color: rgba(190, 235, 203, 0.14) !important;
}

.nav-tabs .nav-link.active {
  color: #34d399 !important;
  background: rgba(28, 42, 33, 0.95) !important;
  border-bottom-color: rgba(28, 42, 33, 0.95) !important;
}

.form-control,
select,
input {
  background: rgba(0,0,0,0.24) !important;
  color: #eefde6 !important;
  border-color: rgba(190, 235, 203, 0.24) !important;
}

.list-group-item:hover {
  background-color: rgba(74, 222, 128, 0.07) !important;
}
</style>
