<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 13H5V20H3V13Z" :fill="color"/>
    <path d="M7 9H9V20H7V9Z" :fill="color"/>
    <path d="M11 4H13V20H11V4Z" :fill="color"/>
    <path d="M15 7H17V20H15V7Z" :fill="color"/>
    <path d="M19 11H21V20H19V11Z" :fill="color"/>
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
