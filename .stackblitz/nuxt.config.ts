export default defineNuxtConfig({
  modules: [
    '../src/module.ts',
    '@nuxt/image',
    '@nuxt/content'
  ],
  image: {
    domains: ['nuxt.com']
  },
  security: {
    nonce: true,
    headers: {
      contentSecurityPolicy: {
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
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
