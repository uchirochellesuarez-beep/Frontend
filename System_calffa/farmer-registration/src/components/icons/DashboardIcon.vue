<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="3" width="8" height="8" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="13" y="3" width="8" height="8" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="3" y="13" width="8" height="8" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="13" y="13" width="8" height="8" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
