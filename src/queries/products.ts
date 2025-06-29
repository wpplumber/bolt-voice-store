import { graphql } from '../gql'

// Query to get all products
export const GET_PRODUCTS = graphql(`
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
`)

// Query to get a single product by slug
export const GET_PRODUCT_BY_SLUG = graphql(`
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
`)

// Query to get collections
export const GET_COLLECTIONS = graphql(`
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
`)