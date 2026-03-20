import * as client from 'openid-client'
import { config } from './oidc.js'
import { loadTokens, saveTokens, type StoredTokens } from '../tokenStore.js'
import { basic_auth_user, basic_auth_pass } from '../env.js'

export class RefreshTokenGrantProvider {
  private _accessToken: string | undefined
  private _refreshToken: string | undefined
  private _expiresAt: number | undefined
  private _parameters: Record<string, string> | undefined

  set accessToken(value: string | undefined) {
    this._accessToken = value
  }

  set refreshToken(value: string | undefined) {
    this._refreshToken = value
  }

  set expiresAt(value: number | undefined) {
    this._expiresAt = value
  }

  set parameters(value: Record<string, string> | undefined) {
    this._parameters = value
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this._accessToken) {
      throw new Error('Access token not available')
    }

    if (!this._refreshToken) {
      throw new Error('Refresh token not available')
    }

    if (this._expiresAt && Date.now() > this._expiresAt) {
      await this.refreshAccessToken()
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this._accessToken}`,
    }

    // Add HTTP Basic Auth if credentials are provided (for password-protected dev sites)
    if (basic_auth_user && basic_auth_pass) {
      const basicAuth = Buffer.from(`${basic_auth_user}:${basic_auth_pass}`).toString('base64')
      headers['X-Basic-Authorization'] = `Basic ${basicAuth}`
    }

    return headers
  }

  async handleAuthError(error: any): Promise<boolean> {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      try {
        await this.refreshAccessToken()
        return true
      } catch {
        console.error('[concretecms-mcp] Failed to refresh token, re-authentication required')
        throw new Error('Failed to refresh access token')
      }
    }

    return false
  }

  private async refreshAccessToken(): Promise<void> {
    if (this._refreshToken && this._parameters) {
      try {
        console.error('[concretecms-mcp] Refreshing access token...')
        const tokenEndpointResponse: client.TokenEndpointResponse = await client.refreshTokenGrant(
          config,
          this._refreshToken,
          this._parameters
        )

        this._accessToken = tokenEndpointResponse.access_token
        this._expiresAt = Date.now() + tokenEndpointResponse.expires_in! * 1000

        if (tokenEndpointResponse.refresh_token) {
          this._refreshToken = tokenEndpointResponse.refresh_token
        }

        saveTokens({
          access_token: this._accessToken,
          refresh_token: this._refreshToken,
          expires_at: this._expiresAt,
          parameters: this._parameters,
        } as StoredTokens)

        console.error('[concretecms-mcp] Access token refreshed successfully')
      } catch (error) {
        console.error('[concretecms-mcp] Token refresh failed:', error)
        throw error
      }
    }
  }

  loadStoredTokens(): boolean {
    const stored = loadTokens()
    if (stored) {
      this._accessToken = stored.access_token
      this._refreshToken = stored.refresh_token
      this._expiresAt = stored.expires_at
      this._parameters = stored.parameters
      console.error('[concretecms-mcp] Loaded stored tokens')
      return true
    }
    return false
  }
}
