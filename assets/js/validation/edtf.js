import parse from 'edtf'
import { helpers } from 'vuelidate/lib/validators'

export const edtfYear = (value) => {
  // Don't validate if empty value
  if (!helpers.req(value)) {
    return true
  }

  try {
    const parsed = parse(value)
    // values should be only exactly 1 (year) part
    if (parsed.values.length !== 1) {
      return false
    }
  } catch (error) {
    return false
  }
  return true
}
