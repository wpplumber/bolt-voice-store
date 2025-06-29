// Cart queries - temporarily simplified for build
export const ADD_ITEM_TO_ORDER = `
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
`

export const GET_ACTIVE_ORDER = `
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
`

export const REMOVE_ORDER_LINE = `
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
`

export const ADJUST_ORDER_LINE = `
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
`