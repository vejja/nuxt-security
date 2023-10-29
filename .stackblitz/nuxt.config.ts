export default defineNuxtConfig({
  extends: ['content-wind'],
  modules: [
    '@nuxt/image',
    '../src/module.ts'
  ],
  image: {
    domains: ['nuxt.com']
  },
  content: {
    documentDriven: false
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
        'script-src-attr': ["'self'", "'nonce-{{nonce}}'"],
        'img-src': ["'self'", 'data:']
      }
    }
  }
})
