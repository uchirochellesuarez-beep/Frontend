<template>
  <div class="blockchain-audit-page glass-module-page">
    <div class="page-header">
      <h1>Blockchain Verification / Audit Trail</h1>
      <p>Internal blockchain integrity check for Module 7 financial records.</p>
    </div>

    <div v-if="!hasAccess" class="access-denied">
      <h2>Access Denied</h2>
      <p>Only Admin, President, Treasurer, and Auditor can view blockchain verification.</p>
    </div>

    <div v-else>
      <div class="actions-bar">
        <button class="btn-primary" @click="loadAuditTrail" :disabled="loading">
          {{ loading ? 'Verifying...' : 'Recalculate and Verify Blocks' }}
        </button>
      </div>

      <div class="summary-grid" v-if="summary">
        <div class="summary-card">
          <span class="label">Total Blocks</span>
          <span class="value">{{ summary.total_blocks }}</span>
        </div>
        <div class="summary-card valid">
          <span class="label">Valid Blocks</span>
          <span class="value">{{ summary.valid_blocks }}</span>
        </div>
        <div class="summary-card tampered">
          <span class="label">Tampered Blocks</span>
          <span class="value">{{ summary.tampered_blocks }}</span>
        </div>
        <div class="summary-card" :class="summary.chain_valid ? 'valid' : 'tampered'">
          <span class="label">Chain Status</span>
          <span class="value">{{ summary.chain_valid ? 'VALID' : 'TAMPERED' }}</span>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Block ID</th>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Stored Hash</th>
              <th>Recomputed Hash</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in verification" :key="item.block_id">
              <td>{{ item.block_id }}</td>
              <td>{{ formatDate(item.timestamp) }}</td>
              <td>{{ item.transaction_type }}</td>
              <td class="mono">{{ item.stored_hash }}</td>
              <td class="mono">{{ item.recomputed_hash }}</td>
              <td>
                <span :class="item.is_valid ? 'badge-valid' : 'badge-tampered'">
                  {{ item.is_valid ? 'Valid Block' : 'Tampered Block' }}
                </span>
              </td>
            </tr>
            <tr v-if="verification.length === 0">
              <td colspan="6" class="empty">No blockchain blocks found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="errorMessage" class="error-box">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = 'http://localhost:3000/api';

const authStore = useAuthStore();
const router = useRouter();

const loading = ref(false);
const summary = ref(null);
const verification = ref([]);
const errorMessage = ref('');

const hasAccess = computed(() => {
  const role = authStore.currentUser?.role;
  return ['admin', 'president', 'treasurer', 'auditor'].includes(role);
});

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-PH');
};

const loadAuditTrail = async () => {
  if (!authStore.currentUser?.id) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    const query = new URLSearchParams({
      user_id: authStore.currentUser.id,
      limit: '500'
    });

    const response = await fetch(`${API_BASE_URL}/blockchain/audit-trail?${query.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to verify blockchain.');
    }

    summary.value = data.summary;
    verification.value = data.verification || [];
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load blockchain audit trail.';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!hasAccess.value) {
    router.push('/dashboard');
    return;
  }

  await loadAuditTrail();
});
</script>

<style scoped>
/* ============================================
   PAGE CONTAINER — Dark Green Glassmorphic
   ============================================ */
.blockchain-audit-page {
  --green: #34d399;
  --teal: #2dd4bf;
  --lime: #a3e635;
  --yellow: #86efac;
  --red: #f87171;
  --text-main: #eefde6;
  --text-muted: rgba(220, 238, 211, 0.78);

  min-height: 100vh;
  padding: 28px;
  background: linear-gradient(145deg, #0f1712 0%, #132119 22%, #1a2b20 45%, #243b2c 72%, #2f4a38 100%);
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: var(--text-main);
  position: relative;
  isolation: isolate;
}

.blockchain-audit-page::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 10% 90%, rgba(17, 94, 41, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 90% 10%, rgba(45, 212, 191, 0.10) 0%, transparent 60%),
    radial-gradient(circle at 78% 78%, rgba(163, 230, 53, 0.08) 0%, transparent 30%);
  pointer-events: none;
  z-index: -1;
}

/* ============================================
   PAGE HEADER
   ============================================ */
.page-header {
  background: rgba(25, 38, 29, 0.92);
  border: 1px solid rgba(190, 235, 203, 0.14);
  border-radius: 20px;
  padding: 28px 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35), inset 1px 1px 0 rgba(255,255,255,0.06);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 240px; height: 240px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.12) 0%, transparent 65%);
  pointer-events: none;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--text-main);
}

.page-header p {
  color: var(--text-muted);
  margin-top: 6px;
  font-size: 14px;
  font-weight: 700;
}

/* ============================================
   ACCESS DENIED
   ============================================ */
.access-denied {
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.25);
  border-radius: 14px;
  padding: 28px 32px;
  color: #fca5a5;
}

.access-denied h2 { margin: 0 0 8px; font-size: 18px; }

/* ============================================
   ACTIONS BAR
   ============================================ */
.actions-bar {
  margin: 0 0 22px 0;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.22), rgba(34, 197, 94, 0.14));
  color: var(--green);
  border: 1px solid rgba(74, 222, 128, 0.35);
  padding: 11px 22px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.34), rgba(34, 197, 94, 0.24));
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(74, 222, 128, 0.2);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ============================================
   SUMMARY GRID
   ============================================ */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: rgba(28, 42, 33, 0.90);
  border: 1px solid rgba(190, 235, 203, 0.14);
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.28), inset 1px 1px 0 rgba(255,255,255,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0,0,0,0.36);
}

.summary-card.valid {
  border-color: rgba(74, 222, 128, 0.35);
  background: linear-gradient(145deg, rgba(74, 222, 128, 0.10), rgba(28, 42, 33, 0.90));
}

.summary-card.tampered {
  border-color: rgba(248, 113, 113, 0.35);
  background: linear-gradient(145deg, rgba(248, 113, 113, 0.10), rgba(28, 42, 33, 0.90));
}

.label {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 6px;
}

.value {
  display: block;
  font-weight: 900;
  font-size: 22px;
  color: var(--text-main);
}

.summary-card.valid .value   { color: var(--green); }
.summary-card.tampered .value { color: var(--red); }

/* ============================================
   TABLE
   ============================================ */
.table-wrap {
  overflow: auto;
  background: rgba(25, 38, 29, 0.88);
  border: 1px solid rgba(190, 235, 203, 0.12);
  border-radius: 16px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.32);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.18) 0%, rgba(45, 212, 191, 0.10) 100%);
}

th {
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 800;
  color: #b6f7cb;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 1px solid rgba(190, 235, 203, 0.15);
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 13px;
  color: var(--text-main);
}

tbody tr:nth-child(even) td {
  background: rgba(255, 255, 255, 0.025);
}

tbody tr:hover td {
  background: rgba(74, 222, 128, 0.07);
}

.mono {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 11px;
  color: rgba(220, 238, 211, 0.60);
  word-break: break-all;
  max-width: 200px;
}

/* ============================================
   BADGES
   ============================================ */
.badge-valid {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.badge-tampered {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

/* ============================================
   MISC
   ============================================ */
.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 32px 0;
}

.error-box {
  margin-top: 16px;
  background: rgba(248, 113, 113, 0.10);
  border: 1px solid rgba(248, 113, 113, 0.28);
  border-radius: 12px;
  padding: 14px 18px;
  color: #fca5a5;
  font-size: 14px;
}
</style>
