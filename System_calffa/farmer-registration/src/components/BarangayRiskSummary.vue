<template>
  <!-- Barangay Risk Summary Dashboard Component -->
  <div class="barangay-risk-summary">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>
      <p class="mt-2">Loading risk analysis...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <div v-else-if="summary">
      <!-- Header -->
      <div class="summary-header mb-4">
        <h4 class="mb-3">
          <i class="fas fa-chart-line"></i>
          Barangay Risk Analysis
        </h4>
        <button
          @click="refreshSummary"
          class="btn btn-sm btn-outline-primary"
          :disabled="refreshing"
        >
          <i class="fas fa-sync" :class="{ 'fa-spin': refreshing }"></i>
          {{ refreshing ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <!-- Overall Statistics -->
      <div class="overall-stats mb-4">
        <div class="row">
          <div class="col-md-3 mb-3">
            <div class="stat-card stat-total">
              <div class="stat-icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ summary.total }}</div>
                <div class="stat-label">Total Farmers</div>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="stat-card stat-good">
              <div class="stat-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ summary.goodPayers }}</div>
                <div class="stat-label">Good Payers</div>
                <small class="text-muted">{{ getPercentage(summary.goodPayers) }}%</small>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="stat-card stat-average">
              <div class="stat-icon">
                <i class="fas fa-exclamation-circle"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ summary.averagePayers }}</div>
                <div class="stat-label">Average Payers</div>
                <small class="text-muted">{{ getPercentage(summary.averagePayers) }}%</small>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-3">
            <div class="stat-card stat-risk">
              <div class="stat-icon">
                <i class="fas fa-times-circle"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ summary.highRiskPayers }}</div>
                <div class="stat-label">High-Risk Payers</div>
                <small class="text-muted">{{ getPercentage(summary.highRiskPayers) }}%</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Average Credit Score -->
      <div class="average-score mb-4">
        <h6 class="mb-3">
          <i class="fas fa-star"></i>
          Average Credit Score: {{ summary.averageCreditScore }}/100
        </h6>
        <div class="progress" style="height: 25px;">
          <div
            class="progress-bar"
            :class="{
              'bg-success': summary.averageCreditScore >= 70,
              'bg-warning': summary.averageCreditScore >= 40 && summary.averageCreditScore < 70,
              'bg-danger': summary.averageCreditScore < 40
            }"
            :style="{ width: summary.averageCreditScore + '%' }"
          >
            <span class="text-white font-weight-bold">{{ summary.averageCreditScore }}%</span>
          </div>
        </div>
      </div>

      <!-- Risk Distribution Chart -->
      <div class="risk-distribution mb-4">
        <h6 class="mb-3">
          <i class="fas fa-pie-chart"></i>
          Risk Distribution
        </h6>
        <div class="risk-chart">
          <canvas ref="riskChart"></canvas>
        </div>
      </div>

      <!-- Farmer List by Risk Category -->
      <div class="farmer-list">
        <ul class="nav nav-tabs" role="tablist">
          <li class="nav-item">
            <a
              class="nav-link active"
              href="#good-payers"
              data-toggle="tab"
              role="tab"
              aria-selected="true"
            >
              <i class="fas fa-check-circle text-success"></i>
              Good Payers ({{ summary.goodPayers }})
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              href="#average-payers"
              data-toggle="tab"
              role="tab"
              aria-selected="false"
            >
              <i class="fas fa-exclamation-circle text-warning"></i>
              Average Payers ({{ summary.averagePayers }})
            </a>
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              href="#high-risk-payers"
              data-toggle="tab"
              role="tab"
              aria-selected="false"
            >
              <i class="fas fa-times-circle text-danger"></i>
              High-Risk Payers ({{ summary.highRiskPayers }})
            </a>
          </li>
        </ul>

        <div class="tab-content">
          <!-- Good Payers Tab -->
          <div id="good-payers" class="tab-pane fade show active" role="tabpanel">
            <div class="farmer-table mt-3">
              <table v-if="getGoodPayers.length > 0" class="table table-hover">
                <thead>
                  <tr>
                    <th>Farmer Name</th>
                    <th>Reference</th>
                    <th>Credit Score</th>
                    <th>Loans Completed</th>
                    <th>Payment Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="farmer in getGoodPayers" :key="farmer.farmerId">
                    <td>
                      <strong>{{ farmer.farmerName }}</strong>
                    </td>
                    <td>{{ farmer.referenceNumber }}</td>
                    <td>
                      <span class="badge badge-success">{{ farmer.assessment.creditScore }}</span>
                    </td>
                    <td>{{ farmer.statistics.completedLoans }}</td>
                    <td>
                      <small class="text-success">{{ farmer.statistics.paymentRateOnTime }}%</small>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="text-center text-muted py-4">
                No good payers in this category
              </div>
            </div>
          </div>

          <!-- Average Payers Tab -->
          <div id="average-payers" class="tab-pane fade" role="tabpanel">
            <div class="farmer-table mt-3">
              <table v-if="getAveragePayers.length > 0" class="table table-hover">
                <thead>
                  <tr>
                    <th>Farmer Name</th>
                    <th>Reference</th>
                    <th>Credit Score</th>
                    <th>Late Payments</th>
                    <th>Payment Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="farmer in getAveragePayers" :key="farmer.farmerId">
                    <td>
                      <strong>{{ farmer.farmerName }}</strong>
                    </td>
                    <td>{{ farmer.referenceNumber }}</td>
                    <td>
                      <span class="badge badge-warning">{{ farmer.assessment.creditScore }}</span>
                    </td>
                    <td>{{ farmer.statistics.latePayments }}</td>
                    <td>
                      <small class="text-warning">{{ farmer.statistics.paymentRateOnTime }}%</small>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="text-center text-muted py-4">
                No average payers in this category
              </div>
            </div>
          </div>

          <!-- High-Risk Payers Tab -->
          <div id="high-risk-payers" class="tab-pane fade" role="tabpanel">
            <div class="farmer-table mt-3">
              <table v-if="getHighRiskPayers.length > 0" class="table table-hover">
                <thead>
                  <tr>
                    <th>Farmer Name</th>
                    <th>Reference</th>
                    <th>Credit Score</th>
                    <th>Defaulted Loans</th>
                    <th>Payment Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="farmer in getHighRiskPayers" :key="farmer.farmerId">
                    <td>
                      <strong>{{ farmer.farmerName }}</strong>
                    </td>
                    <td>{{ farmer.referenceNumber }}</td>
                    <td>
                      <span class="badge badge-danger">{{ farmer.assessment.creditScore }}</span>
                    </td>
                    <td>{{ farmer.statistics.defaultedLoans }}</td>
                    <td>
                      <small class="text-danger">{{ farmer.statistics.paymentRateOnTime }}%</small>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="text-center text-muted py-4">
                No high-risk payers in this category
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Generated At -->
      <div class="text-muted text-center small mt-4">
        Analysis generated: {{ formatDate() }}
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  name: 'BarangayRiskSummary',
  props: {
    barangayId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      summary: null,
      loading: true,
      refreshing: false,
      error: null,
      chart: null
    };
  },
  computed: {
    getGoodPayers() {
      return this.summary?.assessments.filter(
        a => a.assessment.classification === 'GOOD_PAYER'
      ) || [];
    },
    getAveragePayers() {
      return this.summary?.assessments.filter(
        a => a.assessment.classification === 'AVERAGE_PAYER'
      ) || [];
    },
    getHighRiskPayers() {
      return this.summary?.assessments.filter(
        a => a.assessment.classification === 'HIGH_RISK_PAYER'
      ) || [];
    }
  },
  methods: {
    async loadSummary() {
      try {
        this.loading = true;
        this.error = null;

        const response = await fetch(
          `/api/ml-assessments/barangay/${this.barangayId}/summary`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load summary');
        }

        const result = await response.json();
        this.summary = result.data;

        // Draw chart after data is loaded
        this.$nextTick(() => {
          this.drawRiskChart();
        });
      } catch (err) {
        this.error = err.message;
        console.error('Error loading summary:', err);
      } finally {
        this.loading = false;
      }
    },
    async refreshSummary() {
      try {
        this.refreshing = true;
        await this.loadSummary();
        if (this.$toastr) {
          this.$toastr.success('Summary refreshed successfully');
        }
      } catch (err) {
        if (this.$toastr) {
          this.$toastr.error(err.message);
        }
      } finally {
        this.refreshing = false;
      }
    },
    drawRiskChart() {
      if (!this.$refs.riskChart || !this.summary) return;

      // Destroy existing chart if it exists
      if (this.chart) {
        this.chart.destroy();
      }

      const ctx = this.$refs.riskChart.getContext('2d');

      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Good Payers', 'Average Payers', 'High-Risk Payers'],
          datasets: [
            {
              data: [
                this.summary.goodPayers,
                this.summary.averagePayers,
                this.summary.highRiskPayers
              ],
              backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
              borderColor: ['white', 'white', 'white'],
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const value = context.parsed;
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${context.label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    },
    getPercentage(count) {
      if (!this.summary || this.summary.total === 0) return 0;
      return ((count / this.summary.total) * 100).toFixed(1);
    },
    formatDate() {
      return new Date().toLocaleString();
    }
  },
  mounted() {
    this.loadSummary();
  },
  watch: {
    barangayId(newId) {
      if (newId) {
        this.loadSummary();
      }
    }
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
};
</script>

<style scoped>
.barangay-risk-summary {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overall-stats .stat-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2rem;
  min-width: 50px;
  text-align: center;
}

.stat-card.stat-total .stat-icon {
  color: #6c757d;
}

.stat-card.stat-good .stat-icon {
  color: #28a745;
}

.stat-card.stat-average .stat-icon {
  color: #ffc107;
}

.stat-card.stat-risk .stat-icon {
  color: #dc3545;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin: 0.25rem 0 0 0;
}

.average-score {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.risk-distribution {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.risk-chart {
  position: relative;
  height: 300px;
}

.nav-tabs .nav-link {
  color: #666;
  border: none;
  border-bottom: 2px solid transparent;
}

.nav-tabs .nav-link:hover {
  border-bottom-color: #dee2e6;
}

.nav-tabs .nav-link.active {
  border-bottom-color: #007bff;
  color: #007bff;
  background: none;
}

.farmer-table {
  overflow-x: auto;
}

.table {
  margin-bottom: 0;
}

.table thead th {
  font-weight: 600;
  color: #333;
  border-top: none;
}

.table tbody tr:hover {
  background-color: #f5f5f5;
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
