<template>
  <section class="py-16 container-custom">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold mb-4">🎤 Voice Product Search</h2>
        <p class="text-lg text-base-content/70 mb-6">
          Say something like "Show me shoes under $50" or "Find athletic footwear"
        </p>
        
        <!-- Smart Category Tags from Vendure -->
        <div v-if="availableCategories.length > 0" class="flex flex-wrap justify-center gap-2 mb-6">
          <span class="text-sm text-base-content/60 mr-2">Available categories:</span>
          <button 
            v-for="category in availableCategories.slice(0, 8)" 
            :key="category"
            @click="searchByCategory(category)"
            class="badge badge-outline hover:badge-primary cursor-pointer transition-colors"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Voice Status -->
      <div class="text-center mb-8">
        <div v-if="voiceState.isListening" class="flex flex-col items-center gap-3 text-primary">
          <div class="relative">
            <div class="loading loading-dots loading-lg"></div>
            <div class="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-lg font-medium">Listening...</span>
            <span class="text-sm text-base-content/60">Speak clearly into your microphone</span>
            <button @click="stopListening" class="btn btn-sm btn-outline btn-error mt-2">
              Stop Listening
            </button>
          </div>
        </div>
        <div v-else-if="voiceState.isProcessing" class="flex flex-col items-center gap-3 text-secondary">
          <div class="loading loading-spinner loading-lg"></div>
          <div class="flex flex-col items-center">
            <span class="text-lg font-medium">Searching...</span>
            <span class="text-sm text-base-content/60">Finding products in our store</span>
          </div>
        </div>
        <div v-else-if="voiceState.isPlaying" class="flex flex-col items-center gap-3 text-accent">
          <div class="loading loading-ring loading-lg"></div>
          <div class="flex flex-col items-center">
            <span class="text-lg font-medium">Speaking...</span>
            <span class="text-sm text-base-content/60">{{ currentResponse }}</span>
            <button @click="stopSpeaking" class="btn btn-sm btn-outline btn-warning mt-2">
              Stop Speaking
            </button>
          </div>
        </div>
        <div v-else-if="voiceState.transcript" class="text-base-content/70 max-w-md mx-auto">
          <div class="bg-base-200 p-4 rounded-lg">
            <span class="font-medium">You said:</span> 
            <span class="italic">"{{ voiceState.transcript }}"</span>
            <button @click="clearTranscript" class="btn btn-ghost btn-xs ml-2">✕</button>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="voiceState.error" class="alert alert-error max-w-md mx-auto mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <div class="font-bold">Voice Error</div>
          <div class="text-xs">{{ voiceState.error }}</div>
        </div>
        <div class="flex gap-2">
          <button @click="retryVoiceSearch" class="btn btn-sm btn-ghost">🔄 Retry</button>
          <button @click="clearError" class="btn btn-sm btn-ghost">✕</button>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <!-- Loading Shimmer -->
        <div v-if="voiceState.isProcessing" v-for="n in 8" :key="`shimmer-${n}`" class="card bg-base-100 shadow-xl">
          <div class="aspect-square bg-base-300 animate-shimmer"></div>
          <div class="card-body">
            <div class="h-4 bg-base-300 rounded animate-shimmer mb-2"></div>
            <div class="h-3 bg-base-300 rounded animate-shimmer mb-4 w-3/4"></div>
            <div class="h-8 bg-base-300 rounded animate-shimmer"></div>
          </div>
        </div>

        <!-- Product Cards -->
        <div 
          v-else
          v-for="product in displayedProducts" 
          :key="product.id"
          class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          <figure class="aspect-square overflow-hidden">
            <img 
              :src="product.image" 
              :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              loading="lazy"
            />
          </figure>
          <div class="card-body p-4">
            <h3 class="card-title text-lg font-semibold">{{ product.name }}</h3>
            <p class="text-sm text-base-content/70 line-clamp-2 mb-2">
              {{ product.description }}
            </p>
            <!-- Product Category Tags -->
            <div class="flex flex-wrap gap-1 mb-2">
              <span class="badge badge-primary badge-sm">{{ product.category }}</span>
              <span v-for="collection in product.collections" :key="collection" class="badge badge-outline badge-xs">
                {{ collection }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-2xl font-bold text-primary">${{ product.price }}</span>
              <div class="flex items-center gap-2">
                <div :class="['badge badge-sm', product.inStock ? 'badge-success' : 'badge-error']">
                  {{ product.inStock ? 'In Stock' : 'Out of Stock' }}
                </div>
              </div>
            </div>
            <div class="card-actions justify-end mt-4">
              <button 
                class="btn btn-primary btn-sm w-full"
                :disabled="!product.inStock"
                @click="addToCart(product)"
              >
                {{ product.inStock ? 'Add to Cart' : 'Unavailable' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-if="!voiceState.isProcessing && displayedProducts.length === 0 && hasSearched" class="text-center py-12">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-2xl font-semibold mb-2">No matches found</h3>
        <p class="text-base-content/70 mb-6">
          Try searching for one of our available categories or say "show me all products"
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button @click="startVoiceSearch" class="btn btn-primary">🎤 Try Voice Again</button>
          <button @click="showAllProducts" class="btn btn-outline">👀 Show All Products</button>
        </div>
      </div>

      <!-- Initial State -->
      <div v-if="!hasSearched && !voiceState.isProcessing && displayedProducts.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">👟</div>
        <h3 class="text-2xl font-semibold mb-2">Ready to help you find products!</h3>
        <p class="text-base-content/70 mb-6">
          Use voice search to find products from our store
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button @click="startVoiceSearch" class="btn btn-primary btn-lg">🎤 Start Voice Search</button>
          <button @click="showAllProducts" class="btn btn-outline">👀 Browse All Products</button>
        </div>
        
        <!-- Smart Example queries based on actual categories -->
        <div v-if="availableCategories.length > 0" class="mt-8 max-w-2xl mx-auto">
          <h4 class="text-lg font-semibold mb-4">Try saying:</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button 
              v-for="example in smartExampleQueries" 
              :key="example"
              @click="simulateVoiceQuery(example)"
              class="btn btn-ghost btn-sm text-left justify-start"
            >
              "{{ example }}"
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Voice Button -->
    <div class="fixed bottom-6 right-6 z-50">
      <div class="relative">
        <div v-if="voiceState.isListening" class="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
        <button 
          @click="toggleVoiceSearch"
          :disabled="voiceState.isProcessing"
          :class="[
            'btn btn-circle btn-lg shadow-lg transition-all duration-300 relative',
            voiceState.isListening ? 'btn-error animate-pulse-scale' : 'btn-primary hover:scale-110',
            voiceState.isProcessing ? 'btn-disabled' : ''
          ]"
          :title="getButtonTitle()"
        >
          <svg v-if="!voiceState.isListening && !voiceState.isProcessing" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <svg v-else-if="voiceState.isListening" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
          <div v-else class="loading loading-dots loading-sm"></div>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { VendureVoiceService } from '../services/vendureVoiceService'
import type { VendureProduct, VoiceState } from '../types/vendure'

// Services
const vendureVoiceService = new VendureVoiceService()

// Reactive state
const displayedProducts = ref<VendureProduct[]>([])
const availableCategories = ref<string[]>([])
const hasSearched = ref(false)
const currentResponse = ref('')

const voiceState = reactive<VoiceState>({
  isListening: false,
  isProcessing: false,
  isPlaying: false,
  transcript: '',
  error: null
})

// Smart example queries based on actual categories
const smartExampleQueries = computed(() => {
  const examples = []
  
  if (availableCategories.value.length > 0) {
    // Use first few actual categories
    const categories = availableCategories.value.slice(0, 3)
    examples.push(`show me ${categories[0]} products`)
    if (categories[1]) examples.push(`find ${categories[1]} under $100`)
    if (categories[2]) examples.push(`${categories[2]} in stock`)
  }
  
  // Add generic examples
  examples.push('show me all products')
  examples.push('products under $50')
  examples.push('what do you have in stock')
  
  return examples.slice(0, 6)
})

// Initialize
onMounted(async () => {
  await loadInitialData()
})

async function loadInitialData() {
  try {
    voiceState.isProcessing = true
    
    // Load available categories from Vendure
    availableCategories.value = await vendureVoiceService.getAvailableCategories()
    console.log('Available categories:', availableCategories.value)
    
    // Load initial products to show
    displayedProducts.value = await vendureVoiceService.getAllProducts(12)
    
  } catch (error) {
    console.error('Failed to load initial data:', error)
    voiceState.error = 'Failed to load products from store'
  } finally {
    voiceState.isProcessing = false
  }
}

// Voice search functionality
async function startVoiceSearch() {
  if (voiceState.isListening || voiceState.isProcessing) return

  try {
    voiceState.isListening = true
    voiceState.error = null
    voiceState.transcript = ''

    const transcript = await vendureVoiceService.startListening()
    voiceState.transcript = transcript
    voiceState.isListening = false

    if (transcript.trim()) {
      await processVoiceCommand(transcript)
    } else {
      voiceState.error = 'No speech detected. Please try again.'
    }
  } catch (error) {
    voiceState.isListening = false
    voiceState.error = error instanceof Error ? error.message : 'Voice recognition failed'
  }
}

function stopListening() {
  voiceState.isListening = false
}

function stopSpeaking() {
  voiceState.isPlaying = false
  currentResponse.value = ''
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}

function toggleVoiceSearch() {
  if (voiceState.isListening) {
    stopListening()
  } else if (voiceState.isPlaying) {
    stopSpeaking()
  } else {
    startVoiceSearch()
  }
}

async function processVoiceCommand(transcript: string) {
  try {
    voiceState.isProcessing = true
    hasSearched.value = true

    // Parse and search using Vendure service
    const results = await vendureVoiceService.searchProducts(transcript)
    displayedProducts.value = results

    voiceState.isProcessing = false

    // Generate and speak response
    const responseText = vendureVoiceService.generateResponseText(results, transcript)
    currentResponse.value = responseText
    await speakResponse(responseText)
  } catch (error) {
    voiceState.isProcessing = false
    voiceState.error = error instanceof Error ? error.message : 'Search failed'
  }
}

async function speakResponse(text: string) {
  try {
    voiceState.isPlaying = true
    await vendureVoiceService.speak(text)
  } catch (error) {
    console.error('TTS error:', error)
  } finally {
    voiceState.isPlaying = false
    currentResponse.value = ''
  }
}

async function simulateVoiceQuery(query: string) {
  voiceState.transcript = query
  await processVoiceCommand(query)
}

async function searchByCategory(category: string) {
  const query = `show me ${category} products`
  voiceState.transcript = query
  await processVoiceCommand(query)
}

async function showAllProducts() {
  const query = 'show me all products'
  voiceState.transcript = query
  await processVoiceCommand(query)
}

function retryVoiceSearch() {
  clearError()
  startVoiceSearch()
}

function addToCart(product: VendureProduct) {
  console.log('Adding to cart:', product)
  
  // Show success toast
  const toast = document.createElement('div')
  toast.className = 'toast toast-top toast-end'
  toast.innerHTML = `
    <div class="alert alert-success shadow-lg">
      <span>Added ${product.name} to cart!</span>
    </div>
  `
  document.body.appendChild(toast)
  
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast)
    }
  }, 3000)
}

function clearError() {
  voiceState.error = null
}

function clearTranscript() {
  voiceState.transcript = ''
}

function getButtonTitle(): string {
  if (voiceState.isListening) return 'Stop listening'
  if (voiceState.isProcessing) return 'Processing...'
  if (voiceState.isPlaying) return 'Stop speaking'
  return 'Start voice search'
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.aspect-square {
  aspect-ratio: 1 / 1;
}

@keyframes pulse-scale {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.animate-pulse-scale {
  animation: pulse-scale 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.animate-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
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
</style>