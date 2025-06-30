<template>
  <div class="form-control">
    <input 
      type="text" 
      placeholder="Search" 
      class="input input-bordered w-24 md:w-auto" 
      @focus="openVoiceSearch"
      @click="openVoiceSearch"
      readonly
    />
  </div>
</template>

<script setup lang="ts">
// Emits
const emit = defineEmits<{
  openVoiceSearch: []
}>()

function openVoiceSearch() {
  emit('openVoiceSearch')
}
</script>