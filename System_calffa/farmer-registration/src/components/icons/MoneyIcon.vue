<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2" y="6" width="20" height="12" rx="1" :stroke="color" stroke-width="2"/>
    <path d="M2 10H22" :stroke="color" stroke-width="2"/>
    <circle cx="20" cy="12" r="1.5" :fill="color"/>
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
