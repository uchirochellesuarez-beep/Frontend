<template>
  <!-- High-Risk Farmers Monitoring Component -->
  <div class="high-risk-monitoring">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>
      <p class="mt-2">Loading high-risk farmers...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <div v-else>
      <!-- Header -->
      <div class="monitoring-header mb-4">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h4 class="mb-0">
              <i class="fas fa-exclamation-triangle text-danger"></i>
              High-Risk Farmers Requiring Monitoring
            </h4>
            <small class="text-muted">
              {{ summary.highRiskCount }} of {{ summary.total }} farmers ({{ riskPercentage }}%)
            </small>
          </div>
          <div class="col-md-4 text-right">
            <button
              @click="refreshList"
              class="btn btn-sm btn-outline-danger"
              :disabled="refreshing"
            >
              <i class="fas fa-sync" :class="{ 'fa-spin': refreshing }"></i>
              {{ refreshing ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Alert Banner -->
      <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <h5 class="alert-heading mb-2">
          <i class="fas fa-warning"></i>
          Monitoring Required
        </h5>
        <p class="mb-0">
          The following farmers have shown payment difficulties or defaults and require close monitoring
          and proactive outreach. Additional loan conditions may be necessary.
        </p>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <!-- Filters and Search -->
      <div class="monitoring-controls mb-4">
        <div class="input-group">
          <div class="input-group-prepend">
            <span class="input-group-text">
              <i class="fas fa-search"></i>
            </span>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Search by farmer name or reference..."
          />
        </div>
      </div>

      <!-- No Farmers Alert -->
      <div v-if="filteredFarmers.length === 0" class="alert alert-info" role="alert">
        <i class="fas fa-info-circle"></i>
        No high-risk farmers found matching your criteria.
      </div>

      <!-- High-Risk Farmers List -->
      <div v-else class="farmers-list">
        <div v-for="farmer in filteredFarmers" :key="farmer.farmerId" class="farmer-card mb-3">
          <!-- Card Header -->
          <div class="card-header bg-danger text-white p-3">
            <div class="row align-items-center">
              <div class="col-md-6">
                <h6 class="mb-1">
                  <i class="fas fa-user"></i>
                  {{ farmer.farmerName }}
                </h6>
                <small>{{ farmer.referenceNumber }}</small>
              </div>
              <div class="col-md-6 text-right">
                <span class="badge badge-light">
                  Risk Level: {{ farmer.assessment.riskLevel }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card Body -->
          <div class="card-body p-3">
            <div class="row">
              <!-- Credit Score -->
              <div class="col-md-3 mb-3">
                <div class="metric">
                  <div class="metric-label">Credit Score</div>
                  <div class="metric-value">
                    <span class="badge badge-danger">{{ farmer.assessment.creditScore }}/100</span>
                  </div>
                  <small class="text-muted">{{ farmer.assessment.description }}</small>
                </div>
              </div>

              <!-- Payment Statistics -->
              <div class="col-md-3 mb-3">
                <div class="metric">
                  <div class="metric-label">Payment History</div>
                  <div class="stat-row">
                    <span class="badge badge-success">{{ farmer.statistics.completedLoans }} Completed</span>
                  </div>
                  <div class="stat-row">
                    <span class="badge badge-danger">{{ farmer.statistics.defaultedLoans }} Defaulted</span>
                  </div>
                  <div class="stat-row">
                    <span class="badge badge-warning">{{ farmer.statistics.latePayments }} Late</span>
                  </div>
                </div>
              </div>

              <!-- On-Time Rate -->
              <div class="col-md-2 mb-3">
                <div class="metric">
                  <div class="metric-label">On-Time Rate</div>
                  <div class="metric-value">{{ farmer.statistics.paymentRateOnTime }}%</div>
                  <small class="text-danger">Below Average</small>
                  <div class="progress mt-2" style="height: 8px;">
                    <div
                      class="progress-bar bg-danger"
                      :style="{ width: farmer.statistics.paymentRateOnTime + '%' }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Default Rate -->
              <div class="col-md-2 mb-3">
                <div class="metric">
                  <div class="metric-label">Default Rate</div>
                  <div class="metric-value text-danger">{{ farmer.statistics.defaultRate }}%</div>
                  <small class="text-danger">High Risk</small>
                  <div class="progress mt-2" style="height: 8px;">
                    <div
                      class="progress-bar bg-danger"
                      :style="{ width: farmer.statistics.defaultRate > 100 ? 100 : farmer.statistics.defaultRate + '%' }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="col-md-2 text-right mb-3">
                <button
                  @click="viewFullAssessment(farmer.farmerId)"
                  class="btn btn-sm btn-outline-info"
                  title="View full assessment details"
                >
                  <i class="fas fa-eye"></i>
                  View
                </button>
              </div>
            </div>

            <!-- Loan Status -->
            <hr class="my-2" />
            <div class="row">
              <div class="col-md-12">
                <div class="loan-status">
                  <h6 class="mb-2">
                    <i class="fas fa-history"></i>
                    Loan Summary
                  </h6>
                  <div class="row">
                    <div class="col-auto">
                      <small>
                        <strong>Total Loans:</strong> {{ farmer.statistics.totalLoans }}
                      </small>
                    </div>
                    <div class="col-auto">
                      <small>
                        <strong>Active Loans:</strong>
                        <span class="badge badge-warning">{{ farmer.statistics.activeLoans }}</span>
                      </small>
                    </div>
                    <div class="col-auto">
                      <small>
                        <strong>Total Borrowed:</strong>
                        ₱{{ formatCurrency(farmer.statistics.totalBorrowed) }}
                      </small>
                    </div>
                    <div class="col-auto">
                      <small>
                        <strong>Total Repaid:</strong>
                        ₱{{ formatCurrency(farmer.statistics.totalRepaid) }}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recommended Actions -->
            <hr class="my-2" />
            <div class="recommended-actions">
              <h6 class="mb-2">
                <i class="fas fa-lightbulb"></i>
                Recommended Actions
              </h6>
              <ul class="list-unstyled">
                <li v-if="farmer.statistics.defaultRate > 50" class="mb-1">
                  <i class="fas fa-check-circle text-warning"></i>
                  Consider additional monitoring and regular follow-ups
                </li>
                <li v-if="farmer.statistics.latePayments > 2" class="mb-1">
                  <i class="fas fa-check-circle text-warning"></i>
                  Schedule payment plan discussion
                </li>
                <li v-if="farmer.statistics.activeLoans > 0" class="mb-1">
                  <i class="fas fa-check-circle text-warning"></i>
                  Review terms of active loans
                </li>
                <li v-if="farmer.statistics.paymentRateOnTime < 50" class="mb-1">
                  <i class="fas fa-check-circle text-danger"></i>
                  Do not approve new loans until situation improves
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Stats -->
      <div class="monitoring-footer mt-4 p-3 bg-light border rounded">
        <div class="row text-center">
          <div class="col-md-4">
            <div>
              <strong class="text-danger">{{ summary.highRiskCount }}</strong>
              <small class="text-muted d-block">High-Risk Farmers</small>
            </div>
          </div>
          <div class="col-md-4">
            <div>
              <strong>{{ riskPercentage }}%</strong>
              <small class="text-muted d-block">Of Total Borrowers</small>
            </div>
          </div>
          <div class="col-md-4">
            <div>
              <strong>{{ summary.total }}</strong>
              <small class="text-muted d-block">Total Farmers</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full Assessment Modal -->
    <div v-if="selectedFarmer && showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Assessment: {{ selectedFarmer.farmerName }}</h5>
            <button type="button" class="close" @click="showModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <farmer-credit-assessment :farmerId="selectedFarmer.farmerId" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FarmerCreditAssessment from './FarmerCreditAssessment.vue';

export default {
  name: 'HighRiskMonitoring',
  components: {
    FarmerCreditAssessment
  },
  props: {
    barangayId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      summary: {
        highRiskCount: 0,
        total: 0,
        data: []
      },
      loading: true,
      refreshing: false,
      error: null,
      searchQuery: '',
      selectedFarmer: null,
      showModal: false
    };
  },
  computed: {
    riskPercentage() {
      if (this.summary.total === 0) return 0;
      return ((this.summary.highRiskCount / this.summary.total) * 100).toFixed(1);
    },
    filteredFarmers() {
      if (!this.summary.data) return [];
      return this.summary.data.filter(farmer => {
        const query = this.searchQuery.toLowerCase();
        return (
          farmer.farmerName.toLowerCase().includes(query) ||
          farmer.referenceNumber.toLowerCase().includes(query)
        );
      });
    }
  },
  methods: {
    async loadHighRiskFarmers() {
      try {
        this.loading = true;
        this.error = null;

        const response = await fetch(
          `/api/ml-assessments/barangay/${this.barangayId}/high-risk`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load high-risk farmers');
        }

        const result = await response.json();
        this.summary = {
          highRiskCount: result.summary.highRiskCount,
          total: result.summary.total,
          data: result.data
        };
      } catch (err) {
        this.error = err.message;
        console.error('Error loading high-risk farmers:', err);
      } finally {
        this.loading = false;
      }
    },
    async refreshList() {
      try {
        this.refreshing = true;
        await this.loadHighRiskFarmers();
        if (this.$toastr) {
          this.$toastr.success('List refreshed successfully');
        }
      } catch (err) {
        if (this.$toastr) {
          this.$toastr.error(err.message);
        }
      } finally {
        this.refreshing = false;
      }
    },
    viewFullAssessment(farmerId) {
      this.selectedFarmer = this.summary.data.find(f => f.farmerId === farmerId);
      this.showModal = true;
    },
    formatCurrency(value) {
      return parseFloat(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  },
  mounted() {
    this.loadHighRiskFarmers();
  },
  watch: {
    barangayId(newId) {
      if (newId) {
        this.loadHighRiskFarmers();
      }
    }
  }
};
</script>

<style scoped>
.high-risk-monitoring {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.monitoring-header {
  border-bottom: 2px solid #f8f9fa;
  padding-bottom: 1rem;
}

.monitoring-controls {
  display: flex;
  gap: 1rem;
}

.monitoring-controls .input-group {
  max-width: 400px;
}

.farmer-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.farmer-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
}

.card-body {
  background: #fff;
}

.metric {
  text-align: center;
}

.metric-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.metric-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
}

.stat-row {
  margin: 0.25rem 0;
}

.stat-row .badge {
  display: inline-block;
}

.loan-status {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
}

.loan-status h6 {
  margin-bottom: 1rem;
  color: #333;
}

.recommended-actions {
  background: #fff3cd;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #ffc107;
}

.recommended-actions h6 {
  color: #856404;
  margin-bottom: 0.5rem;
}

.recommended-actions li {
  color: #856404;
  font-size: 0.9rem;
}

.monitoring-footer {
  text-align: center;
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

.badge {
  padding: 0.4rem 0.6rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-dialog {
  max-height: 90vh;
  overflow-y: auto;
}
</style>
