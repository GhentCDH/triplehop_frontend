import config from './nuxt.config.js'

config.axios.baseURL = 'https://qas.triplehop-backend.ugent.be/'
config.axios.proxyHeadersIgnore = ['accept', 'host', 'x-forwarded-host', 'x-forwarded-port', 'x-forwarded-proto', 'cf-ray', 'cf-connecting-ip', 'content-length', 'content-md5', 'content-type', 'authorization']

export default config
