import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'pathe'
import type { Nitro } from 'nitropack'
import type { H3Event } from 'h3'

/**
 * Calculate and saves the hashes of all the assets belonging to the Nuxt bundle
 * This function must be called within a Nuxt build step
 * @param nitro The nitro instance
 */
export async function buildAssetsHashes(nitro: Nitro) {
  const hashAlgorithm = 'sha384'
  const sriHashes: Record<string, string> = {}

  // Will be later necessary to construct url
  const { cdnURL: appCdnUrl = '', baseURL: appBaseUrl } = nitro.options.runtimeConfig.app


  // Go through all public assets folder by folder
  const publicAssets = nitro.options.publicAssets
  for (const publicAsset of publicAssets) {
    const { dir, baseURL = '' } = publicAsset

    // Node 16 compatibility maintained
    // Node 18.17+ supports recursive option on readdir
    // const entries = await readdir(dir, { withFileTypes: true, recursive: true })
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile()) {

        // Node 16 compatibility maintained
        // Node 18.17+ supports entry.path on DirEnt
        // const fullPath = join(entry.path, entry.name)
        const fullPath = join(dir, entry.name)
        const fileContent = await readFile(fullPath)
        const hash = generateHash(fileContent, hashAlgorithm)
        // construct the url as it will appear in the head template
        const relativeUrl = join(baseURL, entry.name)
        let url: string
        if (appCdnUrl) {
          // If the cdnURL option was set, the url will be in the form https://...
          url = new URL(relativeUrl, appCdnUrl).href
        } else {
          // If not, the url will be in a relative form: /_nuxt/...
          url = join('/', appBaseUrl, relativeUrl)
        }
        sriHashes[url] = hash
      }
    }
  }

  // Save hashes in a /integrity directory within the .nuxt build for later use with SSG
  const buildDir = nitro.options.buildDir
  const integrityDir = join(buildDir, 'integrity')
  await mkdir(integrityDir)
  const hashFilePath = join(integrityDir, 'sriHashes.json')
  await writeFile(hashFilePath, JSON.stringify(sriHashes))

  // Mount the /integrity directory into server assets for later use with SSR
  nitro.options.serverAssets.push({ dir: integrityDir, baseName: 'integrity' })

}

/**
 * Calculate the hash of an element in a CSP and SRI compliant format (shaXXX-base64).
 * As per standards, UTF-8 encoding is used for text and no encoding is used for files.
 * @param content The content to be hashed, can either be a string (inline elements), or a Buffer (file elements)
 * @param hashAlgorithm A valid hash algorithm. Only sha256, 384 and 512 variants are supported
 */
export function generateHash (content: Buffer | string, hashAlgorithm: 'sha256' | 'sha384' | 'sha512') {
  const hash = createHash(hashAlgorithm)
  hash.update(content)
  return `${hashAlgorithm}-${hash.digest('base64')}`
}

/**
 * Detect if a page is being pre-rendered, based on the x-nitro-prerender header.
 * Used to differentiate SSR vs SSG.
 * @param event The h3 request event being processed by Nitro
 */
export function isPrerendering(event: H3Event): boolean {
  const nitroPrerenderHeader = 'x-nitro-prerender'

  // Page is not prerendered
  if (!event.node.req.headers[nitroPrerenderHeader]) {
    return false
  }

  // File is not HTML
  if (!['', '.html'].includes(extname(event.node.req.headers[nitroPrerenderHeader] as string))) {
    return false
  }

  return true
}
