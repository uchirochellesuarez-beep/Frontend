<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M7 18C6.45 18 6 17.55 6 17V9H4L12 3L20 9H18V17C18 17.55 17.55 18 17 18H7Z" :fill="color"/>
    <path d="M10 15H14V18H10V15Z" :fill="'white'"/>
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
