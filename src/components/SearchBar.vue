<template>
  <div class="form-control">
    <input 
      type="text" 
      placeholder="Search" 
      class="input input-bordered w-24 md:w-auto cursor-pointer" 
      @focus="openVoiceSearch"
      @click="openVoiceSearch"
      readonly
    />
  </div>
</template>

<script setup lang="ts">
function openVoiceSearch() {
  // Dispatch custom event to open voice search modal
  window.dispatchEvent(new CustomEvent('openVoiceSearch'))
}
</script>