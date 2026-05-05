<template>
  <!-- Farmer Credit Assessment Card Component -->
  <div class="farmer-assessment-card">
    <!-- Assessment Summary -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>
      <p class="mt-2">Analyzing loan history...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <div v-else-if="assessment">
      <!-- Header Section -->
      <div class="assessment-header mb-4">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h4 class="mb-1">
              <i class="fas fa-user-circle"></i>
              {{ assessment.farmerName }}
            </h4>
            <p class="text-muted mb-0">
              Ref: {{ assessment.referenceNumber }} | 
              Status: <span class="badge badge-secondary">{{ assessment.membershipStatus }}</span>
            </p>
          </div>
          <div class="col-md-4 text-right">
            <button
              @click="refreshAssessment"
              class="btn btn-sm btn-outline-secondary"
              :disabled="refreshing"
            >
              <i class="fas fa-sync" :class="{ 'fa-spin': refreshing }"></i>
              {{ refreshing ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Credit Score & Classification Banner -->
      <div class="assessment-banner mb-4" :class="`banner-${assessment.assessment.color}`">
        <div class="row align-items-center">
          <div class="col-md-6">
            <div class="credit-score-display">
              <div class="score-circle" :class="`color-${assessment.assessment.color}`">
                {{ assessment.assessment.creditScore }}
              </div>
              <div class="score-info">
                <h5 class="mb-1">{{ assessment.assessment.displayName }}</h5>
                <p class="mb-0 small">{{ assessment.assessment.description }}</p>
                <span class="badge" :class="`badge-${getRiskBadgeClass(assessment.assessment.riskLevel)}`">
                  {{ assessment.assessment.riskLevel }} RISK
                </span>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="classification-icon text-center">
              <i 
                class="fas"
                :class="{
                  'fa-check-circle text-success fa-3x': assessment.assessment.classification === 'GOOD_PAYER',
                  'fa-exclamation-circle text-warning fa-3x': assessment.assessment.classification === 'AVERAGE_PAYER',
                  'fa-times-circle text-danger fa-3x': assessment.assessment.classification === 'HIGH_RISK_PAYER'
                }"
              ></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Score Components Breakdown -->
      <div class="score-components mb-4">
        <h6 class="mb-3">
          <i class="fas fa-chart-pie"></i>
          Score Breakdown (Weighted)
        </h6>
        <div class="row">
          <div class="col-md-6 col-lg-3 mb-3">
            <div class="score-component">
              <div class="component-label">Payment History</div>
              <div class="component-score">{{ assessment.scoreComponents.paymentHistoryScore }}</div>
              <small class="text-muted">{{ (assessment.scoreComponents.weights.paymentHistory * 100) }}% weight</small>
              <div class="progress mt-2">
                <div
                  class="progress-bar bg-info"
                  :style="{ width: assessment.scoreComponents.paymentHistoryScore + '%' }"
                ></div>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3 mb-3">
            <div class="score-component">
              <div class="component-label">Default History</div>
              <div class="component-score">{{ assessment.scoreComponents.defaultHistoryScore }}</div>
              <small class="text-muted">{{ (assessment.scoreComponents.weights.defaultHistory * 100) }}% weight</small>
              <div class="progress mt-2">
                <div
                  class="progress-bar bg-success"
                  :style="{ width: assessment.scoreComponents.defaultHistoryScore + '%' }"
                ></div>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3 mb-3">
            <div class="score-component">
              <div class="component-label">Loan Volume</div>
              <div class="component-score">{{ assessment.scoreComponents.loanVolumeScore }}</div>
              <small class="text-muted">{{ (assessment.scoreComponents.weights.loanVolume * 100) }}% weight</small>
              <div class="progress mt-2">
                <div
                  class="progress-bar bg-warning"
                  :style="{ width: assessment.scoreComponents.loanVolumeScore + '%' }"
                ></div>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3 mb-3">
            <div class="score-component">
              <div class="component-label">Activity Recency</div>
              <div class="component-score">{{ assessment.scoreComponents.activityRecencyScore }}</div>
              <small class="text-muted">{{ (assessment.scoreComponents.weights.activityRecency * 100) }}% weight</small>
              <div class="progress mt-2">
                <div
                  class="progress-bar bg-danger"
                  :style="{ width: assessment.scoreComponents.activityRecencyScore + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loan Statistics -->
      <div class="loan-statistics">
        <h6 class="mb-3">
          <i class="fas fa-history"></i>
          Loan History & Statistics
        </h6>
        <div class="row">
          <div class="col-md-6 col-lg-3 mb-3">
            <div class="stat-item">
              <div class="stat-value">{{ assessment.statistics.totalLoans }}</div>
              <div class="stat-label">Total Loans</div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3 mb-3">
            <div class="stat-item">
              <div class="stat-value text-success">{{ assessment.statistics.completedLoans }}</div>
              <div class="stat-label">Completed</div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3 mb-3">
            <div class="stat-item">
              <div class="stat-value text-warning">{{ assessment.statistics.activeLoans }}</div>
              <div class="stat-label">Active</div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3 mb-3">
            <div class="stat-item">
              <div class="stat-value text-danger">{{ assessment.statistics.defaultedLoans }}</div>
              <div class="stat-label">Defaulted</div>
            </div>
          </div>
        </div>

        <hr class="my-3" />

        <div class="row">
          <div class="col-md-4 mb-3">
            <div class="stat-detail">
              <small class="text-muted">On-Time Payment Rate</small>
              <div class="stat-percentage">{{ assessment.statistics.paymentRateOnTime }}%</div>
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <div class="stat-detail">
              <small class="text-muted">Default Rate</small>
              <div class="stat-percentage">{{ assessment.statistics.defaultRate }}%</div>
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <div class="stat-detail">
              <small class="text-muted">Avg Days to Complete</small>
              <div class="stat-percentage">{{ assessment.statistics.averageDaysToCompletion }}</div>
            </div>
          </div>
        </div>

        <hr class="my-3" />

        <div class="row">
          <div class="col-md-6 mb-3">
            <div class="stat-detail">
              <small class="text-muted">Total Borrowed</small>
              <div class="stat-currency">₱{{ formatCurrency(assessment.statistics.totalBorrowed) }}</div>
            </div>
          </div>
          <div class="col-md-6 mb-3">
            <div class="stat-detail">
              <small class="text-muted">Total Repaid</small>
              <div class="stat-currency">₱{{ formatCurrency(assessment.statistics.totalRepaid) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Generated At -->
      <div class="text-muted text-center small mt-4">
        Assessment generated: {{ formatDate(assessment.generatedAt) }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FarmerCreditAssessment',
  props: {
    farmerId: {
      type: Number,
      required: true
    },
    autoRefresh: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      assessment: null,
      loading: true,
      refreshing: false,
      error: null
    };
  },
  computed: {},
  methods: {
    async loadAssessment() {
      try {
        this.loading = true;
        this.error = null;

        const response = await fetch(
          `/api/ml-assessments/farmer/${this.farmerId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load assessment');
        }

        const result = await response.json();
        this.assessment = result.data;
      } catch (err) {
        this.error = err.message;
        console.error('Error loading assessment:', err);
      } finally {
        this.loading = false;
      }
    },
    async refreshAssessment() {
      try {
        this.refreshing = true;
        const token = localStorage.getItem('token');

        const response = await fetch(
          `/api/ml-assessments/recalculate/${this.farmerId}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to recalculate assessment');
        }

        const result = await response.json();
        this.assessment = result.data;
        this.$toastr.success('Assessment refreshed successfully');
      } catch (err) {
        this.$toastr.error(err.message);
      } finally {
        this.refreshing = false;
      }
    },
    getRiskBadgeClass(riskLevel) {
      switch (riskLevel) {
        case 'LOW':
          return 'badge-success';
        case 'MEDIUM':
          return 'badge-warning';
        case 'HIGH':
          return 'badge-danger';
        default:
          return 'badge-secondary';
      }
    },
    formatCurrency(value) {
      return parseFloat(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },
    formatDate(date) {
      return new Date(date).toLocaleString();
    }
  },
  mounted() {
    this.loadAssessment();
  },
  watch: {
    farmerId(newId) {
      if (newId) {
        this.loadAssessment();
      }
    }
  }
};
</script>

<style scoped>
.farmer-assessment-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.assessment-header h4 {
  color: #333;
  font-weight: 600;
}

.assessment-banner {
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.assessment-banner.banner-success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-left: 4px solid #28a745;
}

.assessment-banner.banner-warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
  border-left: 4px solid #ffc107;
}

.assessment-banner.banner-danger {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border-left: 4px solid #dc3545;
}

.credit-score-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
}

.score-circle.color-success {
  background: #28a745;
}

.score-circle.color-warning {
  background: #ffc107;
  color: #333;
}

.score-circle.color-danger {
  background: #dc3545;
}

.score-info h5 {
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.score-components {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.score-component {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.component-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.component-score {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.loan-statistics {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}

.stat-detail {
  padding: 0.5rem 0;
}

.stat-percentage,
.stat-currency {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-top: 0.25rem;
}

.classification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fa-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
