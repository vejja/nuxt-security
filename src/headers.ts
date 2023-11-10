import type {
  ContentSecurityPolicyValue,
  PermissionsPolicyValue,
  StrictTransportSecurityValue
} from './types/headers'

type SecurityHeaderNames = {
  contentSecurityPolicy: 'Content-Security-Policy',
  crossOriginEmbedderPolicy: 'Cross-Origin-Embedder-Policy',
  crossOriginOpenerPolicy: 'Cross-Origin-Opener-Policy',
  crossOriginResourcePolicy: 'Cross-Origin-Resource-Policy',
  originAgentCluster: 'Origin-Agent-Cluster',
  referrerPolicy: 'Referrer-Policy',
  strictTransportSecurity: 'Strict-Transport-Security',
  xContentTypeOptions: 'X-Content-Type-Options',
  xDNSPrefetchControl: 'X-DNS-Prefetch-Control',
  xDownloadOptions: 'X-Download-Options',
  xFrameOptions: 'X-Frame-Options',
  xPermittedCrossDomainPolicies: 'X-Permitted-Cross-Domain-Policies',
  xXSSProtection: 'X-XSS-Protection',
  permissionsPolicy: 'Permissions-Policy'
}

export const SECURITY_HEADER_NAMES: SecurityHeaderNames = {
  contentSecurityPolicy: 'Content-Security-Policy',
  crossOriginEmbedderPolicy: 'Cross-Origin-Embedder-Policy',
  crossOriginOpenerPolicy: 'Cross-Origin-Opener-Policy',
  crossOriginResourcePolicy: 'Cross-Origin-Resource-Policy',
  originAgentCluster: 'Origin-Agent-Cluster',
  referrerPolicy: 'Referrer-Policy',
  strictTransportSecurity: 'Strict-Transport-Security',
  xContentTypeOptions: 'X-Content-Type-Options',
  xDNSPrefetchControl: 'X-DNS-Prefetch-Control',
  xDownloadOptions: 'X-Download-Options',
  xFrameOptions: 'X-Frame-Options',
  xPermittedCrossDomainPolicies: 'X-Permitted-Cross-Domain-Policies',
  xXSSProtection: 'X-XSS-Protection',
  permissionsPolicy: 'Permissions-Policy'
}

export function getHTTPHeaderNameForOption(headerOption: keyof typeof SECURITY_HEADER_NAMES) {
  return SECURITY_HEADER_NAMES[headerOption]
}

export type HttpHeaderNames = {
  'Content-Security-Policy': 'contentSecurityPolicy',
  'Cross-Origin-Embedder-Policy': 'crossOriginEmbedderPolicy',
  'Cross-Origin-Opener-Policy': 'crossOriginOpenerPolicy',
  'Cross-Origin-Resource-Policy': 'crossOriginResourcePolicy',
  'Origin-Agent-Cluster': 'originAgentCluster',
  'Referrer-Policy': 'referrerPolicy',
  'Strict-Transport-Security': 'strictTransportSecurity',
  'X-Content-Type-Options': 'xContentTypeOptions',
  'X-DNS-Prefetch-Control': 'xDNSPrefetchControl',
  'X-Download-Options': 'xDownloadOptions',
  'X-Frame-Options': 'xFrameOptions',
  'X-Permitted-Cross-Domain-Policies': 'xPermittedCrossDomainPolicies',
  'X-XSS-Protection': 'xXSSProtection',
  'Permissions-Policy': 'permissionsPolicy'
} 

export const HTTP_HEADER_NAMES: HttpHeaderNames = {
  'Content-Security-Policy': 'contentSecurityPolicy',
  'Cross-Origin-Embedder-Policy': 'crossOriginEmbedderPolicy',
  'Cross-Origin-Opener-Policy': 'crossOriginOpenerPolicy',
  'Cross-Origin-Resource-Policy': 'crossOriginResourcePolicy',
  'Origin-Agent-Cluster': 'originAgentCluster',
  'Referrer-Policy': 'referrerPolicy',
  'Strict-Transport-Security': 'strictTransportSecurity',
  'X-Content-Type-Options': 'xContentTypeOptions',
  'X-DNS-Prefetch-Control': 'xDNSPrefetchControl',
  'X-Download-Options': 'xDownloadOptions',
  'X-Frame-Options': 'xFrameOptions',
  'X-Permitted-Cross-Domain-Policies': 'xPermittedCrossDomainPolicies',
  'X-XSS-Protection': 'xXSSProtection',
  'Permissions-Policy': 'permissionsPolicy'
}

export function getOptionHeaderNameForHTTP(headerHTTP: keyof HttpHeaderNames) {
  return HTTP_HEADER_NAMES[headerHTTP]
}

export type HeaderMapper = 'strictTransportSecurity' | 'contentSecurityPolicy' | 'permissionsPolicy'

const headerValueMappers = {
  strictTransportSecurity: (value: StrictTransportSecurityValue) =>
    [
      `max-age=${value.maxAge}`,
      value.includeSubdomains && 'includeSubDomains',
      value.preload && 'preload'
    ].filter(Boolean).join('; '),
  contentSecurityPolicy: (value: ContentSecurityPolicyValue) => {
    const contentArray: string[] = []
    for (const [directive, sources] of Object.entries(value)) {
      let policyValue: string

      if (Array.isArray(sources)) {
        policyValue = sources.join(' ')
      } else if (typeof sources === 'boolean') {
        policyValue = ''
      } else {
        policyValue = sources
      }

      if (sources !== false) {
        contentArray.push(`${directive} ${policyValue}`)
      }
    }
    return contentArray.map(policy => policy.trim() + ';').join(' ')
  },
  permissionsPolicy: (value: PermissionsPolicyValue) => Object.entries(value).map(([directive, sources]) => `${directive}=(${(sources as string[]).join(' ')})`).filter(Boolean).join(', ')
}

export const getHeaderValueFromOptions = <T>(headerType: HeaderMapper, headerOptions: any) => {
  if (typeof headerOptions === 'string') {
    return headerOptions
  }
  return headerValueMappers[headerType]?.(headerOptions) ?? headerOptions
}
