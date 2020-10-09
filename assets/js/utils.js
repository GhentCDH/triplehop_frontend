export function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function compareNameUnicode (a, b) {
  const normA = normalizeUnicode(a.name).toLowerCase()
  const normB = normalizeUnicode(b.name).toLowerCase()
  if (normA < normB) {
    return -1
  }
  if (normA > normB) {
    return 1
  }
  return 0
}

export function constructTitle (title, data) {
  return title.replace(/(?<![$])[$]([a-z_]+)/g, m => data[m.slice(1)])
}

export function formatDateTime (string) {
  if (string == null) {
    return null
  }
  const date = new Date(string)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
}

export function isArray (variable) {
  return Array.isArray(variable)
}

export function isNumber (string) {
  return /^\d+$/.test(string)
}

export function isObject (variable) {
  return variable != null && typeof variable === 'object'
}

export function isUUID (string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(string)
}

export function filterObject (obj, predicate) {
  return Object.keys(obj)
    .filter(key => predicate(obj[key]))
    .reduce((result, key) => ({ ...result, [key]: obj[key] }), {})
}

export function normalizeUnicode (string) {
  return string.normalize('NFKD').replace(/[^\w]/g, '')
}
