<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 9C3 7.9 3.9 7 5 7H19C20.1 7 21 7.9 21 9V15C21 16.1 20.1 17 19 17H5C3.9 17 3 16.1 3 15V9Z" :stroke="color" stroke-width="2"/>
    <path d="M3 11H21" :stroke="color" stroke-width="2"/>
    <circle cx="12" cy="14" r="1" :fill="color"/>
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
