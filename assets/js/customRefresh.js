import { RefreshScheme } from '~auth/runtime'

export default class CustomScheme extends RefreshScheme {
  refreshTokens () {
    // Refresh endpoint is disabled
    if (!this.options.endpoints.refresh) {
      return
    }

    // Token and refresh token are required but not available
    if (!this.check().valid) {
      return
    }

    // Get refresh token status
    const refreshTokenStatus = this.refreshToken.status()

    // Refresh token is expired. There is no way to refresh. Force reset.
    if (refreshTokenStatus.expired()) {
      this.$auth.reset()
      return Promise.reject(new Error('Token expired'))
    }

    // Delete current token from the request header before refreshing, if `tokenRequired` is disabled
    if (!this.options.refreshToken.tokenRequired) {
      this.requestHandler.clearHeader()
    }

    // Set authorization header
    this.requestHandler.axios.defaults.headers.common[this.options.token.name] = `${this.options.token.type} ${this.refreshToken.get()}`

    // Make refresh request
    return this.$auth
      .request({}, this.options.endpoints.refresh)
      .then((response) => {
        // Update tokens
        this.updateTokens(response, { isRefreshing: true })
      })
      .catch((error) => {
        this.$auth.callOnError(error, { method: 'refreshToken' })
        return Promise.reject(error)
      })
  }
}
