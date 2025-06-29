// Products queries - temporarily simplified for build
export const GET_PRODUCTS = `
  query GetProducts($options: ProductListOptions) {
    products(options: $options) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
          source
        }
        variants {
          id
          name
          price
          priceWithTax
          currencyCode
          sku
          stockLevel
        }
        collections {
          id
          name
          slug
        }
      }
      totalItems
    }
  }
`

export const GET_PRODUCT_BY_SLUG = `
  query GetProductBySlug($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
        source
      }
      assets {
        id
        preview
        source
      }
      variants {
        id
        name
        price
        priceWithTax
        currencyCode
        sku
        stockLevel
        options {
          id
          name
          code
        }
      }
      collections {
        id
        name
        slug
      }
    }
  }
`

export const GET_COLLECTIONS = `
  query GetCollections($options: CollectionListOptions) {
    collections(options: $options) {
      items {
        id
        name
        slug
        description
        featuredAsset {
          id
          preview
          source
        }
        productVariants {
          totalItems
        }
      }
      totalItems
    }
  }
`