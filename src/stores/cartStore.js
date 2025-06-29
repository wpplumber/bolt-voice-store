import { atom } from 'nanostores';

export const isCartOpen = atom(false);
export const cartItems = atom([]);

export function addToCart(product) {
  cartItems.set([...cartItems.get(), product]);
}

export function removeFromCart(productId) {
  cartItems.set(cartItems.get().filter(item => item.id !== productId));
}

export function toggleCart() {
  isCartOpen.set(!isCartOpen.get());
}