export default defineNuxtConfig({
  modules: ['../src/module'],

  // Per route configuration
  routeRules: {
    secret: {
      security: {
        rateLimiter: false
      },
      headers: {
        'X-XSS-Protection': '1'
      }
    }
  },

  // Global configuration
  security: {
    ssg: {
      hashScripts: true
    },
    headers: {
      xXSSProtection: '0'
    },
    rateLimiter: {
      tokensPerInterval: 10,
      interval: 10000
    }
  }
})
