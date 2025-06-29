import { atom } from 'nanostores'
import { graphqlClient } from '../lib/graphql-client'
import { GET_ACTIVE_ORDER, ADD_ITEM_TO_ORDER, REMOVE_ORDER_LINE, ADJUST_ORDER_LINE } from '../queries/cart'

// Store for the active order (cart)
export const activeOrder = atom(null)
export const isLoading = atom(false)
export const error = atom(null)

// Fetch active order
export async function fetchActiveOrder() {
  try {
    isLoading.set(true)
    error.set(null)
    
    const data = await graphqlClient.request(GET_ACTIVE_ORDER)
    activeOrder.set(data.activeOrder)
  } catch (err) {
    console.error('Failed to fetch active order:', err)
    error.set(err.message)
  } finally {
    isLoading.set(false)
  }
}

// Add item to cart
export async function addToCart(productVariantId, quantity = 1) {
  try {
    isLoading.set(true)
    error.set(null)
    
    const data = await graphqlClient.request(ADD_ITEM_TO_ORDER, {
      productVariantId,
      quantity
    })
    
    if (data.addItemToOrder.__typename === 'Order') {
      activeOrder.set(data.addItemToOrder)
    } else {
      error.set(data.addItemToOrder.message)
    }
  } catch (err) {
    console.error('Failed to add item to cart:', err)
    error.set(err.message)
  } finally {
    isLoading.set(false)
  }
}

// Remove item from cart
export async function removeFromCart(orderLineId) {
  try {
    isLoading.set(true)
    error.set(null)
    
    const data = await graphqlClient.request(REMOVE_ORDER_LINE, {
      orderLineId
    })
    
    if (data.removeOrderLine.__typename === 'Order') {
      activeOrder.set(data.removeOrderLine)
    } else {
      error.set(data.removeOrderLine.message)
    }
  } catch (err) {
    console.error('Failed to remove item from cart:', err)
    error.set(err.message)
  } finally {
    isLoading.set(false)
  }
}

// Adjust item quantity in cart
export async function adjustCartItemQuantity(orderLineId, quantity) {
  try {
    isLoading.set(true)
    error.set(null)
    
    const data = await graphqlClient.request(ADJUST_ORDER_LINE, {
      orderLineId,
      quantity
    })
    
    if (data.adjustOrderLine.__typename === 'Order') {
      activeOrder.set(data.adjustOrderLine)
    } else {
      error.set(data.adjustOrderLine.message)
    }
  } catch (err) {
    console.error('Failed to adjust item quantity:', err)
    error.set(err.message)
  } finally {
    isLoading.set(false)
  }
}