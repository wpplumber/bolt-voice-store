<template>
  <section class="py-16 container-custom">
    <h2 class="text-3xl font-bold text-center mb-12">Our Collections</h2>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="loading loading-spinner loading-lg text-primary"></div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error max-w-md mx-auto">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Failed to load collections: {{ error }}</span>
    </div>
    
    <!-- Collections Grid -->
    <div v-else-if="collections.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div 
        v-for="collection in collections" 
        :key="collection.id"
        class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
      >
        <figure class="aspect-square overflow-hidden">
          <img 
            :src="collection.featuredAsset?.preview || 'https://images.pexels.com/photos/1619801/pexels-photo-1619801.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'" 
            :alt="collection.name"
            class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            loading="lazy"
          />
        </figure>
        <div class="card-body p-4">
          <h3 class="card-title text-lg font-semibold">{{ collection.name }}</h3>
          <p v-if="collection.description" class="text-sm text-base-content/70 line-clamp-2">
            {{ collection.description }}
          </p>
          <div class="flex items-center justify-between mt-4">
            <span class="text-sm text-base-content/60">
              {{ collection.productVariants?.totalItems || 0 }} {{ (collection.productVariants?.totalItems || 0) === 1 ? 'item' : 'items' }}
            </span>
            <a 
              :href="`/collections/${collection.slug}`" 
              class="btn btn-primary btn-sm"
            >
              Shop Now
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-6xl mb-4">🛍️</div>
      <h3 class="text-xl font-semibold mb-2">No Collections Found</h3>
      <p class="text-base-content/70">Collections will appear here once they're available.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { graphqlClient } from '../lib/graphql-client'
import { GET_COLLECTIONS } from '../queries/products'

// Define types locally to avoid build issues
interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  featuredAsset?: {
    id: string
    preview: string
    source: string
  }
  productVariants?: {
    totalItems: number
  }
}

// Reactive state
const collections = ref<Collection[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Fetch collections from Vendure
async function fetchCollections() {
  try {
    isLoading.value = true
    error.value = null
    
    const data = await graphqlClient.request(GET_COLLECTIONS, {
      options: {
        take: 12 // Limit to 12 collections
      }
    })
    
    collections.value = data.collections.items
  } catch (err) {
    console.error('Failed to fetch collections:', err)
    error.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    isLoading.value = false
  }
}

// Fetch collections on component mount
onMounted(() => {
  fetchCollections()
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
</style>