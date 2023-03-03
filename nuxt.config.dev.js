import config from './nuxt.config.js'

config.axios.baseURL = 'http://triplehop.local:8000/',
config.watchers = {
  webpack: {
    aggregateTimeout: 300,
    poll: 1000
  }
}

export default config
