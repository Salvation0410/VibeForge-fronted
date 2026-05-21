<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useLoginUserStore } from '@/stores/loginUser'

const loginUserStore = useLoginUserStore()

onMounted(() => {
  void loginUserStore.fetchLoginUser()
})
</script>
