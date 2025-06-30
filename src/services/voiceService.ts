import type { Product, SearchFilters } from '../types/voice'
import { mockProducts } from '../data/mockProducts'
import { VendureService } from './vendureService'

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || 'sk_e12eba04d713558258f4e1189aa22c5e03cf27df68b8e92d'
const ELEVENLABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // Adam - popular male voice
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'

export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private vendureService: VendureService
  private vendureProducts: Product[] = []

  constructor() {
    this.vendureService = new VendureService()
    this.initializeVendureProducts()
  }

  // Initialize Vendure products cache
  private async initializeVendureProducts() {
    try {
      this.vendureProducts = await this.vendureService.fetchProducts(5) // Fetch top 5
      console.log('Loaded Vendure products:', this.vendureProducts.length)
    } catch (error) {
      console.error('Failed to initialize Vendure products:', error)
    }
  }

  // Get combined products (mock + Vendure)
  private getCombinedProducts(): Product[] {
    // Combine mock products with Vendure products
    // Add a prefix to Vendure product IDs to avoid conflicts
    const vendureProductsWithPrefix = this.vendureProducts.map(product => ({
      ...product,
      id: `vendure-${product.id}`,
      name: `${product.name} (Live)` // Add indicator for Vendure products
    }))

    return [...mockProducts, ...vendureProductsWithPrefix]
  }

  // Speech-to-Text using Web Speech API (primary) with ElevenLabs fallback
  async startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Try Web Speech API first (more reliable and free)
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
          console.error('Speech recognition error:', event.error)
          // Fallback to microphone recording for ElevenLabs
          this.startRecording().then(resolve).catch(reject)
        }

        recognition.onend = () => {
          // Recognition ended normally
        }

        try {
          recognition.start()
        } catch (error) {
          // Fallback to recording
          this.startRecording().then(resolve).catch(reject)
        }
      } else {
        // No Web Speech API support, use microphone recording
        this.startRecording().then(resolve).catch(reject)
      }
    })
  }

  // Record audio for ElevenLabs Speech-to-Text
  private async startRecording(): Promise<string> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      return new Promise((resolve, reject) => {
        this.audioChunks = []
        this.mediaRecorder = new MediaRecorder(stream)

        this.mediaRecorder.ondataavailable = (event) => {
          this.audioChunks.push(event.data)
        }

        this.mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
          
          try {
            const transcript = await this.transcribeWithElevenLabs(audioBlob)
            resolve(transcript)
          } catch (error) {
            reject(error)
          }
          
          // Clean up
          stream.getTracks().forEach(track => track.stop())
        }

        this.mediaRecorder.onerror = () => {
          reject(new Error('Recording failed'))
        }

        // Start recording
        this.mediaRecorder.start()

        // Auto-stop after 10 seconds
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop()
          }
        }, 10000)
      })
    } catch (error) {
      throw new Error('Microphone access denied')
    }
  }

  // Transcribe audio using ElevenLabs Speech-to-Text
  private async transcribeWithElevenLabs(audioBlob: Blob): Promise<string> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')
    formData.append('model_id', 'whisper-1')

    const response = await fetch(`${ELEVENLABS_BASE_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Speech-to-text failed')
    }

    const result = await response.json()
    return result.text || ''
  }

  // Text-to-Speech using ElevenLabs API
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
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      })

      if (!response.ok) {
        console.error('ElevenLabs TTS failed, falling back to Web Speech API')
        return this.fallbackSpeak(text)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          resolve()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          // Fallback to Web Speech API
          this.fallbackSpeak(text).then(resolve).catch(reject)
        }
        audio.play().catch(() => {
          URL.revokeObjectURL(audioUrl)
          this.fallbackSpeak(text).then(resolve).catch(reject)
        })
      })
    } catch (error) {
      console.error('ElevenLabs TTS error:', error)
      return this.fallbackSpeak(text)
    }
  }

  // Fallback TTS using Web Speech API
  private async fallbackSpeak(text: string): Promise<void> {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      // Try to use a natural voice
      const voices = speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.startsWith('en')
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
      
      return new Promise((resolve) => {
        utterance.onend = () => resolve()
        utterance.onerror = () => resolve() // Don't fail on TTS errors
        speechSynthesis.speak(utterance)
      })
    }
  }

  // Parse voice command and extract search filters
  parseVoiceCommand(transcript: string): SearchFilters {
    const lowerTranscript = transcript.toLowerCase()
    const filters: SearchFilters = {}

    // Extract price range
    const priceMatch = lowerTranscript.match(/under \$?(\d+)|below \$?(\d+)|less than \$?(\d+)/)
    if (priceMatch) {
      filters.maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3])
    }

    const minPriceMatch = lowerTranscript.match(/over \$?(\d+)|above \$?(\d+)|more than \$?(\d+)/)
    if (minPriceMatch) {
      filters.minPrice = parseInt(minPriceMatch[1] || minPriceMatch[2] || minPriceMatch[3])
    }

    const rangeMatch = lowerTranscript.match(/between \$?(\d+) and \$?(\d+)/)
    if (rangeMatch) {
      filters.minPrice = parseInt(rangeMatch[1])
      filters.maxPrice = parseInt(rangeMatch[2])
    }

    // Extract category
    const categories = ['running', 'casual', 'outdoor', 'athletic', 'walking', 'basketball', 'playground', 'training']
    for (const category of categories) {
      if (lowerTranscript.includes(category)) {
        filters.category = category
        break
      }
    }

    // Extract keywords
    const keywords = []
    if (lowerTranscript.includes('shoes') || lowerTranscript.includes('sneakers')) {
      keywords.push('shoes')
    }
    if (lowerTranscript.includes('kids') || lowerTranscript.includes('children') || lowerTranscript.includes('baby')) {
      keywords.push('kids')
    }
    if (lowerTranscript.includes('toddler')) {
      keywords.push('toddler')
    }

    if (keywords.length > 0) {
      filters.keywords = keywords
    }

    // Check for in-stock requirement
    if (lowerTranscript.includes('in stock') || lowerTranscript.includes('available')) {
      filters.inStock = true
    }

    return filters
  }

  // Search products based on filters (now includes Vendure products)
  searchProducts(filters: SearchFilters): Product[] {
    let results = this.getCombinedProducts()

    // Filter by price range
    if (filters.maxPrice) {
      results = results.filter(product => product.price <= filters.maxPrice!)
    }
    if (filters.minPrice) {
      results = results.filter(product => product.price >= filters.minPrice!)
    }

    // Filter by category
    if (filters.category) {
      results = results.filter(product => product.category === filters.category)
    }

    // Filter by stock status
    if (filters.inStock) {
      results = results.filter(product => product.inStock)
    }

    // Filter by keywords (basic text search)
    if (filters.keywords && filters.keywords.length > 0) {
      results = results.filter(product => {
        const searchText = `${product.name} ${product.description} ${product.category}`.toLowerCase()
        return filters.keywords!.some(keyword => searchText.includes(keyword.toLowerCase()))
      })
    }

    // Sort by relevance (Vendure products first, then in stock, then by price)
    results.sort((a, b) => {
      // Prioritize Vendure products
      const aIsVendure = a.id.startsWith('vendure-')
      const bIsVendure = b.id.startsWith('vendure-')
      
      if (aIsVendure && !bIsVendure) return -1
      if (!aIsVendure && bIsVendure) return 1
      
      // Then by stock status
      if (a.inStock && !b.inStock) return -1
      if (!a.inStock && b.inStock) return 1
      
      // Finally by price
      return a.price - b.price
    })

    return results
  }

  // Generate response text for TTS (updated to mention Vendure products)
  generateResponseText(products: Product[], filters: SearchFilters): string {
    if (products.length === 0) {
      const suggestions = [
        "running shoes under 50 dollars",
        "casual shoes for kids",
        "athletic shoes in stock"
      ]
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
      return `I couldn't find any shoes matching your criteria. Try asking for something like '${randomSuggestion}'.`
    }

    const count = products.length
    const vendureCount = products.filter(p => p.id.startsWith('vendure-')).length
    const priceRange = filters.maxPrice ? ` under $${filters.maxPrice}` : ''
    const category = filters.category ? ` ${filters.category}` : ''
    
    let response = `Found ${count} ${category} shoe${count === 1 ? '' : 's'}${priceRange}. `
    
    if (vendureCount > 0) {
      response += `Including ${vendureCount} live product${vendureCount === 1 ? '' : 's'} from our store. `
    }
    
    if (count <= 3) {
      const productNames = products.slice(0, 3).map(p => {
        const isLive = p.id.startsWith('vendure-')
        return `${p.name.replace(' (Live)', '')} for $${p.price}${isLive ? ' from our live inventory' : ''}`
      }).join(', ')
      response += `Here they are: ${productNames}.`
    } else {
      const minPrice = Math.min(...products.map(p => p.price))
      const maxPrice = Math.max(...products.map(p => p.price))
      response += `The prices range from $${minPrice} to $${maxPrice}. `
      
      // Mention top 2 products
      const topProducts = products.slice(0, 2)
      response += `Top picks are ${topProducts.map(p => {
        const isLive = p.id.startsWith('vendure-')
        return `${p.name.replace(' (Live)', '')} for $${p.price}${isLive ? ' from live inventory' : ''}`
      }).join(' and ')}.`
    }

    return response
  }

  // Refresh Vendure products cache
  async refreshVendureProducts(): Promise<void> {
    await this.initializeVendureProducts()
  }

  // Get current Vendure products count
  getVendureProductsCount(): number {
    return this.vendureProducts.length
  }
}