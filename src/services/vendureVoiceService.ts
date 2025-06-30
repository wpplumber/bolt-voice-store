import { graphqlClient } from '../lib/graphql-client'
import { GET_PRODUCTS, GET_COLLECTIONS } from '../queries/products'
import type { VendureProduct } from '../types/vendure'

// ElevenLabs configuration
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || 'sk_e12eba04d713558258f4e1189aa22c5e03cf27df68b8e92d'
const ELEVENLABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

interface VendureProductResponse {
  id: string
  name: string
  slug: string
  description: string
  featuredAsset?: {
    preview: string
  }
  variants: Array<{
    id: string
    price: number
    priceWithTax: number
    stockLevel: string
  }>
  collections: Array<{
    name: string
    slug: string
  }>
}

interface VendureCollectionResponse {
  id: string
  name: string
  slug: string
  description?: string
}

export class VendureVoiceService {
  private cachedProducts: VendureProduct[] = []
  private cachedCategories: string[] = []

  // Speech-to-Text using Web Speech API
  async startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          resolve(transcript)
        }

        recognition.onerror = (event: any) => {
          reject(new Error(`Speech recognition error: ${event.error}`))
        }

        recognition.start()
      } else {
        reject(new Error('Speech recognition not supported'))
      }
    })
  }

  // Text-to-Speech using ElevenLabs with Web Speech fallback
  async speak(text: string): Promise<void> {
    try {
      const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        return new Promise((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            resolve()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            this.fallbackSpeak(text).then(resolve)
          }
          audio.play().catch(() => {
            URL.revokeObjectURL(audioUrl)
            this.fallbackSpeak(text).then(resolve)
          })
        })
      } else {
        return this.fallbackSpeak(text)
      }
    } catch (error) {
      return this.fallbackSpeak(text)
    }
  }

  private async fallbackSpeak(text: string): Promise<void> {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      return new Promise((resolve) => {
        utterance.onend = () => resolve()
        utterance.onerror = () => resolve()
        speechSynthesis.speak(utterance)
      })
    }
  }

  // Get available categories from Vendure Collections
  async getAvailableCategories(): Promise<string[]> {
    if (this.cachedCategories.length > 0) {
      return this.cachedCategories
    }

    try {
      const data = await graphqlClient.request(GET_COLLECTIONS, {
        options: { take: 20 }
      })

      const collections: VendureCollectionResponse[] = data.collections.items
      
      // Extract meaningful categories from collection names
      const categories = collections
        .map(collection => this.normalizeCategory(collection.name))
        .filter(category => category && category.length > 2) // Filter out very short names
        .filter((category, index, arr) => arr.indexOf(category) === index) // Remove duplicates

      this.cachedCategories = categories
      return categories
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      return []
    }
  }

  // Get all products from Vendure
  async getAllProducts(limit: number = 20): Promise<VendureProduct[]> {
    try {
      const data = await graphqlClient.request(GET_PRODUCTS, {
        options: { take: limit }
      })

      const products = this.transformProducts(data.products.items)
      this.cachedProducts = products
      return products
    } catch (error) {
      console.error('Failed to fetch products:', error)
      return []
    }
  }

  // Smart search products based on voice input
  async searchProducts(transcript: string): Promise<VendureProduct[]> {
    const lowerTranscript = transcript.toLowerCase()
    
    // If asking for all products
    if (lowerTranscript.includes('all products') || lowerTranscript.includes('everything') || lowerTranscript.includes('show me what you have')) {
      return this.getAllProducts(20)
    }

    // Extract search criteria
    const searchCriteria = this.parseSearchCriteria(lowerTranscript)
    
    try {
      // Search in Vendure with filters
      const searchOptions: any = {
        take: 20
      }

      // Add text search if we have keywords
      if (searchCriteria.keywords.length > 0) {
        searchOptions.filter = {
          name: {
            contains: searchCriteria.keywords[0] // Use first keyword for Vendure search
          }
        }
      }

      const data = await graphqlClient.request(GET_PRODUCTS, searchOptions)
      let results = this.transformProducts(data.products.items)

      // Apply additional client-side filtering
      results = this.applyClientFilters(results, searchCriteria)

      return results
    } catch (error) {
      console.error('Search failed:', error)
      // Fallback to cached products with client-side filtering
      return this.applyClientFilters(this.cachedProducts, searchCriteria)
    }
  }

  // Parse search criteria from voice transcript
  private parseSearchCriteria(transcript: string) {
    const criteria = {
      keywords: [] as string[],
      categories: [] as string[],
      maxPrice: null as number | null,
      minPrice: null as number | null,
      inStock: false
    }

    // Extract price ranges
    const priceMatch = transcript.match(/under \$?(\d+)|below \$?(\d+)|less than \$?(\d+)/)
    if (priceMatch) {
      criteria.maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3])
    }

    const minPriceMatch = transcript.match(/over \$?(\d+)|above \$?(\d+)|more than \$?(\d+)/)
    if (minPriceMatch) {
      criteria.minPrice = parseInt(minPriceMatch[1] || minPriceMatch[2] || minPriceMatch[3])
    }

    // Check for stock requirement
    if (transcript.includes('in stock') || transcript.includes('available')) {
      criteria.inStock = true
    }

    // Extract categories from available categories
    for (const category of this.cachedCategories) {
      if (transcript.includes(category.toLowerCase())) {
        criteria.categories.push(category)
      }
    }

    // Extract general keywords
    const commonKeywords = ['shoes', 'footwear', 'sneakers', 'boots', 'sandals', 'athletic', 'casual', 'running', 'walking']
    for (const keyword of commonKeywords) {
      if (transcript.includes(keyword)) {
        criteria.keywords.push(keyword)
      }
    }

    return criteria
  }

  // Apply client-side filters to results
  private applyClientFilters(products: VendureProduct[], criteria: any): VendureProduct[] {
    let filtered = [...products]

    // Filter by price
    if (criteria.maxPrice) {
      filtered = filtered.filter(p => p.price <= criteria.maxPrice)
    }
    if (criteria.minPrice) {
      filtered = filtered.filter(p => p.price >= criteria.minPrice)
    }

    // Filter by stock
    if (criteria.inStock) {
      filtered = filtered.filter(p => p.inStock)
    }

    // Filter by categories
    if (criteria.categories.length > 0) {
      filtered = filtered.filter(p => 
        criteria.categories.some((cat: string) => 
          p.category.toLowerCase().includes(cat.toLowerCase()) ||
          p.collections.some(col => col.toLowerCase().includes(cat.toLowerCase()))
        )
      )
    }

    // Filter by keywords (search in name and description)
    if (criteria.keywords.length > 0) {
      filtered = filtered.filter(p => {
        const searchText = `${p.name} ${p.description} ${p.category}`.toLowerCase()
        return criteria.keywords.some((keyword: string) => searchText.includes(keyword.toLowerCase()))
      })
    }

    // Sort by relevance (in stock first, then by price)
    filtered.sort((a, b) => {
      if (a.inStock && !b.inStock) return -1
      if (!a.inStock && b.inStock) return 1
      return a.price - b.price
    })

    return filtered
  }

  // Transform Vendure products to our format
  private transformProducts(vendureProducts: VendureProductResponse[]): VendureProduct[] {
    return vendureProducts.map(product => {
      const firstVariant = product.variants[0]
      const price = firstVariant ? Math.round(firstVariant.priceWithTax / 100) : 0
      const inStock = firstVariant?.stockLevel !== 'OUT_OF_STOCK'
      
      // Determine category from collections
      const category = this.determineProductCategory(product)
      const collections = product.collections.map(c => c.name)

      return {
        id: product.id,
        name: product.name,
        price,
        image: product.featuredAsset?.preview || this.getDefaultImage(category),
        description: product.description || `${product.name} - Premium quality product`,
        category,
        collections,
        inStock
      }
    })
  }

  // Determine product category from collections or name
  private determineProductCategory(product: VendureProductResponse): string {
    const collections = product.collections.map(c => c.name.toLowerCase())
    const name = product.name.toLowerCase()

    // Check collections first
    for (const collection of collections) {
      const normalized = this.normalizeCategory(collection)
      if (normalized) return normalized
    }

    // Check product name
    if (name.includes('shoe') || name.includes('sneaker')) return 'footwear'
    if (name.includes('boot')) return 'boots'
    if (name.includes('sandal')) return 'sandals'
    if (name.includes('athletic') || name.includes('sport')) return 'athletic'
    if (name.includes('casual')) return 'casual'
    if (name.includes('running')) return 'running'

    // Use first collection name if available
    if (product.collections.length > 0) {
      return this.normalizeCategory(product.collections[0].name) || 'products'
    }

    return 'products'
  }

  // Normalize category names
  private normalizeCategory(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
  }

  // Get default image for category
  private getDefaultImage(category: string): string {
    const imageMap: Record<string, string> = {
      footwear: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      athletic: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      casual: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      running: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      boots: 'https://images.pexels.com/photos/1598506/pexels-photo-1598506.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'
    }
    
    return imageMap[category] || imageMap.footwear
  }

  // Generate response text for TTS
  generateResponseText(products: VendureProduct[], transcript: string): string {
    const count = products.length

    if (count === 0) {
      return "I couldn't find any products matching your search. Try asking for 'all products' or one of our available categories."
    }

    let response = `Found ${count} product${count === 1 ? '' : 's'} in our store. `

    if (count <= 3) {
      const productNames = products.slice(0, 3).map(p => `${p.name} for $${p.price}`).join(', ')
      response += `Here they are: ${productNames}.`
    } else {
      const minPrice = Math.min(...products.map(p => p.price))
      const maxPrice = Math.max(...products.map(p => p.price))
      response += `Prices range from $${minPrice} to $${maxPrice}. `
      
      const topProducts = products.slice(0, 2)
      response += `Top picks are ${topProducts.map(p => `${p.name} for $${p.price}`).join(' and ')}.`
    }

    return response
  }
}