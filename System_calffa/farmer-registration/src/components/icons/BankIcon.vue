<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2 7H22M4 7V19C4 19.55 4.45 20 5 20H19C19.55 20 20 19.55 20 19V7" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="6" y="9" width="2" height="8" :fill="color"/>
    <rect x="11" y="9" width="2" height="8" :fill="color"/>
    <rect x="16" y="9" width="2" height="8" :fill="color"/>
    <path d="M2 7L12 2L22 7" :stroke="color" stroke-width="2" stroke-linejoin="round"/>
  </svg>
</template>

<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: 20
  },
  color: {
    type: String,
    default: 'currentColor'
  }
});
</script>
