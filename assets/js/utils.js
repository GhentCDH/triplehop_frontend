export function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function isNumber (string) {
  return /^\d+$/.test(string)
}

export function filterObject (obj, predicate) {
  return Object.keys(obj)
    .filter(key => predicate(obj[key]))
    .reduce((result, key) => ({ ...result, [key]: obj[key] }), {})
}
