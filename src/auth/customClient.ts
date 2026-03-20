import { webcrypto } from 'node:crypto'

// Ensure crypto is available globally for oauth4webapi
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any
}