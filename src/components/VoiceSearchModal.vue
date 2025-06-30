<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-40">
      <!-- Background blur overlay - excludes header area -->
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <!-- Blur everything except header (top-20 = 5rem = 80px, which matches header height) -->
        <div class="fixed top-20 left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm" />
      </TransitionChild>

      <!-- Modal positioning - positioned below header with natural height -->
      <div class="fixed inset-0">
        <!-- Modal content positioned below header, FULL WIDTH with natural height -->
        <div class="absolute top-20 left-0 right-0">
          <TransitionChild
            enter="transform transition ease-in-out duration-500"
            enter-from="translate-y-full opacity-0"
            enter-to="translate-y-0 opacity-100"
            leave="transform transition ease-in-out duration-300"
            leave-from="translate-y-0 opacity-100"
            leave-to="translate-y-full opacity-0"
          >
            <DialogPanel class="w-full bg-base-100 shadow-2xl flex flex-col min-h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
              <!-- Header with close button -->
              <div class="flex-shrink-0 bg-base-100 border-b border-base-200 px-4 sm:px-6 py-4 shadow-sm">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="text-2xl">🎤</div>
                    <div>
                      <DialogTitle class="text-xl font-bold">Voice Product Search</DialogTitle>
                      <p class="text-sm text-base-content/70">
                        Say something like "Show me shoes under $50" or click a category below
                      </p>
                    </div>
                  </div>
                  <button @click="closeModal" class="btn btn-ghost btn-sm btn-circle">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Main content - FULL WIDTH, scrollable with better height management -->
              <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                <!-- Smart Category Tags from Vendure -->
                <div v-if="availableCategories.length > 0" class="text-center mb-8">
                  <div class="flex flex-wrap justify-center gap-2 mb-4">
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

                <!-- Fallback Input -->
                <div v-if="showFallbackInput" class="max-w-md mx-auto mb-8">
                  <div class="join w-full">
                    <input 
                      v-model="fallbackQuery"
                      type="text" 
                      placeholder="Type your search here..."
                      class="input input-bordered join-item flex-1"
                      @keyup.enter="handleFallbackSearch"
                    />
                    <button 
                      @click="handleFallbackSearch"
                      class="btn btn-primary join-item"
                      :disabled="!fallbackQuery.trim() || voiceState.isProcessing"
                    >
                      Search
                    </button>
                  </div>
                  <button 
                    @click="showFallbackInput = false" 
                    class="btn btn-ghost btn-sm mt-2"
                  >
                    Back to Voice Search
                  </button>
                </div>

                <!-- Voice Status with Enhanced Feedback -->
                <div class="text-center mb-8">
                  <div v-if="voiceState.isListening" class="flex flex-col items-center gap-3 text-primary">
                    <div class="relative">
                      <div class="loading loading-dots loading-lg"></div>
                      <div class="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                    </div>
                    <div class="flex flex-col items-center">
                      <span class="text-lg font-medium">Listening...</span>
                      <span class="text-sm text-base-content/60">Speak clearly into your microphone</span>
                      <button 
                        @click="stopListening" 
                        class="btn btn-sm btn-outline btn-error mt-2"
                      >
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
                      <button 
                        @click="stopSpeaking" 
                        class="btn btn-sm btn-outline btn-warning mt-2"
                      >
                        Stop Speaking
                      </button>
                    </div>
                  </div>
                  <div v-else-if="voiceState.transcript" class="text-base-content/70 max-w-md mx-auto">
                    <div class="bg-base-200 p-4 rounded-lg">
                      <span class="font-medium">You said:</span> 
                      <span class="italic">"{{ voiceState.transcript }}"</span>
                      <button 
                        @click="clearTranscript" 
                        class="btn btn-ghost btn-xs ml-2"
                      >
                        ✕
                      </button>
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
                    <button @click="retryVoiceSearch" class="btn btn-sm btn-ghost">
                      🔄 Retry
                    </button>
                    <button @click="showFallbackInput = true; clearError()" class="btn btn-sm btn-ghost">
                      ⌨️ Type Instead
                    </button>
                    <button @click="clearError" class="btn btn-sm btn-ghost">✕</button>
                  </div>
                </div>

                <!-- Products Grid - FULL WIDTH -->
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
                  <!-- Loading Shimmer -->
                  <div v-if="voiceState.isProcessing" v-for="n in 8" :key="`shimmer-${n}`" class="card bg-base-100 shadow-xl">
                    <div class="aspect-square bg-base-300 animate-shimmer"></div>
                    <div class="card-body p-3">
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
                    class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative"
                  >
                    <!-- Vendure Product Badge -->
                    <div class="absolute top-2 left-2 z-10 badge badge-success badge-sm">
                      <div class="w-1 h-1 bg-white rounded-full mr-1 animate-pulse"></div>
                      LIVE
                    </div>
                    
                    <figure class="aspect-square overflow-hidden">
                      <img 
                        :src="product.image" 
                        :alt="product.name"
                        class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        loading="lazy"
                      />
                    </figure>
                    <div class="card-body p-3 sm:p-4">
                      <h3 class="card-title text-sm sm:text-lg font-semibold">{{ product.name }}</h3>
                      <p class="text-xs sm:text-sm text-base-content/70 line-clamp-2 mb-2">
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
                        <span class="text-lg sm:text-2xl font-bold text-primary">${{ product.price }}</span>
                        <div class="flex items-center gap-2">
                          <div 
                            :class="[
                              'badge badge-xs sm:badge-sm',
                              product.inStock ? 'badge-success' : 'badge-error'
                            ]"
                          >
                            {{ product.inStock ? 'In Stock' : 'Out of Stock' }}
                          </div>
                        </div>
                      </div>
                      <div class="card-actions justify-end mt-4">
                        <button 
                          class="btn btn-primary btn-xs sm:btn-sm w-full"
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
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { VendureVoiceService } from '../services/vendureVoiceService'
import type { VendureProduct, VoiceState } from '../types/vendure'

// Services
const vendureVoiceService = new VendureVoiceService()

// Reactive state
const isOpen = ref(false)
const displayedProducts = ref<VendureProduct[]>([])
const availableCategories = ref<string[]>([])
const hasSearched = ref(false)
const showFallbackInput = ref(false)
const fallbackQuery = ref('')
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

// Event handlers
function handleOpenVoiceSearch() {
  isOpen.value = true
}

function closeModal() {
  // Stop any ongoing operations
  if (voiceState.isListening) {
    stopListening()
  }
  if (voiceState.isPlaying) {
    stopSpeaking()
  }
  
  isOpen.value = false
  
  // Reset state when modal closes
  hasSearched.value = false
  displayedProducts.value = []
  showFallbackInput.value = false
  fallbackQuery.value = ''
  currentResponse.value = ''
  voiceState.transcript = ''
  voiceState.error = null
}

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

async function handleFallbackSearch() {
  if (!fallbackQuery.value.trim()) return

  voiceState.transcript = fallbackQuery.value
  await processVoiceCommand(fallbackQuery.value)
  fallbackQuery.value = ''
  showFallbackInput.value = false
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

// Lifecycle
onMounted(() => {
  // Listen for voice search open events
  window.addEventListener('openVoiceSearch', handleOpenVoiceSearch)
})

onUnmounted(() => {
  // Clean up event listeners
  window.removeEventListener('openVoiceSearch', handleOpenVoiceSearch)
  
  // Clean up any ongoing operations
  if (voiceState.isListening) {
    stopListening()
  }
  if (voiceState.isPlaying) {
    stopSpeaking()
  }
})
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

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
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