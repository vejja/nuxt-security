export default defineNuxtConfig({
  extends: ['@nuxt-themes/docus'],
  modules: [
    '@nuxtjs/plausible',
    '@nuxtlabs/github-module',
    '../src/module.ts'
  ],
  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', 'https://i3.ytimg.com/vi/8RDPrptc9uU/hqdefault.jpg'],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'script-src': ["'self'", "'unsafe-inline'"]
      },
      crossOriginEmbedderPolicy: 'credentialless',
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'cross-origin',
      xFrameOptions: false,
    }
  },
  github: {
    owner: 'Baroshem',
    repo: 'nuxt-security',
    branch: 'main'
  }
})
