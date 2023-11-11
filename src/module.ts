import { fileURLToPath } from 'node:url'
import { resolve, normalize } from 'pathe'
import { defineNuxtModule, addServerHandler, installModule, addVitePlugin } from '@nuxt/kit'
import { defu } from 'defu'
import type { Nuxt } from '@nuxt/schema'
import viteRemove from 'unplugin-remove/vite'
import { defuReplaceArray } from './utils'
import type {
  ModuleOptions,
  // NuxtSecurityRouteRules
} from './types/index'
import type {
ContentSecurityPolicyValue,
  SecurityHeaders
} from './types/headers'
import type {
  BasicAuth
} from './types/middlewares'
import {
  defaultSecurityConfig
} from './defaultConfig'
import { SECURITY_MIDDLEWARE_NAMES } from './middlewares'
import { type HeaderMapper, SECURITY_HEADER_NAMES, getHeaderValueFromOptions, getOptionHeaderNameForHTTP, HTTP_HEADER_NAMES, type HttpHeaderNames } from './headers'
import { buildAssetsHashes } from './runtime/utils'
import { stringify } from 'node:querystring'
import nuxtConfig from '~/docs/nuxt.config'

declare module 'nuxt/schema' {
  interface NuxtOptions {
    security: ModuleOptions
  }
  interface RuntimeConfig {
    security: ModuleOptions,
    private: { basicAuth: BasicAuth | false, [key: string]: any }
  }
}

declare module 'nitropack' {
  /* interface NitroRouteRules {
    security: NuxtSecurityRouteRules;
  }*/
  interface NitroRouteConfig {
    security?: Partial<ModuleOptions>;
  }
}

export * from './types/index'
export * from './types/headers'
export * from './types/middlewares'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-security',
    configKey: 'security'
  },
  async setup (options, nuxt) {
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)
    nuxt.options.security = defuReplaceArray(
      { ...options, ...nuxt.options.security },
      {
        ...defaultSecurityConfig(nuxt.options.devServer.url)
      }
    )
    const securityOptions = nuxt.options.security
    // Disabled module when `enabled` is set to `false`
    if (!securityOptions.enabled) { return }

    if (securityOptions.removeLoggers) {
      addVitePlugin(viteRemove(securityOptions.removeLoggers))
    }

    registerSecurityNitroPlugins(nuxt, securityOptions)

    nuxt.options.runtimeConfig.private = defu(
      nuxt.options.runtimeConfig.private,
      {
        basicAuth: securityOptions.basicAuth
      }
    )

    delete (securityOptions as any).basicAuth

    nuxt.options.runtimeConfig.security = defu(
      nuxt.options.runtimeConfig.security,
      {
        ...securityOptions
      }
    )

    setSecurityRouteRules(nuxt, securityOptions)
    supportDeprecatedHeaderRouteRulesFormat(nuxt)

    console.log('rules', nuxt.options.nitro.routeRules)
    // Remove Content-Security-Policy header in pre-rendered routes
    // When pre-rendered, the CSP is provided via html <meta> instead
    // If kept, this would block the site from rendering
    // removeCspHeaderForPrerenderedRoutes(nuxt)

    if (nuxt.options.security.requestSizeLimiter) {
      addServerHandler({
        handler: normalize(
          resolve(runtimeDir, 'server/middleware/requestSizeLimiter')
        )
      })
    }

    if (nuxt.options.security.rateLimiter) {
      addServerHandler({
        handler: normalize(
          resolve(runtimeDir, 'server/middleware/rateLimiter')
        )
      })
    }

    if (nuxt.options.security.xssValidator) {
      addServerHandler({
        handler: normalize(
          resolve(runtimeDir, 'server/middleware/xssValidator')
        )
      })
    }

    if (nuxt.options.security.corsHandler) {
      addServerHandler({
        handler: normalize(
          resolve(runtimeDir, 'server/middleware/corsHandler')
        )
      })
    }
    if (nuxt.options.security.nonce) {
      addServerHandler({
        handler: normalize(
          resolve(runtimeDir, 'server/middleware/cspNonceHandler')
        )
      })
    }

    const allowedMethodsRestricterConfig = nuxt.options.security
      .allowedMethodsRestricter
    if (
      allowedMethodsRestricterConfig &&
      !Object.values(allowedMethodsRestricterConfig).includes('*')
    ) {
      addServerHandler({
        handler: normalize(
          resolve(runtimeDir, 'server/middleware/allowedMethodsRestricter')
        )
      })
    }

    // Register basicAuth middleware that is disabled by default
    const basicAuthConfig = nuxt.options.runtimeConfig.private
      .basicAuth as unknown as BasicAuth
    if (basicAuthConfig && ((basicAuthConfig as any)?.enabled || (basicAuthConfig as any)?.value?.enabled)) {
      addServerHandler({
        route: (basicAuthConfig as any).route || '',
        handler: normalize(resolve(runtimeDir, 'server/middleware/basicAuth'))
      })
    }

    // Calculates SRI hashes at build time
    if (nuxt.options.security.sri) {
      // At server build time, we calculate sri hashes
      nuxt.hook('nitro:build:public-assets', buildAssetsHashes)

    }

    nuxt.hook('imports:dirs', (dirs) => {
      dirs.push(normalize(resolve(runtimeDir, 'composables')))
    })

    const csrfConfig = nuxt.options.security.csrf
    if (csrfConfig) {
      if (Object.keys(csrfConfig).length) {
        await installModule('nuxt-csurf', csrfConfig)
      }
      await installModule('nuxt-csurf')
    }
  }
})


/**
 * Insert security options in the radix router
 * @param nuxt 
 * @param securityOptions 
 */
const setSecurityRouteRules = (nuxt: Nuxt, securityOptions: ModuleOptions) => {
  // TBD defuArray ???
  nuxt.options.nitro.routeRules = defu(
    nuxt.options.nitro.routeRules,
    { '/**': { security: securityOptions } }
  )
}

/**
 * Merge the header rules that are defined in the standard route rules with those in the security config
 * Security rules take precedence
 */
const mergeHeaderRules = (nuxt: Nuxt) => {
  for (const route in nuxt.options.nitro.routeRules) {
    const { security } = nuxt.options.nitro.routeRules[route]
    const { headers } = nuxt.options.nitro.routeRules[route]
    if (security?.headers !== undefined) {
      const modifiedHeaders = transformSecurityHeadersIntoHttpHeaders(security.headers)
      nuxt.options.nitro.routeRules[route] = defu(
        { headers: modifiedHeaders },
        nuxt.options.nitro.routeRules[route]
      )
    }
  }
}

/**
 * 
 */
const transformSecurityHeadersIntoHttpHeaders = (headers: SecurityHeaders | false) => {
  if (!headers) {
    return { 'Content-Security-Policy': 'toto'}
  }
  return { 'Content-Security-Policy' : 'Toto'}
}

/**
 * Support the deprecated method where the SecurityOptions format could be used in the standard header property of the radix router 
 * @param nuxt 
 * @param securityOptions 
 */
const supportDeprecatedHeaderRouteRulesFormat = (nuxt: Nuxt) => {
  for (const route in nuxt.options.nitro.routeRules) {
    const routeRule = nuxt.options.nitro.routeRules[route]
    const headers: Record<string, any> | undefined = routeRule.headers
    if (!headers) {
      continue
    }

    const newSecurityHeaders: SecurityHeaders = {}
    for (const headerName in headers) {
      const headerValue = headers[headerName]
      // If it's a standard header of the route rules, don't modify
      if (typeof headerValue === 'string') {
        continue
      }
      // Unsupported header value, let's skip
      if (!Object.keys(HTTP_HEADER_NAMES).includes(headerName)) {
        continue
      }
      // The header was provided in the deprecated format as a SecurityOptions header, transfer into security object
      const securityName = getOptionHeaderNameForHTTP(headerName as keyof HttpHeaderNames)
      newSecurityHeaders[securityName] = headerValue
      // And remove from standard header property
      delete headers[headerName]
    }
    routeRule.headers = headers
    routeRule.security
    routeRule.security = defu(
      { headers: newSecurityHeaders },
      routeRule.security
    )
  }
}


const removeCspHeaderForPrerenderedRoutes = (nuxt: Nuxt) => {
  const nitroRouteRules = nuxt.options.nitro.routeRules
  for (const route in nitroRouteRules) {
    const routeRules = nitroRouteRules[route]
    if (routeRules.prerender || nuxt.options.nitro.static) {
      routeRules.headers = routeRules.headers || {}
      routeRules.headers['Content-Security-Policy'] = ''
    }
  }
}

const registerSecurityNitroPlugins = (
  nuxt: Nuxt,
  securityOptions: ModuleOptions
) => {
  nuxt.hook('nitro:config', (config) => {
    config.plugins = config.plugins || []

    if (securityOptions.rateLimiter) {
      // setup unstorage
      const driver = (securityOptions.rateLimiter).driver
      if (driver) {
        const { name, options } = driver
        config.storage = defu(
          config.storage,
          {
            '#storage-driver': {
              driver: name,
              options
            }
          }
        )
      }
    }

    // Register nitro plugin to replace default 'X-Powered-By' header with custom one that does not indicate what is the framework underneath the app.
    if (securityOptions.hidePoweredBy) {
      config.externals = config.externals || {}
      config.externals.inline = config.externals.inline || []
      config.externals.inline.push(
        normalize(fileURLToPath(new URL('./runtime', import.meta.url)))
      )
      config.plugins.push(
        normalize(
          fileURLToPath(
            new URL('./runtime/nitro/plugins/01-hidePoweredBy', import.meta.url)
          )
        )
      )
    }

    // Register nitro plugin to enable subresource integrity
    config.plugins.push(
      normalize(
        fileURLToPath(
          new URL('./runtime/nitro/plugins/02-subresourceIntegrity', import.meta.url)
        )
      )
    )

    // Register nitro plugin to enable CSP hashes for SSG
    config.plugins.push(
      normalize(
        fileURLToPath(
          new URL('./runtime/nitro/plugins/03-cspSsg', import.meta.url)
        )
      )
    )

    // Register nitro plugin to enable CSP nonces for SSR
    if (nuxt.options.security.nonce) {
      config.plugins.push(
        normalize(
          fileURLToPath(
            new URL('./runtime/nitro/plugins/99-cspNonce', import.meta.url)
          )
        )
      )
    }
  })

  // Make sure our nitro plugins will be applied last
  // After all other third-party modules that might have loaded their own nitro plugins
  nuxt.hook('nitro:init', nitro => {
    const securityPluginsPrefix = normalize(
      fileURLToPath(
        new URL('./runtime/nitro/plugins', import.meta.url)
      )
    )
    // SSR: Reorder plugins in Nitro options
    nitro.options.plugins.sort((a, b) => {
      if (a.startsWith(securityPluginsPrefix)) {
        if (b.startsWith(securityPluginsPrefix)) {
          return 0
        } else {
          return 1
        }
      } else {
        if (b.startsWith(securityPluginsPrefix)) {
          return -1
        } else {
          return 0
        }
      }
    })
    // SSG: Reorder plugins in Nitro hook
    nitro.hooks.hook('prerender:config', config => {
      config.plugins?.sort((a, b) => {
        if (a?.startsWith(securityPluginsPrefix)) {
          if (b?.startsWith(securityPluginsPrefix)) {
            return 0
          } else {
            return 1
          }
        } else {
          if (b?.startsWith(securityPluginsPrefix)) {
            return -1
          } else {
            return 0
          }
        }
      })
    })
  })
}
