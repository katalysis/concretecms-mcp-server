import * as client from 'openid-client'
import { webcrypto } from 'node:crypto'
import { basic_auth_user, basic_auth_pass } from '../env.js'

// Ensure crypto is available globally for oauth4webapi
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any
}

// Custom HTTP fetch function that adds basic auth headers
export function createCustomFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers)
    
    // Add HTTP Basic Auth if credentials are provided
    if (basic_auth_user && basic_auth_pass) {
      const basicAuth = Buffer.from(`${basic_auth_user}:${basic_auth_pass}`).toString('base64')
      headers.set('Authorization', `Basic ${basicAuth}`)
    }
    
    const newInit: RequestInit = {
      ...init,
      headers
    }
    
    return fetch(input, newInit)
  }
}

// Override the global fetch for oauth operations
if (basic_auth_user && basic_auth_pass) {
  // Store original fetch
  const originalFetch = globalThis.fetch
  
  // Override global fetch to add basic auth for OAuth requests
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    
    // Only add basic auth for OAuth endpoints
    if (url.includes('/oauth/') || url.includes('/ccm/api/')) {
      return createCustomFetch()(input, init)
    }
    
    // Use original fetch for other requests
    return originalFetch(input, init)
  }
}