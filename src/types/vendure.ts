export interface VendureProduct {
  id: string
  name: string
  price: number
  image: string
  description: string
  category: string
  collections: string[]
  inStock: boolean
}

export interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  isPlaying: boolean
  transcript: string
  error: string | null
}

export interface SearchFilters {
  maxPrice?: number
  minPrice?: number
  categories?: string[]
  keywords?: string[]
  inStock?: boolean
}