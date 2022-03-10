import parse from 'edtf'
import { helpers } from 'vuelidate/lib/validators'

const edtfYear = function (value) {
  // Don't validate if empty value
  if (!helpers.req(value)) {
    return true
  }

  try {
    const parsed = parse(value)
    // values should only exactly 1 (year) part
    if (parsed.values.length !== 1) {
      console.log('error')
      return false
    }
  } catch (error) {
    console.log('error')
    return false
  }
  return true
}

export { edtfYear }
