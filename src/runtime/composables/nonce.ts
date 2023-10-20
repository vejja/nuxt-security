import { useNuxtApp, useCookie } from '#imports'

export function useNonce () {
  // Don't use cookies in the frontend, but still provide useNonce server-side
  return useNuxtApp().ssrContext?.event?.context.nonce /* ?? useCookie('nonce').value */
}
