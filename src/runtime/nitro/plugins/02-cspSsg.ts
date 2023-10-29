import path from 'node:path'
import crypto from 'node:crypto'
import type { H3Event } from 'h3'
import defu from 'defu'
import type {
  ModuleOptions
} from '../../../types'
import type {
  ContentSecurityPolicyValue
} from '../../../types/headers'
import { defineNitroPlugin, useRuntimeConfig, getRouteRules } from '#imports'
import { useNitro } from '@nuxt/kit'
import { cp } from 'node:fs'

const moduleOptions = useRuntimeConfig().security

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    // Content Security Policy

    if (!isContentSecurityPolicyEnabled(event, moduleOptions)) {
      return
    }

    if (!moduleOptions.headers) {
      return
    }

    // Detect both inline scripts and inline styles
    const scriptPattern = /<script[^>]*>(.*?)<\/script>/gs
    const stylePattern = /<style>(.*?)<\/style>/gs
    const scriptHashes: string[] = []
    const styleHashes: string[] = []
    const hashAlgorithm = 'sha256'

    // Scan all relevant sections of the NuxtRenderHtmlContext
    for (const section of ['body', 'bodyAppend', 'bodyPrepend', 'head']) {
      const htmlRecords = html as unknown as Record<string, string[]>
      const elements = htmlRecords[section]
      for (const element of elements) {
        let match
        while ((match = scriptPattern.exec(element)) !== null) {
          if (match[1]) {
            scriptHashes.push(generateHash(match[1], hashAlgorithm))
          }
        }
        while ((match = stylePattern.exec(element)) !== null) {
          if (match[1]) {
            styleHashes.push(generateHash(match[1], hashAlgorithm))
          }
        }
      }
    }

    const cspConfig = moduleOptions.headers.contentSecurityPolicy

    if (cspConfig && typeof cspConfig !== 'string') {
      // Insert hashes in the http meta tag
      html.head.push(generateCspMetaTag(cspConfig, scriptHashes, styleHashes))
      // Also insert hashes in header for presets that support headers
      generateCspHeader(event, cspConfig, scriptHashes, styleHashes)
    }


  })

  // Insert hashes in the CSP meta tag for both the script-src and the style-src policies
  function generateCspMetaTag (policies: ContentSecurityPolicyValue, scriptHashes: string[], styleHashes: string[]) {
    const unsupportedPolicies:Record<string, boolean> = {
      'frame-ancestors': true,
      'report-uri': true,
      sandbox: true
    }

    const tagPolicies = defu(policies) as ContentSecurityPolicyValue
    if (scriptHashes.length > 0 && moduleOptions.ssg?.hashScripts) {
      // Remove '""'
      tagPolicies['script-src'] = (tagPolicies['script-src'] ?? []).concat(scriptHashes)
    }
    if (styleHashes.length > 0 && moduleOptions.ssg?.hashScripts) {
      // Remove '""'
      tagPolicies['style-src'] = (tagPolicies['style-src'] ?? []).concat(styleHashes)
    }

    const contentArray: string[] = []
    for (const [key, value] of Object.entries(tagPolicies)) {
      if (unsupportedPolicies[key]) {
        continue
      }

      let policyValue: string

      if (Array.isArray(value)) {
        policyValue = value.join(' ')
      } else if (typeof value === 'boolean') {
        policyValue = ''
      } else {
        policyValue = value
      }

      if (value !== false) {
        contentArray.push(`${key} ${policyValue}`)
      }
    }
    const content = contentArray.join('; ')

    return `<meta http-equiv="Content-Security-Policy" content="${content}">`
  }

  // Insert hashes in the HTTP header
  // In some Nitro presets (e.g. Vercel), the header rules are generated for the static server
  // By default we modify headers to support these presets
  function generateCspHeader(event: H3Event, policies: ContentSecurityPolicyValue, scriptHashes: string[], styleHashes: string[]) {
    const unsupportedPolicies:Record<string, boolean> = {
      'frame-ancestors': true,
      'report-uri': true,
      sandbox: true
    }

    const tagPolicies = defu(policies)
    if (scriptHashes.length > 0 && moduleOptions.ssg?.hashScripts) {
      // Remove '""'
      tagPolicies['script-src'] = (tagPolicies['script-src'] ?? []).concat(scriptHashes)
    }
    if (styleHashes.length > 0 && moduleOptions.ssg?.hashScripts) {
      // Remove '""'
      tagPolicies['style-src'] = (tagPolicies['style-src'] ?? []).concat(styleHashes)
    }

    const contentArray: string[] = []
    for (const [key, value] of Object.entries(tagPolicies)) {
      if (unsupportedPolicies[key]) {
        continue
      }

      let policyValue: string

      if (Array.isArray(value)) {
        policyValue = value.join(' ')
      } else if (typeof value === 'boolean') {
        policyValue = ''
      } else {
        policyValue = value
      }

      if (value !== false) {
        contentArray.push(`${key} ${policyValue}`)
      }
    }
    const content = contentArray.join('; ')
    const path = event.path
    const routeRules = getRouteRules(event)
    let headers
    if (routeRules.headers) {
      headers = { ...routeRules.headers }
    } else {
      headers = {}
    }
    headers['Content-Security-Policy'] = content
    routeRules.headers = headers
    const nitro = useNitro()
    nitro.options.routeRules[path] = routeRules
  }

  function generateHash (content: string, hashAlgorithm: string) {
    const hash = crypto.createHash(hashAlgorithm)
    hash.update(content)
    return `'${hashAlgorithm}-${hash.digest('base64')}'`
  }

  /**
   * Only enable behavior if Content Security pPolicy is enabled,
   * initial page is prerendered and generated file type is HTML.
   * @param event H3Event
   * @param options ModuleOptions
   * @returns boolean
   */
  function isContentSecurityPolicyEnabled (event: H3Event, options: ModuleOptions): boolean {
    const nitroPrerenderHeader = 'x-nitro-prerender'
    const nitroPrerenderHeaderValue = event.node.req.headers[nitroPrerenderHeader]

    // Page is not prerendered
    if (!nitroPrerenderHeaderValue) {
      return false
    }

    // File is not HTML
    if (!['', '.html'].includes(path.extname(nitroPrerenderHeaderValue as string))) {
      return false
    }

    return true
  }
})
