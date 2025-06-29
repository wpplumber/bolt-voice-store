import { graphql } from '../gql'

// Add item to cart
export const ADD_ITEM_TO_ORDER = graphql(`
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
        id
        code
        state
        totalWithTax
        currencyCode
        lines {
          id
          quantity
          productVariant {
            id
            name
            price
            priceWithTax
            product {
              name
              slug
              featuredAsset {
                preview
              }
            }
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`)

// Get active order (cart)
export const GET_ACTIVE_ORDER = graphql(`
  query GetActiveOrder {
    activeOrder {
      id
      code
      state
      totalWithTax
      currencyCode
      lines {
        id
        quantity
        productVariant {
          id
          name
          price
          priceWithTax
          product {
            name
            slug
            featuredAsset {
              preview
            }
          }
        }
      }
    }
  }
`)

// Remove item from cart
export const REMOVE_ORDER_LINE = graphql(`
  mutation RemoveOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
        id
        code
        state
        totalWithTax
        currencyCode
        lines {
          id
          quantity
          productVariant {
            id
            name
            price
            priceWithTax
            product {
              name
              slug
              featuredAsset {
                preview
              }
            }
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`)

// Adjust order line quantity
export const ADJUST_ORDER_LINE = graphql(`
  mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ... on Order {
        id
        code
        state
        totalWithTax
        currencyCode
        lines {
          id
          quantity
          productVariant {
            id
            name
            price
            priceWithTax
            product {
              name
              slug
              featuredAsset {
                preview
              }
            }
          }
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`)