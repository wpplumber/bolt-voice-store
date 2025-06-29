<template>
  <section class="py-16 container-custom">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h2 class="text-4xl font-bold mb-4">🎤 Voice Product Search</h2>
        <p class="text-lg text-base-content/70 mb-6">
          Tap the microphone and say something like "Show me running shoes under $50"
        </p>
        
        <!-- Fallback Input -->
        <div v-if="showFallbackInput" class="max-w-md mx-auto mb-6">
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
            <span class="text-sm text-base-content/60">Finding the perfect shoes for you</span>
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

      <!-- Error Display with Better UX -->
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
            <div class="flex items-center justify-between">
              <span class="text-2xl font-bold text-primary">${{ product.price }}</span>
              <div class="flex items-center gap-2">
                <div 
                  :class="[
                    'badge badge-sm',
                    product.inStock ? 'badge-success' : 'badge-error'
                  ]"
                >
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
          Try saying something like "running shoes under $100" or "casual shoes for kids"
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button @click="startVoiceSearch" class="btn btn-primary">
            🎤 Try Voice Again
          </button>
          <button @click="showFallbackInput = true" class="btn btn-outline">
            ⌨️ Type Search
          </button>
        </div>
      </div>

      <!-- Initial State -->
      <div v-if="!hasSearched && !voiceState.isProcessing" class="text-center py-12">
        <div class="text-6xl mb-4">👟</div>
        <h3 class="text-2xl font-semibold mb-2">Ready to help you find shoes!</h3>
        <p class="text-base-content/70 mb-6">
          Use voice search to find the perfect baby shoes
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button @click="startVoiceSearch" class="btn btn-primary btn-lg">
            🎤 Start Voice Search
          </button>
          <button @click="showFallbackInput = true" class="btn btn-outline">
            ⌨️ Type Instead
          </button>
        </div>
        
        <!-- Example queries -->
        <div class="mt-8 max-w-2xl mx-auto">
          <h4 class="text-lg font-semibold mb-4">Try saying:</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button 
              v-for="example in exampleQueries" 
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

    <!-- Enhanced Floating Voice Button -->
    <div class="fixed bottom-6 right-6 z-50">
      <div class="relative">
        <!-- Pulse ring for listening state -->
        <div 
          v-if="voiceState.isListening" 
          class="absolute inset-0 bg-primary/30 rounded-full animate-ping"
        ></div>
        
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
        
        <!-- Status indicator -->
        <div 
          v-if="voiceState.isListening || voiceState.isProcessing" 
          class="absolute -top-2 -right-2 w-4 h-4 rounded-full"
          :class="voiceState.isListening ? 'bg-error animate-pulse' : 'bg-secondary'"
        ></div>
      </div>
    </div>

    <!-- Keyboard Shortcut Hint -->
    <div class="fixed bottom-6 left-6 z-40 hidden lg:block">
      <div class="tooltip tooltip-top" data-tip="Press Space to start voice search">
        <div class="badge badge-outline">
          <kbd class="kbd kbd-xs">Space</kbd>
        </div>
      </div>
    </div>

    <!-- Success Toast Container -->
    <div id="toast-container" class="toast toast-top toast-end"></div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { VoiceService } from '../services/voiceService'
import type { Product, VoiceState } from '../types/voice'

// Services
const voiceService = new VoiceService()

// Reactive state
const displayedProducts = ref<Product[]>([])
const hasSearched = ref(false)
const showFallbackInput = ref(false)
const fallbackQuery = ref('')
const currentResponse = ref('')
const isListeningActive = ref(false)

const voiceState = reactive<VoiceState>({
  isListening: false,
  isProcessing: false,
  isPlaying: false,
  transcript: '',
  error: null
})

// Example queries for better UX
const exampleQueries = [
  "running shoes under $50",
  "casual shoes for kids",
  "athletic shoes in stock",
  "outdoor shoes under $40"
]

// Enhanced voice search functionality
async function startVoiceSearch() {
  if (voiceState.isListening || voiceState.isProcessing) return

  try {
    voiceState.isListening = true
    voiceState.error = null
    voiceState.transcript = ''
    isListeningActive.value = true

    // Start listening with increased timeout (30 seconds)
    const transcript = await Promise.race([
      voiceService.startListening(),
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Listening timeout - please try again')), 30000)
      )
    ])

    voiceState.transcript = transcript
    voiceState.isListening = false
    isListeningActive.value = false

    if (transcript.trim()) {
      await processVoiceCommand(transcript)
    } else {
      voiceState.error = 'No speech detected. Please try again.'
    }
  } catch (error) {
    voiceState.isListening = false
    isListeningActive.value = false
    voiceState.error = error instanceof Error ? error.message : 'Voice recognition failed'
    console.error('Voice search error:', error)
  }
}

// Stop listening functionality
function stopListening() {
  voiceState.isListening = false
  isListeningActive.value = false
  // The actual stopping would be handled by the voice service
}

// Stop speaking functionality
function stopSpeaking() {
  voiceState.isPlaying = false
  currentResponse.value = ''
  // Stop any ongoing speech synthesis
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}

// Toggle voice search (start/stop)
function toggleVoiceSearch() {
  if (voiceState.isListening) {
    stopListening()
  } else if (voiceState.isPlaying) {
    stopSpeaking()
  } else {
    startVoiceSearch()
  }
}

// Process voice command with better error handling
async function processVoiceCommand(transcript: string) {
  try {
    voiceState.isProcessing = true
    hasSearched.value = true

    // Parse the voice command
    const filters = voiceService.parseVoiceCommand(transcript)
    
    // Simulate API delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Search products
    const results = voiceService.searchProducts(filters)
    displayedProducts.value = results

    voiceState.isProcessing = false

    // Generate and speak response
    const responseText = voiceService.generateResponseText(results, filters)
    currentResponse.value = responseText
    await speakResponse(responseText)
  } catch (error) {
    voiceState.isProcessing = false
    voiceState.error = error instanceof Error ? error.message : 'Search failed'
    console.error('Voice command processing error:', error)
  }
}

// Enhanced speak response with better error handling
async function speakResponse(text: string) {
  try {
    voiceState.isPlaying = true
    await voiceService.speak(text)
  } catch (error) {
    console.error('TTS error:', error)
  } finally {
    voiceState.isPlaying = false
    currentResponse.value = ''
  }
}

// Fallback text search
async function handleFallbackSearch() {
  if (!fallbackQuery.value.trim()) return

  voiceState.transcript = fallbackQuery.value
  await processVoiceCommand(fallbackQuery.value)
  fallbackQuery.value = ''
  showFallbackInput.value = false
}

// Simulate voice query for examples
async function simulateVoiceQuery(query: string) {
  voiceState.transcript = query
  await processVoiceCommand(query)
}

// Retry voice search
function retryVoiceSearch() {
  clearError()
  startVoiceSearch()
}

// Enhanced add to cart with better feedback
function addToCart(product: Product) {
  console.log('Adding to cart:', product)
  
  // Create and show success toast
  const toastContainer = document.getElementById('toast-container')
  if (toastContainer) {
    const toast = document.createElement('div')
    toast.className = 'alert alert-success shadow-lg mb-2'
    toast.innerHTML = `
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Added ${product.name} to cart!</span>
      </div>
    `
    toastContainer.appendChild(toast)
    
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast)
      }
    }, 3000)
  }
}

// Clear error
function clearError() {
  voiceState.error = null
}

// Clear transcript
function clearTranscript() {
  voiceState.transcript = ''
}

// Get button title for accessibility
function getButtonTitle(): string {
  if (voiceState.isListening) return 'Stop listening'
  if (voiceState.isProcessing) return 'Processing...'
  if (voiceState.isPlaying) return 'Stop speaking'
  return 'Start voice search'
}

// Enhanced keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  // Only trigger if not typing in an input
  if (event.target && (event.target as HTMLElement).matches('input, textarea')) {
    return
  }

  if (event.code === 'Space') {
    event.preventDefault()
    toggleVoiceSearch()
  } else if (event.code === 'Escape') {
    if (voiceState.isListening) {
      stopListening()
    } else if (voiceState.isPlaying) {
      stopSpeaking()
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
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

/* Enhanced pulse animation for listening state */
@keyframes pulse-scale {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.animate-pulse-scale {
  animation: pulse-scale 1.5s infinite;
}

/* Floating button hover effect */
.btn-circle:hover:not(:disabled) {
  transform: scale(1.1);
}

/* Enhanced shimmer animation for loading states */
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

/* Toast positioning */
.toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .fixed.bottom-6.right-6 {
    bottom: 1rem;
    right: 1rem;
  }
  
  .fixed.bottom-6.left-6 {
    bottom: 1rem;
    left: 1rem;
  }
}

/* Enhanced visual feedback */
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