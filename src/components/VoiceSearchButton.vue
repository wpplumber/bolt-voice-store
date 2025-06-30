<template>
  <!-- Enhanced Floating Voice Button -->
  <div class="fixed bottom-6 right-6 z-40">
    <div class="relative">
      <!-- Pulse ring for active state -->
      <div 
        v-if="isActive" 
        class="absolute inset-0 bg-primary/30 rounded-full animate-ping"
      ></div>
      
      <button 
        @click="openVoiceSearch"
        :class="[
          'btn btn-circle btn-lg shadow-lg transition-all duration-300 relative',
          'btn-primary hover:scale-110'
        ]"
        title="Open Voice Search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isActive?: boolean
}

defineProps<Props>()

function openVoiceSearch() {
  // Dispatch custom event to open voice search modal
  window.dispatchEvent(new CustomEvent('openVoiceSearch'))
}
</script>

<style scoped>
.btn-circle:hover:not(:disabled) {
  transform: scale(1.1);
}

.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

@media (max-width: 640px) {
  .fixed.bottom-6.right-6 {
    bottom: 1rem;
    right: 1rem;
  }
}
</style>