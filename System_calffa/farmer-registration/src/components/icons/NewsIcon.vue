<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 5H15V4H3C2.45 4 2 4.45 2 5V19C2 19.55 2.45 20 3 20H15V19H3V5Z" :fill="color"/>
    <path d="M17 2H9C8.45 2 8 2.45 8 3V15C8 15.55 8.45 16 9 16H17C17.55 16 18 15.55 18 15V3C18 2.45 17.55 2 17 2ZM17 15H9V3H17V15Z" :fill="color"/>
    <rect x="10" y="5" width="5" height="2" :fill="color"/>
    <rect x="10" y="9" width="5" height="2" :fill="color"/>
    <rect x="10" y="13" width="5" height="1" :fill="color"/>
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
