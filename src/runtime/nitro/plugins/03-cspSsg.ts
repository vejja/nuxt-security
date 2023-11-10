import type { H3Event } from 'h3'
import defu from 'defu'
import type {
  ContentSecurityPolicyValue
} from '../../../types/headers'
import { defineNitroPlugin, useRuntimeConfig, getRouteRules } from '#imports'
import { useNitro } from '@nuxt/kit'
import * as cheerio from 'cheerio'
import { isPrerendering, generateHash } from '../../utils'

const moduleOptions = useRuntimeConfig().security

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    // Exit in the SSR case
    if (!isPrerendering(event)) {
      return
    }

    const { headers, security } = getRouteRules(event)
    console.log('in csp ssg', headers, security)
    if (!headers || !headers.contentSecurityPolicy || typeof headers.contentSecurityPolicy === 'string') {
      // This means that CSP is not enabled, or that the CSP header has been manually set in the string format
      return
    }
    const { ssg } = security
    if (!ssg || (!ssg.hashScripts && !ssg.hashStyles)) {
      // This means that SSG hash support is disabled for both scripts and styles, skip
      return
    }

    const scriptHashes: Set<string> = new Set()
    const styleHashes: Set<string> = new Set()
    const hashAlgorithm = 'sha256'

    // Scan all relevant sections of the NuxtRenderHtmlContext
    for (const section of ['body', 'bodyAppend', 'bodyPrepend', 'head']) {
      const htmlRecords = html as unknown as Record<string, string[]>
      const elements = htmlRecords[section]
      for (const element of elements) {
        const $ = cheerio.load(element, null, false)

        // Parse all script tags if option is enabled
        if (ssg.hashScripts) {
          $('script').each((i, script) => {
            const scriptText = $(script).text()
            const scriptAttrs = $(script).attr()
            const src = scriptAttrs?.src
            const integrity = scriptAttrs?.integrity
            if (!src && scriptText) {
              // Hash inline scripts with content
              scriptHashes.add(generateHash(scriptText, hashAlgorithm))
            } else if (src && integrity) {
              // Whitelist external scripts with integrity
              scriptHashes.add(`'${integrity}'`)
            }
          })
        }

        // Parse all style tags if option is enabled
        if (ssg.hashScripts) {
          $('style').each((i, style) => {
            const styleText = $(style).text()
            if (styleText) {
              // Hash inline styles with content
              styleHashes.add(generateHash(styleText, hashAlgorithm))
            }
        })

        // Parse all link tags
        $('link').each((i, link) => {
          const linkAttrs = $(link).attr()
          const integrity = linkAttrs?.integrity
          // Whitelist links to external resources with integrity
          if (integrity) {
            const rel = linkAttrs?.rel
            // HTML standard defines only 3 rel values for valid integrity attributes on links : stylesheet, preload and modulepreload
            // https://html.spec.whatwg.org/multipage/semantics.html#attr-link-integrity
            if (rel === 'stylesheet' && ssg.hashStyles) {
              // style: add to style-src if option is enabled
              styleHashes.add(`'${integrity}'`)
            } else if (rel === 'preload') {
              // Fetch standard defines the destination (https://fetch.spec.whatwg.org/#destination-table)
              // This table is the official mapping between HTML and CSP
              // We only support script-src for now, but we could populate other policies in the future
              const as = linkAttrs.as
              switch (as) {
                case 'script':
                case 'audioworklet':
                case 'paintworklet':
                case 'xlst':
                  if (ssg.hashScripts) {
                    scriptHashes.add(`'${integrity}'`)
                  }
                  break
                default:
                  break
              }
            } else if (rel === 'modulepreload' && ssg.hashScripts) {
              // script is the default and only possible destination
              scriptHashes.add(`'${integrity}'`)
            }
          }
          })
        }
      }
    }
    console.log('csp before', headers.contentSecurityPolicy)
    const content = generateCspMetaTag(headers.contentSecurityPolicy, scriptHashes, styleHashes)
    console.log('csp after', headers.contentSecurityPolicy)
    // Insert hashes in the http meta tag
    html.head.push(`<meta http-equiv="Content-Security-Policy" content="${content}">`)
    // Also insert hashes in static headers for presets that generate headers rules for static files
    updateRouteRules(event, content)

  })

  // Insert hashes in the CSP meta tag for both the script-src and the style-src policies
  function generateCspMetaTag (csp: ContentSecurityPolicyValue, scriptHashes: Set<string>, styleHashes: Set<string>) {
    csp['script-src'] = (csp['script-src'] ?? []).concat(...scriptHashes)
    csp['style-src'] = (csp['style-src'] ?? []).concat(...styleHashes)

    const contentArray: string[] = []
    for (const [key, value] of Object.entries(csp)) {
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
    console.log('csp between', csp)
    const content = contentArray.join('; ').replaceAll("'nonce-{{nonce}}'", '')
    return content
  }

  // In some Nitro presets (e.g. Vercel), the header rules are generated for the static server
  // By default we update the nitro route rules with their calculated CSP value to support this possibility
  function updateRouteRules(event: H3Event, content: string) {
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
})
