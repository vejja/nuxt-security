export default defineNuxtConfig({
  modules: [
    'nuxt-security-poc',
    '@nuxt/image'
  ],
  image: {
    domains: ['nuxt.com']
  },
  security: {
    nonce: true,
    headers: {
      contentSecurityPolicy: {
        'style-src': ["'self'", 'https:'],
        'script-src': [
          "'self'", // backwards compatibility for older browsers that don't support strict-dynamic
          "'nonce-{{nonce}}'",
          "'strict-dynamic'"
        ],
        'script-src-attr': ["'self'", "'nonce-{{nonce}}'", "'strict-dynamic'"],
        'img-src': ["'self'", 'data:']
      }
    }
  }
})
