import parse from 'edtf'
import { helpers } from 'vuelidate/lib/validators'

export const edtf = (value) => {
  // Don't validate if empty value
  if (!helpers.req(value)) {
    return true
  }

  try {
    parse(value)
  } catch (error) {
    return false
  }
  return true
}

export const edtfYear = (value) => {
  // Don't validate if empty value
  if (!helpers.req(value)) {
    return true
  }

  try {
    const parsed = parse(value)
    // values should contain only exactly 1 part (year)
    if (parsed.values.length !== 1) {
      return false
    }
  } catch (error) {
    return false
  }
  return true
}
