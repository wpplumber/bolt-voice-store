<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="toggleCart" class="relative z-50">
      <TransitionChild
        enter="ease-in-out duration-500"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in-out duration-500"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-40" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <TransitionChild
              enter="transform transition ease-in-out duration-500"
              enter-from="translate-x-full"
              enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-500"
              leave-from="translate-x-0"
              leave-to="translate-x-full"
            >
              <DialogPanel class="pointer-events-auto w-screen max-w-md">
                <div class="flex h-full flex-col overflow-y-scroll bg-base-100 shadow-xl">
                  <div class="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                    <div class="flex items-start justify-between">
                      <DialogTitle class="text-lg font-medium">Shopping cart</DialogTitle>
                      <button @click="toggleCart" class="btn btn-ghost btn-sm btn-circle">✕</button>
                    </div>

                    <div class="mt-8" v-if="items.length">
                      <div class="flow-root">
                        <ul role="list" class="-my-6 divide-y divide-base-200">
                          <li v-for="item in items" :key="item.id" class="flex py-6">
                            <div class="flex-shrink-0">
                              <img :src="item.image" class="h-24 w-24 rounded-md object-cover object-center" />
                            </div>
                            <div class="ml-4 flex flex-1 flex-col">
                              <div>
                                <div class="flex justify-between text-base font-medium">
                                  <h3>{{ item.name }}</h3>
                                  <p class="ml-4">${{ item.price }}</p>
                                </div>
                              </div>
                              <div class="flex flex-1 items-end justify-between text-sm">
                                <p class="text-gray-500">Qty {{ item.quantity }}</p>
                                <button @click="removeFromCart(item.id)" class="btn btn-ghost btn-xs">Remove</button>
                              </div>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div v-else class="text-center py-8">
                      <p>Your cart is empty</p>
                    </div>
                  </div>

                  <div class="border-t border-base-200 px-4 py-6 sm:px-6" v-if="items.length">
                    <div class="flex justify-between text-base font-medium">
                      <p>Subtotal</p>
                      <p>${{ total }}</p>
                    </div>
                    <p class="mt-0.5 text-sm text-base-content/70">Shipping and taxes calculated at checkout.</p>
                    <div class="mt-6">
                      <a href="/checkout" class="btn btn-primary w-full">Checkout</a>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useStore } from '@nanostores/vue'
import { cartItems, isCartOpen, toggleCart, removeFromCart } from '../stores/cartStore'

const items = useStore(cartItems)
const isOpen = useStore(isCartOpen)

const total = computed(() => {
  return items.value.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)
})
</script>