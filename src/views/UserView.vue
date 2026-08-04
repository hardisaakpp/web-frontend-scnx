<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-300">
    <h1 class="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Panel de Usuario</h1>
    <p class="text-gray-600 dark:text-gray-400">
      Bienvenido Usuario {{ authStore.user }}
    </p>

    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tu icono</h2>
      <div class="flex items-center gap-4 mb-4">
        <span class="text-5xl leading-none">{{ selectedEmoji }}</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="emoji in emojiOptions"
          :key="emoji"
          type="button"
          class="w-10 h-10 flex items-center justify-center text-2xl rounded-lg border transition-colors disabled:opacity-50"
          :class="emoji === selectedEmoji
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'"
          :disabled="saving"
          @click="selectEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
      <p v-if="saveError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ saveError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const emojiOptions = [
  '😀', '😎', '🙂', '🤓', '😺', '🐶', '🦊', '🐼', '🦁', '🐵',
  '🚀', '⚡', '🔥', '🌟', '🎯', '🎮', '⚽', '🏆', '🍀', '☕'
]

const selectedEmoji = computed(() => authStore.avatarEmoji || emojiOptions[0])
const saving = ref(false)
const saveError = ref('')

const selectEmoji = async (emoji: string) => {
  saveError.value = ''
  saving.value = true
  try {
    await authStore.setAvatarEmoji(emoji)
  } catch {
    saveError.value = 'No se pudo guardar el icono en el servidor. Se mantiene en este dispositivo.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  authStore.fetchAvatarEmoji()
})
</script>
