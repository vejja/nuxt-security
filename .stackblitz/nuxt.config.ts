export default defineNuxtConfig({
  extends: ['@nuxt-themes/docus'],
  modules: [
    '@nuxtjs/plausible',
    '@nuxtlabs/github-module',
    '../src/module.ts'
  ],
  routeRules: {
    '/playground': {
      headers: {
        'Cross-Origin-Embedder-Policy': 'unsafe-none'
      }
    }
  },
  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', 'https://i3.ytimg.com/vi/8RDPrptc9uU/hqdefault.jpg'],
        'style-src': process.env.NODE_ENV === 'development' ? ["'self'", 'https:', "'unsafe-inline'"] : ["'self'", 'https:', "'unsafe-inline'"],
        'script-src': ["'self'", "'unsafe-inline'",  "'strict-dynamic'", "'nonce-{{nonce}}'"]
      },
      crossOriginEmbedderPolicy: 'require-corp',
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'cross-origin',
      xFrameOptions: false,
    },
    nonce: true
  },
  github: {
    owner: 'Baroshem',
    repo: 'nuxt-security',
    branch: 'main'
  }
})
