<template>
  <div class="donut-chart-container">
    <svg :viewBox="`0 0 ${size} ${size}`" :width="size" :height="size" class="donut-chart" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern :id="gridPatternId" width="14" height="14" patternUnits="userSpaceOnUse">
          <path
            d="M 14 0 L 0 0 0 14"
            fill="none"
            stroke="rgba(167, 243, 198, 0.14)"
            stroke-width="0.55"
          />
        </pattern>
      </defs>
      <rect
        x="0"
        y="0"
        :width="size"
        :height="size"
        :fill="`url(#${gridPatternId})`"
        class="chart-grid-bg"
      />
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="transparent"
        stroke="rgba(100, 130, 115, 0.32)"
        :stroke-width="strokeWidth"
      />
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="transparent"
        :stroke="incomeColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="`${incomeLength} ${circumference - incomeLength}`"
        stroke-dashoffset="0"
        stroke-linecap="round"
        :transform="`rotate(-90 ${center} ${center})`"
        class="chart-segment"
      >
        <title>{{ incomeTooltip }}</title>
      </circle>
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="transparent"
        :stroke="expenseColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="`${expenseLength} ${circumference - expenseLength}`"
        :stroke-dashoffset="incomeLength"
        stroke-linecap="round"
        :transform="`rotate(-90 ${center} ${center})`"
        class="chart-segment"
      >
        <title>{{ expenseTooltip }}</title>
      </circle>
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="transparent"
        :stroke="savingsColor"
        :stroke-width="strokeWidth"
        :stroke-dasharray="`${savingsLength} ${circumference - savingsLength}`"
        :stroke-dashoffset="incomeLength + expenseLength"
        stroke-linecap="round"
        :transform="`rotate(-90 ${center} ${center})`"
        class="chart-segment"
      >
        <title>{{ savingsTooltip }}</title>
      </circle>
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        class="chart-center-text"
      >
        <tspan x="50%" dy="-0.4em" class="chart-subtitle">Total Balance</tspan>
        <tspan x="50%" dy="1.2em" class="chart-total">{{ totalAmount }}</tspan>
      </text>
    </svg>
    <div class="chart-legend">
      <div
        v-for="item in legendItems"
        :key="item.key"
        class="legend-item"
        :title="`${item.label}: ${item.amountLabel} (${item.percentLabel})`"
      >
        <div class="legend-dot" :style="{ backgroundColor: item.color }"></div>
        <div class="legend-meta">
          <div class="legend-label">{{ item.label }}</div>
          <div class="legend-sublabel">{{ item.amountLabel }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'

const gridPatternId = useId().replace(/[^a-zA-Z0-9_-]/g, '')

const props = defineProps({
  income: {
    type: Number,
    default: 800000
  },
  expenses: {
    type: Number,
    default: 200000
  },
  savings: {
    type: Number,
    default: 200000
  },
  size: {
    type: Number,
    default: 200
  }
})

const incomeColor = '#22c55e'
const expenseColor = '#fb7185'
const savingsColor = '#eab308'

const totalAmountValue = computed(() => props.income + props.expenses + props.savings)
const totalAmount = computed(() => {
  return formatAmount(totalAmountValue.value)
})

const center = computed(() => props.size / 2)
const strokeWidth = computed(() => Math.max(14, props.size * 0.08))
const radius = computed(() => center.value - strokeWidth.value / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const incomePercentage = computed(() => {
  return totalAmountValue.value ? props.income / totalAmountValue.value : 0
})
const expensePercentage = computed(() => {
  return totalAmountValue.value ? props.expenses / totalAmountValue.value : 0
})
const savingsPercentage = computed(() => {
  return totalAmountValue.value ? props.savings / totalAmountValue.value : 0
})

const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPercent = (value) => `${(value * 100).toFixed(0)}%`

const incomeTooltip = computed(() => `Income: ${formatAmount(props.income)} (${formatPercent(incomePercentage.value)})`)
const expenseTooltip = computed(() => `Expenses: ${formatAmount(props.expenses)} (${formatPercent(expensePercentage.value)})`)
const savingsTooltip = computed(() => `Savings: ${formatAmount(props.savings)} (${formatPercent(savingsPercentage.value)})`)

const legendItems = computed(() => [
  {
    key: 'income',
    label: 'Income',
    amountLabel: formatAmount(props.income),
    percentLabel: formatPercent(incomePercentage.value),
    color: incomeColor,
    icon: '💰'
  },
  {
    key: 'expenses',
    label: 'Expenses',
    amountLabel: formatAmount(props.expenses),
    percentLabel: formatPercent(expensePercentage.value),
    color: expenseColor,
    icon: '💸'
  },
  {
    key: 'savings',
    label: 'Savings',
    amountLabel: formatAmount(props.savings),
    percentLabel: formatPercent(savingsPercentage.value),
    color: savingsColor,
    icon: '🏦'
  }
])

const incomeLength = computed(() => (incomePercentage.value * circumference.value))
const expenseLength = computed(() => (expensePercentage.value * circumference.value))
const savingsLength = computed(() => (savingsPercentage.value * circumference.value))
</script>

<style scoped>
.donut-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.donut-chart {
  width: min(100%, 240px);
  height: auto;
  flex: 1 1 240px;
}

.chart-grid-bg {
  pointer-events: none;
  opacity: 0.55;
}

.chart-segment {
  transition: opacity 0.3s ease, filter 0.3s ease;
  opacity: 0.95;
}

.chart-segment:hover {
  opacity: 1;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.4));
}

.chart-center-text {
  font-size: 12px;
  fill: #ecfdf5;
  opacity: 0.96;
}

.chart-subtitle {
  font-size: 12px;
  fill: #c4f1d8;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.chart-total {
  font-size: 24px;
  fill: #f8fafc;
  font-weight: 800;
}

.chart-amount {
  display: none;
}

.chart-legend {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.08);
  cursor: default;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.legend-item:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.legend-label {
  color: #f0fdf4;
  font-weight: 700;
  font-size: 14px;
}

.legend-sublabel {
  color: #d1fae5;
  font-size: 13px;
}

@keyframes chartEnter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.donut-chart-container {
  animation: chartEnter 0.8s ease both;
}
</style>

