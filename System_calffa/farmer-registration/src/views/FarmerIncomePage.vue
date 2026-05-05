<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Talaan ng Kita sa Pagsasaka</h1>
      <p class="page-subtitle">Punan ang form na ito para maitala ang iyong gastos at kita sa pagsasaka. Kinakailangan para sa eligibility sa tulong na pang-agrikultura tulad ng pataba at binhi.</p>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="alert alert-success">
      <span>✅ {{ successMessage }}</span>
      <button class="alert-close" @click="successMessage = ''">&times;</button>
    </div>
    <div v-if="errorMessage" class="alert alert-error">
      <span>❌ {{ errorMessage }}</span>
      <button class="alert-close" @click="errorMessage = ''">&times;</button>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-nav">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'form' }"
        @click="activeTab = 'form'; if (editingRecordId) cancelEdit()"
      >
        {{ editingRecordId ? 'I-edit ang Talaan' : 'Bagong Talaan' }}
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'history' }"
        @click="activeTab = 'history'; fetchRecords()"
      >
        Mga Naunang Talaan
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'assistance' }"
        @click="activeTab = 'assistance'; fetchCompletedAssistance()"
      >
        Tulong na Natanggap
      </button>
    </div>

    <!-- FORM TAB -->
    <div v-if="activeTab === 'form'" class="form-wrapper">
      <!-- Edit mode banner -->
      <div v-if="editingRecordId" class="edit-banner">
        <span>✏️ Ine-edit mo ang talaan mula {{ formatDate(editingCreatedAt) }}</span>
        <button class="cancel-edit-btn" @click="cancelEdit">✕ Kanselahin</button>
      </div>
      <form @submit.prevent="submitForm" class="income-form">

        <!-- Section 1: Farm Details -->
        <div class="form-section">
          <h2 class="section-title">Detalye ng Taniman</h2>
          <div class="form-row">
            <div class="form-group">
              <label>Lawak ng Taniman (Ektarya)</label>
              <input
                type="number"
                v-model.number="form.area_hectares"
                placeholder="Halimbawa: 1.5"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div class="form-group">
              <label>Paraan ng Pagtatanim</label>
              <select v-model="form.planting_method" required>
                <option value="">-- Pumili --</option>
                <option value="sabog">Sabog</option>
                <option value="talok">Talok</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group full-width">
              <label>Patubig</label>
              <select v-model="form.irrigation_type" required>
                <option value="">-- Pumili --</option>
                <option value="NIA">NIA</option>
                <option value="bugsok_waterpump">Bugsok na Waterpump</option>
                <option value="waterpump_irrigation">Waterpump na Nakalawit sa Irrigation</option>
                <option value="waterpump_ilog">Waterpump na Nakalawit sa Ilog</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Section 2: Abono (Fertilizers) -->
        <div class="form-section">
          <h2 class="section-title">Mga Ginamit na Abono</h2>
          <div class="dynamic-table-wrapper">
            <table class="dynamic-table">
              <thead>
                <tr>
                  <th>Klase ng Abono</th>
                  <th>Ilan Sako</th>
                  <th>Presyo Kada Sako (₱)</th>
                  <th>Kabuuan (₱)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in form.fertilizers" :key="'fert-' + index">
                  <td>
                    <select v-model="item.type" required>
                      <option value="">-- Pumili --</option>
                      <option value="14-14-14">14-14-14</option>
                      <option value="46-0-0">46-0-0</option>
                      <option value="0-0-60">0-0-60</option>
                      <option value="17-0-17">17-0-17</option>
                      <option value="25-0-0">25-0-0</option>
                      <option value="16-20-0">16-20-0</option>
                      <option value="21-0-0">21-0-0</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.sacks"
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.price_per_sack"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td class="computed-cell">
                    ₱{{ fertilizerLineTotal(item).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                  </td>
                  <td>
                    <button
                      type="button"
                      class="remove-btn"
                      @click="removeFertilizer(index)"
                      v-if="form.fertilizers.length > 1"
                      title="Alisin"
                    >✕</button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="total-label">Kabuuang Halaga sa Abono:</td>
                  <td class="total-value">
                    ₱{{ totalFertilizerCost.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <button type="button" class="add-row-btn" @click="addFertilizer">
            ➕ Magdagdag ng Abono
          </button>
        </div>

        <!-- Section 3: Pesticides -->
        <div class="form-section">
          <h2 class="section-title">Mga Ginamit na Lason</h2>
          <div class="dynamic-table-wrapper">
            <table class="dynamic-table">
              <thead>
                <tr>
                  <th>Klase ng Lason</th>
                  <th>Ilang Bote/Pack</th>
                  <th>Presyo Kada Bote/Pack (₱)</th>
                  <th>Kabuuan (₱)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in form.pesticides" :key="'pest-' + index">
                  <td>
                    <input
                      type="text"
                      v-model="item.type"
                      placeholder="Pangalan ng lason"
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.quantity"
                      placeholder="0"
                      min="0"
                      step="1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      v-model.number="item.price_per_unit"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td class="computed-cell">
                    ₱{{ pesticideLineTotal(item).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                  </td>
                  <td>
                    <button
                      type="button"
                      class="remove-btn"
                      @click="removePesticide(index)"
                      v-if="form.pesticides.length > 1"
                      title="Alisin"
                    >✕</button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="total-label">Kabuuang Halaga sa Lason:</td>
                  <td class="total-value">
                    ₱{{ totalPesticideCost.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <button type="button" class="add-row-btn" @click="addPesticide">
            ➕ Magdagdag ng Lason
          </button>
        </div>

        <!-- Section 4: Labor & Other Expenses -->
        <div class="form-section">
          <h2 class="section-title">Gastos sa Labor at Iba Pa</h2>
          <div class="form-row">
            <div class="form-group">
              <label>Gastos sa Paghahanda ng Lupang Taniman (₱)</label>
              <input type="number" v-model.number="form.land_preparation_cost" placeholder="0.00" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>Gastos sa Bunot / Talok / Hasik (₱)</label>
              <input type="number" v-model.number="form.planting_cost" placeholder="0.00" min="0" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Gastos sa Pagspray / Pagsabog ng Abono at Iba Pa (₱)</label>
              <input type="number" v-model.number="form.spraying_cost" placeholder="0.00" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>Bayad sa Harvester (₱)</label>
              <input type="number" v-model.number="form.harvester_cost" placeholder="0.00" min="0" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Bayad sa Pagbibilad (₱)</label>
              <input type="number" v-model.number="form.drying_cost" placeholder="0.00" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>Bayad sa Paghakot (₱)</label>
              <input type="number" v-model.number="form.hauling_cost" placeholder="0.00" min="0" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Tarasko (₱)</label>
              <input type="number" v-model.number="form.tarasko_cost" placeholder="0.00" min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>Krudo (₱)</label>
              <input type="number" v-model.number="form.fuel_cost" placeholder="0.00" min="0" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group full-width">
              <label>Iba Pang Gastos (₱)</label>
              <input type="number" v-model.number="form.other_expenses" placeholder="0.00" min="0" step="0.01" />
            </div>
          </div>
          <div class="labor-total-box">
            <span class="labor-total-label">Kabuuang Gastos sa Labor:</span>
            <span class="labor-total-value">₱{{ totalLaborCost.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>

        <!-- Section 5: Harvest -->
        <div class="form-section">
          <h2 class="section-title">Ani</h2>
          <div class="form-row">
            <div class="form-group">
              <label>Ilang Sako ang Naani</label>
              <input type="number" v-model.number="form.sacks_harvested" placeholder="0" min="0" step="1" required />
            </div>
            <div class="form-group">
              <label>Kilo Kada Sako</label>
              <input type="number" v-model.number="form.kg_per_sack" placeholder="0" min="0" step="0.01" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Presyo Kada Kilo (₱)</label>
              <input type="number" v-model.number="form.price_per_kg" placeholder="0.00" min="0" step="0.01" required />
            </div>
          </div>
        </div>

        <!-- Summary Section -->
        <div class="form-section summary-section">
          <h2 class="section-title">Buod</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Kabuuang Ani (kg)</span>
              <span class="summary-value">{{ totalHarvestKg.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} kg</span>
            </div>
            <div class="summary-item income">
              <span class="summary-label">Kabuuang Benta</span>
              <span class="summary-value">₱{{ grossIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="summary-item expense">
              <span class="summary-label">Kabuuang Gastos</span>
              <span class="summary-value">₱{{ totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="summary-item" :class="netIncome >= 0 ? 'profit' : 'loss'">
              <span class="summary-label">Netong Kita</span>
              <span class="summary-value">₱{{ netIncome.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="form-actions">
          <button type="button" class="btn-reset" @click="editingRecordId ? cancelEdit() : resetForm()">{{ editingRecordId ? '✕ Kanselahin' : '🔄 I-reset' }}</button>
          <button type="submit" class="btn-submit" :disabled="submitting">
            <span v-if="submitting">⏳ {{ editingRecordId ? 'Ina-update...' : 'Sinusumite...' }}</span>
            <span v-else>{{ editingRecordId ? '✏️ I-update ang Talaan' : '💾 I-save ang Talaan' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- HISTORY TAB -->
    <div v-if="activeTab === 'history'" class="history-wrapper">
      <div v-if="loadingRecords" class="loading-state">
        <div class="spinner"></div>
        <p>Kinukuha ang mga talaan...</p>
      </div>
      <div v-else-if="records.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Wala pang naitatalang kita. Punan ang form para magsimula!</p>
      </div>
      <div v-else class="records-list">
        <div
          v-for="record in records"
          :key="record.id"
          class="record-card"
        >
          <div class="record-header">
            <span class="record-date">📅 {{ formatDate(record.created_at) }}</span>
            <div class="record-actions">
              <button class="edit-btn" @click="startEdit(record)">✏️ I-edit</button>
              <button class="view-btn" @click="openRecordDetail(record)">👁️ Tingnan</button>
            </div>
          </div>
          <div class="record-details">
            <div class="record-detail">
              <span class="detail-label">Lawak:</span>
              <span>{{ record.area_hectares }} ektarya</span>
            </div>
            <div class="record-detail">
              <span class="detail-label">Pagtatanim:</span>
              <span>{{ record.planting_method }}</span>
            </div>
            <div class="record-detail">
              <span class="detail-label">Patubig:</span>
              <span>{{ formatIrrigation(record.irrigation_type) }}</span>
            </div>
            <div class="record-detail">
              <span class="detail-label">Ani:</span>
              <span>{{ record.sacks_harvested }} sako × {{ record.kg_per_sack }} kg @ ₱{{ record.price_per_kg }}/kg</span>
            </div>
          </div>
          <div class="record-financials">
            <div class="financial-item income">
              <span>Benta:</span>
              <span>₱{{ parseFloat(record.gross_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="financial-item expense">
              <span>Gastos:</span>
              <span>₱{{ parseFloat(record.total_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="financial-item" :class="parseFloat(record.net_income || 0) >= 0 ? 'profit' : 'loss'">
              <span>Net:</span>
              <span>₱{{ parseFloat(record.net_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ASSISTANCE TAB -->
    <div v-if="activeTab === 'assistance'" class="assistance-wrapper">
      <div v-if="loadingAssistance" class="loading-state">
        <div class="spinner"></div>
        <p>Kinukuha ang tulong na natanggap...</p>
      </div>
      <div v-else-if="completedAssistance.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <p>Walang natanggapang tulong pa. Maghintay na kayo ay maging eligible at lumikha ng tulong.</p>
      </div>
      <div v-else>
        <!-- Assistance Grid -->
        <div class="assistance-grid">
          <div v-for="assist in completedAssistance" :key="assist.id" class="assistance-card">
            <div class="card-header">
              <div class="header-title">
                <span class="assistance-type-badge" :class="getAssistanceTypeClass(assist.assistance_type)">
                  {{ formatAssistanceType(assist.assistance_type) }}
                </span>
              </div>
              <span class="status-badge completed">✅ Natanggap</span>
            </div>

            <div class="card-body">
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">📅 Petsa ng Talaan</span>
                  <span class="info-value">{{ formatDate(assist.created_at) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">📦 Dami</span>
                  <span class="info-value quantity-highlight">{{ assist.notes ? extractQuantityFromNotes(assist.notes) : assist.quantity + ' ' + (assist.unit || 'sako') }}</span>
                </div>
              </div>

              <div class="info-row dates-row">
                <div v-if="assist.distribution_date" class="info-item">
                  <span class="info-label">🚚 Araw ng Pamamahagi</span>
                  <span class="info-value">{{ formatDate(assist.distribution_date) }}</span>
                </div>
                <div v-if="assist.received_date" class="info-item">
                  <span class="info-label">✋ Araw ng Pagtanggap</span>
                  <span class="info-value">{{ formatDate(assist.received_date) }}</span>
                </div>
              </div>

              <div v-if="assist.notes && !assist.notes.startsWith('Pataba')" class="notes-section">
                <span class="notes-label">📝 Tala</span>
                <p class="notes-content">{{ extractNotesOnly(assist.notes) }}</p>
              </div>
            </div>

            <div class="card-footer">
              <span class="badge-info">{{ getTimeSinceReceived(assist.received_date || assist.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW DETAIL MODAL -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>📋 Buong Detalye ng Talaan</h2>
            <button class="modal-close" @click="closeDetailModal">&times;</button>
          </div>
          <div class="modal-body" v-if="selectedRecord">

            <!-- Farm Info -->
            <div class="detail-section">
              <h3 class="detail-section-title">🌱 Detalye ng Taniman</h3>
              <div class="detail-grid">
                <div class="detail-cell">
                  <span class="cell-label">Petsa ng Talaan</span>
                  <span class="cell-value">{{ formatDate(selectedRecord.created_at) }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Lawak (Ektarya)</span>
                  <span class="cell-value">{{ selectedRecord.area_hectares }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Paraan ng Pagtatanim</span>
                  <span class="cell-value">{{ selectedRecord.planting_method === 'sabog' ? 'Sabog' : 'Talok' }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Patubig</span>
                  <span class="cell-value">{{ formatIrrigation(selectedRecord.irrigation_type) }}</span>
                </div>
              </div>
            </div>

            <!-- Fertilizers -->
            <div class="detail-section" v-if="selectedRecord.fertilizers && selectedRecord.fertilizers.length > 0">
              <h3 class="detail-section-title">🧪 Mga Ginamit na Abono</h3>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Klase</th>
                    <th>Sako</th>
                    <th>Presyo/Sako</th>
                    <th>Kabuuan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="f in selectedRecord.fertilizers" :key="f.id">
                    <td>{{ f.fertilizer_type }}</td>
                    <td>{{ f.sacks }}</td>
                    <td>₱{{ parseFloat(f.price_per_sack || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td class="amt">₱{{ parseFloat(f.line_total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="foot-label">Kabuuang Abono:</td>
                    <td class="foot-value">₱{{ parseFloat(selectedRecord.total_fertilizer_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="detail-section" v-else>
              <h3 class="detail-section-title">🧪 Mga Ginamit na Abono</h3>
              <p class="no-data">Walang naitalang abono.</p>
            </div>

            <!-- Pesticides -->
            <div class="detail-section" v-if="selectedRecord.pesticides && selectedRecord.pesticides.length > 0">
              <h3 class="detail-section-title">🧴 Mga Ginamit na Lason</h3>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Klase</th>
                    <th>Bilang</th>
                    <th>Presyo/Unit</th>
                    <th>Kabuuan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in selectedRecord.pesticides" :key="p.id">
                    <td>{{ p.pesticide_type }}</td>
                    <td>{{ p.quantity }}</td>
                    <td>₱{{ parseFloat(p.price_per_unit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                    <td class="amt">₱{{ parseFloat(p.line_total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="foot-label">Kabuuang Lason:</td>
                    <td class="foot-value">₱{{ parseFloat(selectedRecord.total_pesticide_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="detail-section" v-else>
              <h3 class="detail-section-title">🧴 Mga Ginamit na Lason</h3>
              <p class="no-data">Walang naitalang lason.</p>
            </div>

            <!-- Labor & Expenses -->
            <div class="detail-section">
              <h3 class="detail-section-title">👷 Gastos sa Labor at Iba Pa</h3>
              <div class="expense-grid">
                <div class="expense-row">
                  <span>Paghahanda ng Lupa</span>
                  <span>₱{{ parseFloat(selectedRecord.land_preparation_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bunot / Talok / Hasik</span>
                  <span>₱{{ parseFloat(selectedRecord.planting_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Pagspray / Pagsabog ng Abono</span>
                  <span>₱{{ parseFloat(selectedRecord.spraying_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bayad sa Harvester</span>
                  <span>₱{{ parseFloat(selectedRecord.harvester_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bayad sa Pagbibilad</span>
                  <span>₱{{ parseFloat(selectedRecord.drying_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Bayad sa Paghakot</span>
                  <span>₱{{ parseFloat(selectedRecord.hauling_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Tarasko</span>
                  <span>₱{{ parseFloat(selectedRecord.tarasko_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Krudo</span>
                  <span>₱{{ parseFloat(selectedRecord.fuel_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row">
                  <span>Iba Pang Gastos</span>
                  <span>₱{{ parseFloat(selectedRecord.other_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="expense-row total-row">
                  <span>Kabuuang Labor:</span>
                  <span>₱{{ parseFloat(selectedRecord.total_labor_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </div>

            <!-- Harvest -->
            <div class="detail-section">
              <h3 class="detail-section-title">🌾 Ani</h3>
              <div class="detail-grid">
                <div class="detail-cell">
                  <span class="cell-label">Sako na Naani</span>
                  <span class="cell-value">{{ selectedRecord.sacks_harvested }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Kilo Kada Sako</span>
                  <span class="cell-value">{{ selectedRecord.kg_per_sack }} kg</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Presyo Kada Kilo</span>
                  <span class="cell-value">₱{{ parseFloat(selectedRecord.price_per_kg || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="detail-cell">
                  <span class="cell-label">Kabuuang Ani</span>
                  <span class="cell-value">{{ (parseFloat(selectedRecord.sacks_harvested || 0) * parseFloat(selectedRecord.kg_per_sack || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} kg</span>
                </div>
              </div>
            </div>

            <!-- Grand Summary -->
            <div class="detail-section summary-detail-section">
              <h3 class="detail-section-title">📊 Buod</h3>
              <div class="grand-summary">
                <div class="grand-row income-row">
                  <span>Kabuuang Benta</span>
                  <span>₱{{ parseFloat(selectedRecord.gross_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="grand-row expense-summary-row">
                  <span>Kabuuang Gastos</span>
                  <span>₱{{ parseFloat(selectedRecord.total_expenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
                <div class="grand-row" :class="parseFloat(selectedRecord.net_income || 0) >= 0 ? 'net-profit-row' : 'net-loss-row'">
                  <span>Netong Kita</span>
                  <span>₱{{ parseFloat(selectedRecord.net_income || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
                </div>
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn-close-modal" @click="closeDetailModal">Isara</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.currentUser)

const activeTab = ref('form')
const successMessage = ref('')
const errorMessage = ref('')
const submitting = ref(false)
const loadingRecords = ref(false)
const records = ref([])
const loadingAssistance = ref(false)
const completedAssistance = ref([])
const showDetailModal = ref(false)
const selectedRecord = ref(null)
const editingRecordId = ref(null)
const editingCreatedAt = ref(null)

// ─── Detail modal ───
const openRecordDetail = (record) => {
  selectedRecord.value = record
  showDetailModal.value = true
}
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedRecord.value = null
}

// ─── Form State ───
const getInitialForm = () => ({
  area_hectares: null,
  planting_method: '',
  irrigation_type: '',
  fertilizers: [{ type: '', sacks: null, price_per_sack: null }],
  pesticides: [{ type: '', quantity: null, price_per_unit: null }],
  land_preparation_cost: 0,
  planting_cost: 0,
  spraying_cost: 0,
  harvester_cost: 0,
  drying_cost: 0,
  hauling_cost: 0,
  tarasko_cost: 0,
  fuel_cost: 0,
  other_expenses: 0,
  sacks_harvested: null,
  kg_per_sack: null,
  price_per_kg: null
})

const form = ref(getInitialForm())

// ─── Fertilizer helpers ───
const addFertilizer = () => {
  form.value.fertilizers.push({ type: '', sacks: null, price_per_sack: null })
}
const removeFertilizer = (index) => {
  form.value.fertilizers.splice(index, 1)
}
const fertilizerLineTotal = (item) => (item.sacks || 0) * (item.price_per_sack || 0)
const totalFertilizerCost = computed(() =>
  form.value.fertilizers.reduce((sum, f) => sum + fertilizerLineTotal(f), 0)
)

// ─── Pesticide helpers ───
const addPesticide = () => {
  form.value.pesticides.push({ type: '', quantity: null, price_per_unit: null })
}
const removePesticide = (index) => {
  form.value.pesticides.splice(index, 1)
}
const pesticideLineTotal = (item) => (item.quantity || 0) * (item.price_per_unit || 0)
const totalPesticideCost = computed(() =>
  form.value.pesticides.reduce((sum, p) => sum + pesticideLineTotal(p), 0)
)

// ─── Labor totals ───
const totalLaborCost = computed(() =>
  (form.value.land_preparation_cost || 0) +
  (form.value.planting_cost || 0) +
  (form.value.spraying_cost || 0) +
  (form.value.harvester_cost || 0) +
  (form.value.drying_cost || 0) +
  (form.value.hauling_cost || 0) +
  (form.value.tarasko_cost || 0) +
  (form.value.fuel_cost || 0) +
  (form.value.other_expenses || 0)
)

// ─── Harvest & income ───
const totalHarvestKg = computed(() => (form.value.sacks_harvested || 0) * (form.value.kg_per_sack || 0))
const grossIncome = computed(() => totalHarvestKg.value * (form.value.price_per_kg || 0))
const totalExpenses = computed(() =>
  totalFertilizerCost.value + totalPesticideCost.value + totalLaborCost.value
)
const netIncome = computed(() => grossIncome.value - totalExpenses.value)

// ─── Submit (create or update) ───
const submitForm = async () => {
  if (!currentUser.value?.id) {
    errorMessage.value = 'Hindi ka naka-login. Mag-login muna.'
    return
  }
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      farmer_id: currentUser.value.id,
      area_hectares: form.value.area_hectares,
      planting_method: form.value.planting_method,
      irrigation_type: form.value.irrigation_type,
      fertilizers: form.value.fertilizers.filter(f => f.type),
      pesticides: form.value.pesticides.filter(p => p.type),
      land_preparation_cost: form.value.land_preparation_cost || 0,
      planting_cost: form.value.planting_cost || 0,
      spraying_cost: form.value.spraying_cost || 0,
      harvester_cost: form.value.harvester_cost || 0,
      drying_cost: form.value.drying_cost || 0,
      hauling_cost: form.value.hauling_cost || 0,
      tarasko_cost: form.value.tarasko_cost || 0,
      fuel_cost: form.value.fuel_cost || 0,
      other_expenses: form.value.other_expenses || 0,
      sacks_harvested: form.value.sacks_harvested,
      kg_per_sack: form.value.kg_per_sack,
      price_per_kg: form.value.price_per_kg,
      total_fertilizer_cost: totalFertilizerCost.value,
      total_pesticide_cost: totalPesticideCost.value,
      total_labor_cost: totalLaborCost.value,
      gross_income: grossIncome.value,
      total_expenses: totalExpenses.value,
      net_income: netIncome.value
    }

    let res
    if (editingRecordId.value) {
      // UPDATE
      res = await fetch(`/api/farmer-income/${editingRecordId.value}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(payload)
      })
    } else {
      // CREATE
      res = await fetch('/api/farmer-income', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(payload)
      })
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'May problema sa pag-save.')

    successMessage.value = editingRecordId.value
      ? 'Matagumpay na na-update ang talaan!'
      : 'Matagumpay na naitala ang iyong kita!'
    cancelEdit()
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    submitting.value = false
  }
}

// ─── Edit helpers ───
const startEdit = (record) => {
  editingRecordId.value = record.id
  editingCreatedAt.value = record.created_at

  // Map fertilizers from DB format to form format
  const fertilizers = (record.fertilizers && record.fertilizers.length > 0)
    ? record.fertilizers.map(f => ({
        type: f.fertilizer_type,
        sacks: f.sacks,
        price_per_sack: parseFloat(f.price_per_sack)
      }))
    : [{ type: '', sacks: null, price_per_sack: null }]

  // Map pesticides from DB format to form format
  const pesticides = (record.pesticides && record.pesticides.length > 0)
    ? record.pesticides.map(p => ({
        type: p.pesticide_type,
        quantity: p.quantity,
        price_per_unit: parseFloat(p.price_per_unit)
      }))
    : [{ type: '', quantity: null, price_per_unit: null }]

  form.value = {
    area_hectares: parseFloat(record.area_hectares),
    planting_method: record.planting_method,
    irrigation_type: record.irrigation_type,
    fertilizers,
    pesticides,
    land_preparation_cost: parseFloat(record.land_preparation_cost) || 0,
    planting_cost: parseFloat(record.planting_cost) || 0,
    spraying_cost: parseFloat(record.spraying_cost) || 0,
    harvester_cost: parseFloat(record.harvester_cost) || 0,
    drying_cost: parseFloat(record.drying_cost) || 0,
    hauling_cost: parseFloat(record.hauling_cost) || 0,
    tarasko_cost: parseFloat(record.tarasko_cost) || 0,
    fuel_cost: parseFloat(record.fuel_cost) || 0,
    other_expenses: parseFloat(record.other_expenses) || 0,
    sacks_harvested: record.sacks_harvested,
    kg_per_sack: parseFloat(record.kg_per_sack),
    price_per_kg: parseFloat(record.price_per_kg)
  }

  activeTab.value = 'form'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEdit = () => {
  editingRecordId.value = null
  editingCreatedAt.value = null
  resetForm()
}

// ─── Fetch history ───
const fetchRecords = async () => {
  if (!currentUser.value?.id) return
  loadingRecords.value = true
  try {
    const res = await fetch(`/api/farmer-income/${currentUser.value.id}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Hindi makuha ang mga talaan.')
    records.value = data
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loadingRecords.value = false
  }
}

const fetchCompletedAssistance = async () => {
  if (!currentUser.value?.id) return
  loadingAssistance.value = true
  try {
    const endpoint = currentUser.value.role === 'admin' 
      ? '/api/farmer-income/distribution/completed/all'
      : `/api/farmer-income/distribution/completed/${currentUser.value.id}`
    
    const res = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Hindi makuha ang tulong na natanggap.')
    completedAssistance.value = data
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loadingAssistance.value = false
  }
}

// ─── Helpers ───
const resetForm = () => {
  form.value = getInitialForm()
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fil-PH', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

const formatIrrigation = (type) => {
  const map = {
    'NIA': 'NIA',
    'bugsok_waterpump': 'Bugsok na Waterpump',
    'waterpump_irrigation': 'Waterpump na Nakalawit sa Irrigation',
    'waterpump_ilog': 'Waterpump na Nakalawit sa Ilog'
  }
  return map[type] || type
}

const formatPlanting = (method) => {
  return method === 'sabog' ? 'Sabog' : 'Talok'
}

const formatAssistanceType = (type) => {
  const map = { 'fertilizer': 'Pataba', 'seeds': 'Binhi', 'both': 'Pataba at Binhi' }
  return map[type] || type
}

const extractQuantityFromNotes = (notes) => {
  if (!notes) return ''
  const quantityPart = notes.split(' - ')[0]
  return quantityPart.trim()
}

const extractNotesOnly = (notes) => {
  if (!notes) return ''
  const parts = notes.split(' - ')
  return parts.length > 1 ? parts[1] : ''
}

const countAssistanceByType = (type) => {
  return completedAssistance.value.filter(a => a.assistance_type === type).length
}

const getAssistanceTypeClass = (type) => {
  const map = {
    'fertilizer': 'type-fertilizer',
    'seeds': 'type-seeds',
    'both': 'type-both'
  }
  return map[type] || 'type-other'
}

const getTimeSinceReceived = (dateStr) => {
  if (!dateStr) return 'Kamakailan'
  const date = new Date(dateStr)
  const now = new Date()
  const days = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Ngayong araw'
  if (days === 1) return 'Kahapon'
  if (days < 7) return `${days} araw na ang nakakaraan`
  if (days < 30) return `${Math.floor(days / 7)} linggo na ang nakakaraan`
  if (days < 365) return `${Math.floor(days / 30)} buwan na ang nakakaraan`
  return `${Math.floor(days / 365)} taon na ang nakakaraan`
}
</script>

<style scoped>
.page-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  background: rgba(25, 38, 29, 0.92);
  border: 1px solid rgba(190, 235, 203, 0.13);
  border-radius: 20px;
  padding: 32px 38px;
  margin-bottom: 24px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.35), inset 1px 1px 0 rgba(255,255,255,0.06);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.13) 0%, transparent 65%);
  pointer-events: none;
}

.page-title {
  margin: 0;
  font-size: 34px;
  font-weight: 800;
  color: #eefde6;
}

.page-subtitle {
  margin: 6px 0 0 0;
  color: rgba(220, 238, 211, 0.78);
  font-size: 17px;
}

/* Alerts */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}
.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}
.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
.alert-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
}

/* Tab Navigation */
.tab-nav {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  align-items: center;
}
.tab-btn {
  padding: 0.78rem 1.3rem;
  border: 1px solid rgba(190, 235, 203, 0.2);
  background: rgba(28, 42, 33, 0.9);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(220, 238, 211, 0.9);
  transition: all 0.22s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22), inset 1px 1px 0 rgba(255, 255, 255, 0.04);
}
.tab-btn.active {
  background: linear-gradient(135deg, rgba(22, 101, 52, 0.95), rgba(21, 128, 61, 0.92));
  color: #eefde6;
  border-color: rgba(134, 239, 172, 0.45);
  box-shadow: 0 8px 18px rgba(4, 12, 8, 0.32), 0 0 18px rgba(74, 222, 128, 0.2);
}
.tab-btn:hover:not(.active) {
  border-color: rgba(134, 239, 172, 0.35);
  background: rgba(32, 49, 38, 0.95);
  transform: translateY(-1px);
}

/* Form Sections */
.form-section {
  background: #ffffff;
  border: 1px solid rgba(167, 243, 208, 0.45);
  border-radius: 16px;
  padding: 2.15rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 20px rgba(6, 16, 11, 0.2);
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #166534;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(167, 243, 208, 0.65);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}
.form-group.full-width {
  grid-column: 1 / -1;
}
.form-group label {
  font-size: 0.92rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.35rem;
}
.form-group input,
.form-group select {
  padding: 1.05rem 1.1rem;
  border: 1px solid rgba(110, 231, 183, 0.35);
  border-radius: 12px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  background: rgba(245, 255, 250, 0.9);
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

/* Dynamic Tables */
.dynamic-table-wrapper {
  overflow-x: auto;
}
.dynamic-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.dynamic-table th {
  background: #f0fdf4;
  color: #166534;
  font-weight: 600;
  padding: 0.95rem 0.75rem;
  text-align: left;
  border-bottom: 2px solid #bbf7d0;
  white-space: nowrap;
}
.dynamic-table td {
  padding: 0.75rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}
.dynamic-table td input,
.dynamic-table td select {
  width: 100%;
  padding: 0.4rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
  box-sizing: border-box;
}
.dynamic-table td input:focus,
.dynamic-table td select:focus {
  outline: none;
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.1);
}
.computed-cell {
  font-weight: 600;
  color: #166534;
  white-space: nowrap;
  min-width: 100px;
}
.total-label {
  text-align: right;
  font-weight: 700;
  color: #374151;
  padding-top: 0.75rem !important;
}
.total-value {
  font-weight: 700;
  color: #166534;
  font-size: 0.95rem;
  padding-top: 0.75rem !important;
  white-space: nowrap;
}
.remove-btn {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.remove-btn:hover {
  background: #dc2626;
  color: white;
}
.add-row-btn {
  margin-top: 0.75rem;
  padding: 0.9rem 1.35rem;
  background: #f0fdf4;
  color: #166534;
  border: 1px dashed #16a34a;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}
.add-row-btn:hover {
  background: #dcfce7;
  border-color: #166534;
}

/* Labor Total Box */
.labor-total-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #14532d 0%, #166534 100%);
  border: 1px solid #22c55e;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-top: 0.75rem;
}
.labor-total-label {
  font-weight: 800;
  font-size: 1.02rem;
  color: #ecfdf5 !important;
}
.labor-total-value {
  font-weight: 900;
  font-size: 1.2rem;
  color: #bbf7d0 !important;
}

/* Summary Section */
.summary-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 2px solid #86efac;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.summary-item {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  border: 1px solid #e5e7eb;
}
.summary-item .summary-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.3rem;
  font-weight: 600;
}
.summary-item .summary-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
}
.summary-item.income .summary-value { color: #2563eb; }
.summary-item.expense .summary-value { color: #dc2626; }
.summary-item.profit { border-color: #16a34a; background: #f0fdf4; }
.summary-item.profit .summary-value { color: #166534; }
.summary-item.loss { border-color: #dc2626; background: #fef2f2; }
.summary-item.loss .summary-value { color: #dc2626; }

/* Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.5rem 0 1rem;
}
.btn-reset {
  padding: 1rem 1.8rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.05rem;
  transition: all 0.2s;
}
.btn-reset:hover {
  background: #e5e7eb;
}
.btn-submit {
  padding: 1rem 2.4rem;
  background: linear-gradient(135deg, #166534, #16a34a);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.05rem;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(22, 101, 52, 0.3);
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 101, 52, 0.4);
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* History */
.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}
.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.record-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.record-date {
  font-weight: 600;
  color: #374151;
}
.record-season {
  background: #f0fdf4;
  color: #166534;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}
.record-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.record-detail {
  font-size: 0.85rem;
  color: #4b5563;
}
.detail-label {
  font-weight: 600;
  margin-right: 0.25rem;
}
.record-financials {
  display: flex;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}
.financial-item {
  display: flex;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
}
.financial-item.income { color: #2563eb; }
.financial-item.expense { color: #dc2626; }
.financial-item.profit { color: #166534; }
.financial-item.loss { color: #dc2626; }

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }
  .record-details {
    grid-template-columns: 1fr;
  }
  .record-financials {
    flex-direction: column;
    gap: 0.5rem;
  }
  .tab-nav {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .form-actions {
    flex-direction: column;
  }
  .btn-submit, .btn-reset {
    width: 100%;
    text-align: center;
  }
}

/* View Button */
.view-btn {
  padding: 0.35rem 0.85rem;
  background: linear-gradient(135deg, #166534, #16a34a);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}
.view-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(22, 101, 52, 0.35);
}
.record-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.edit-btn {
  padding: 0.35rem 0.85rem;
  background: linear-gradient(135deg, #b45309, #d97706);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}
.edit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(180, 83, 9, 0.35);
}
.edit-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #92400e;
}
.cancel-edit-btn {
  padding: 0.3rem 0.75rem;
  background: #fff;
  color: #92400e;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
}
.cancel-edit-btn:hover {
  background: #fef3c7;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}
.modal-container {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #166534, #16a34a);
  color: white;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}
.modal-close {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.modal-close:hover {
  background: rgba(255,255,255,0.35);
}
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}
.btn-close-modal {
  padding: 0.55rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.btn-close-modal:hover {
  background: #e5e7eb;
}

/* Detail Sections */
.detail-section {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}
.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
.detail-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #166534;
  margin: 0 0 0.75rem 0;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.detail-cell {
  background: #f9fafb;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
}
.cell-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.15rem;
}
.cell-value {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
}

/* Detail Tables */
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.detail-table th {
  background: #f0fdf4;
  color: #166534;
  font-weight: 600;
  padding: 0.5rem 0.6rem;
  text-align: left;
  border-bottom: 2px solid #bbf7d0;
}
.detail-table td {
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid #f3f4f6;
}
.detail-table .amt {
  font-weight: 600;
  color: #166534;
}
.detail-table .foot-label {
  text-align: right;
  font-weight: 700;
  color: #374151;
  padding-top: 0.6rem;
}
.detail-table .foot-value {
  font-weight: 700;
  color: #166534;
  padding-top: 0.6rem;
}
.no-data {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.85rem;
  margin: 0;
}

/* Expense Grid */
.expense-grid {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.expense-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.85rem;
}
.expense-row.total-row {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  font-weight: 700;
  color: #166534;
  margin-top: 0.35rem;
}

/* Grand Summary */
.summary-detail-section {
  background: #f0fdf4;
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid #86efac;
}
.grand-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.grand-row {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
}
.income-row {
  background: #eff6ff;
  color: #2563eb;
}
.expense-summary-row {
  background: #fef2f2;
  color: #dc2626;
}
.net-profit-row {
  background: #dcfce7;
  color: #166534;
  font-size: 1.05rem;
}
.net-loss-row {
  background: #fee2e2;
  color: #dc2626;
  font-size: 1.05rem;
}

/* Assistance Tab Styles */
.assistance-wrapper {
  width: 100%;
}

/* Summary Section */
.assistance-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border-radius: 12px;
  border: 1px solid #86efac;
}

.summary-box {
  background: white;
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.summary-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: #86efac;
}

.summary-icon {
  font-size: 2rem;
  min-width: 50px;
  text-align: center;
}

.summary-info {
  flex: 1;
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.4rem;
}

.summary-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #166534;
}

/* Assistance Grid */
.assistance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.assistance-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.assistance-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-color: #86efac;
}

/* Card Header */
.assistance-card .card-header {
  padding: 1rem;
  border-bottom: 2px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.assistance-type-badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.assistance-type-badge.type-fertilizer {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.assistance-type-badge.type-seeds {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.assistance-type-badge.type-both {
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
}

.status-badge {
  display: inline-block;
  padding: 0.3rem 0.75rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

/* Card Body */
.assistance-card .card-body {
  padding: 1.25rem;
  flex: 1;
}

.info-row {
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.info-row.dates-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
}

.quantity-highlight {
  font-size: 1.1rem;
  color: #16a34a;
  font-weight: 700;
}

.notes-section {
  background: #f9fafb;
  border-left: 3px solid #16a34a;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 0.75rem;
}

.notes-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 0.35rem;
}

.notes-content {
  font-size: 0.85rem;
  color: #374151;
  margin: 0;
  line-height: 1.4;
}

/* Card Footer */
.assistance-card .card-footer {
  padding: 0.75rem 1.25rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
}

.badge-info {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  white-space: nowrap;
}

/* Darker cards/panels override for Farmer Income page */
.page-container .form-section,
.page-container .summary-section,
.page-container .record-card,
.page-container .assistance-summary,
.page-container .assistance-card,
.page-container .summary-box,
.page-container .modal-container {
  background: linear-gradient(145deg, rgba(33, 55, 42, 0.92), rgba(28, 46, 36, 0.9)) !important;
  border: 1px solid rgba(167, 243, 208, 0.32) !important;
  box-shadow: 0 10px 22px rgba(6, 12, 9, 0.34) !important;
}

.page-container .detail-cell,
.page-container .summary-item,
.page-container .notes-section,
.page-container .expense-row,
.page-container .assistance-card .card-footer,
.page-container .assistance-card .card-header {
  background: rgba(42, 64, 50, 0.78) !important;
  border-color: rgba(167, 243, 208, 0.28) !important;
}

.page-container .dynamic-table th,
.page-container .detail-table th {
  background: linear-gradient(120deg, rgba(34, 197, 94, 0.18), rgba(20, 83, 45, 0.28)) !important;
}

.page-container .dynamic-table td,
.page-container .detail-table td,
.page-container .record-detail,
.page-container .notes-content,
.page-container .info-value,
.page-container .cell-value {
  color: #dcfce7 !important;
}

/* Force white text for farmer income form content */
.page-container .form-section,
.page-container .form-section label,
.page-container .section-title,
.page-container .dynamic-table th,
.page-container .dynamic-table td,
.page-container .computed-cell,
.page-container .total-label,
.page-container .total-value,
.page-container .labor-total-label,
.page-container .labor-total-value,
.page-container .summary-item .summary-label,
.page-container .summary-item .summary-value,
.page-container .summary-label,
.page-container .summary-value,
.page-container .form-group input,
.page-container .form-group select {
  color: #ffffff !important;
}

.page-container .form-group input::placeholder {
  color: rgba(255, 255, 255, 0.82) !important;
}

.page-container .modal-footer {
  border-top: 1px solid rgba(126, 184, 145, 0.2) !important;
  background: rgba(14, 24, 19, 0.85) !important;
}

.page-container .tab-btn {
  background: rgba(20, 34, 26, 0.92) !important;
  border-color: rgba(126, 184, 145, 0.32) !important;
  color: #d1fae5 !important;
}

.page-container .tab-btn:hover:not(.active) {
  background: rgba(24, 41, 31, 0.96) !important;
}

.page-container .tab-btn.active {
  background: linear-gradient(120deg, rgba(22, 101, 52, 0.92), rgba(21, 128, 61, 0.88)) !important;
  border-color: rgba(134, 239, 172, 0.48) !important;
}

@media (max-width: 600px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .modal-container {
    max-height: 95vh;
  }
  .assistance-summary {
    grid-template-columns: repeat(2, 1fr);
    padding: 1rem;
    gap: 0.75rem;
  }
  .assistance-grid {
    grid-template-columns: 1fr;
  }
  .info-row {
    grid-template-columns: 1fr;
  }
  .summary-box {
    padding: 1rem;
    flex-direction: column;
    text-align: center;
  }
  .summary-icon {
    font-size: 1.75rem;
    min-width: auto;
  }
  .summary-value {
    font-size: 1.5rem;
  }
}
</style>
