import { graphqlClient } from '../lib/graphql-client'
import { GET_PRODUCTS } from '../queries/products'
import type { Product } from '../types/voice'

// Vendure product type mapping
interface VendureProduct {
  id: string
  name: string
  slug: string
  description: string
  featuredAsset?: {
    id: string
    preview: string
    source: string
  }
  variants: Array<{
    id: string
    name: string
    price: number
    priceWithTax: number
    currencyCode: string
    sku: string
    stockLevel: string
  }>
  collections: Array<{
    id: string
    name: string
    slug: string
  }>
}

interface VendureProductsResponse {
  products: {
    items: VendureProduct[]
    totalItems: number
  }
}

export class VendureService {
  // Fetch products from Vendure API
  async fetchProducts(limit: number = 10): Promise<Product[]> {
    try {
      const data: VendureProductsResponse = await graphqlClient.request(GET_PRODUCTS, {
        options: {
          take: limit,
          filter: {
            // Only get products that are enabled and have variants
          }
        }
      })

      return this.transformVendureProducts(data.products.items)
    } catch (error) {
      console.error('Failed to fetch Vendure products:', error)
      return []
    }
  }

  // Transform Vendure products to our Product interface
  private transformVendureProducts(vendureProducts: VendureProduct[]): Product[] {
    return vendureProducts.map(product => {
      // Get the first variant for pricing
      const firstVariant = product.variants[0]
      
      // Determine category from collections or product name - use actual Vendure data
      const category = this.determineCategory(product)
      
      // Check stock status
      const inStock = firstVariant?.stockLevel !== 'OUT_OF_STOCK'
      
      return {
        id: product.id,
        name: product.name, // Use actual Vendure product name
        price: firstVariant ? Math.round(firstVariant.priceWithTax / 100) : 0, // Convert from cents
        image: product.featuredAsset?.preview || this.getDefaultImage(category),
        description: product.description || `${product.name} - Premium quality footwear`, // Use actual description
        category: category, // Use determined category from Vendure data
        inStock: inStock
      }
    })
  }

  // Determine product category from collections or name - enhanced to use real Vendure data
  private determineCategory(product: VendureProduct): string {
    const name = product.name.toLowerCase()
    const collections = product.collections.map(c => c.name.toLowerCase())
    const allCollectionNames = product.collections.map(c => c.name).join(', ')
    
    console.log(`Product: ${product.name}, Collections: ${allCollectionNames}`)
    
    // Check collections first - use actual collection names from Vendure
    for (const collection of collections) {
      // Direct matches
      if (collection.includes('running') || collection.includes('runner')) return 'running'
      if (collection.includes('casual')) return 'casual'
      if (collection.includes('outdoor') || collection.includes('hiking')) return 'outdoor'
      if (collection.includes('athletic') || collection.includes('sport')) return 'athletic'
      if (collection.includes('walking') || collection.includes('walker')) return 'walking'
      if (collection.includes('basketball')) return 'basketball'
      if (collection.includes('training') || collection.includes('trainer')) return 'training'
      if (collection.includes('playground')) return 'playground'
      
      // Broader matches for common Vendure collection patterns
      if (collection.includes('footwear')) return 'casual'
      if (collection.includes('shoes')) return 'casual'
      if (collection.includes('sneakers')) return 'casual'
      if (collection.includes('boots')) return 'outdoor'
      if (collection.includes('sandals')) return 'casual'
    }
    
    // Check product name for category hints
    if (name.includes('running') || name.includes('runner')) return 'running'
    if (name.includes('casual')) return 'casual'
    if (name.includes('outdoor') || name.includes('hiking') || name.includes('boot')) return 'outdoor'
    if (name.includes('athletic') || name.includes('sport')) return 'athletic'
    if (name.includes('walking') || name.includes('walker')) return 'walking'
    if (name.includes('basketball')) return 'basketball'
    if (name.includes('training') || name.includes('trainer')) return 'training'
    if (name.includes('playground')) return 'playground'
    if (name.includes('sneaker')) return 'casual'
    if (name.includes('sandal')) return 'casual'
    
    // If we have collections but no matches, use the first collection name as category
    if (product.collections.length > 0) {
      const firstCollection = product.collections[0].name.toLowerCase()
      // Clean up collection name to be a valid category
      return firstCollection.replace(/[^a-z]/g, '') || 'casual'
    }
    
    // Default to casual if no specific category found
    return 'casual'
  }

  // Get default image based on category
  private getDefaultImage(category: string): string {
    const imageMap: Record<string, string> = {
      running: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      casual: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      outdoor: 'https://images.pexels.com/photos/1598506/pexels-photo-1598506.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      athletic: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      walking: 'https://images.pexels.com/photos/1598509/pexels-photo-1598509.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      basketball: 'https://images.pexels.com/photos/1598510/pexels-photo-1598510.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      training: 'https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1',
      playground: 'https://images.pexels.com/photos/1456737/pexels-photo-1456737.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'
    }
    
    return imageMap[category] || imageMap.casual
  }

  // Search Vendure products with filters
  async searchVendureProducts(searchTerm: string, limit: number = 5): Promise<Product[]> {
    try {
      const data: VendureProductsResponse = await graphqlClient.request(GET_PRODUCTS, {
        options: {
          take: limit,
          filter: {
            name: {
              contains: searchTerm
            }
          }
        }
      })

      return this.transformVendureProducts(data.products.items)
    } catch (error) {
      console.error('Failed to search Vendure products:', error)
      return []
    }
  }
}