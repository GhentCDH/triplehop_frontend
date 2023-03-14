import { helpers } from 'vuelidate/lib/validators'

const RE_LAT_LONG = /^[-]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/

export const geometryPoint = (value) => {
  // Don't validate if empty value
  if (!helpers.req(value)) {
    return true
  }

  if (value.match(RE_LAT_LONG)) {
    return true
  }
  return false
}
