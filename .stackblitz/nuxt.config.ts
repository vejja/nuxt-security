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
  },/*
  nitro: {
    preset: 'vercel'
  },*/
  security: {
    nonce: true,
    headers: {
      contentSecurityPolicy: {
        'style-src': process.env.NODE_ENV === 'development' ? ["'self'", 'https:', "'unsafe-inline'"] : ["'self'", 'https:', "'nonce-{{nonce}}'"],
        'script-src': [
          "'self'", // backwards compatibility for older browsers that don't support strict-dynamic
          "'nonce-{{nonce}}'",
          "'strict-dynamic'"
        ],
        'script-src-attr': ["'self'", "'nonce-{{nonce}}'"],
        'img-src': ["'self'", 'data:']
      }
    }
  },
  routeRules: {
    '/api/generated-css': {
      headers: {
        'Content-Type': 'text/css'
      }
    },
    '/api/generated-script': {
      headers: {
        'Content-Type': 'application/javascript'
      }
    }
  }
})
