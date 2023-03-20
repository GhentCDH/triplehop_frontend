import { helpers } from 'vuelidate/lib/validators'

export const list = (allowedValues, multi) => {
  return (value) => {
    // Don't validate if empty value
    if (!helpers.req(value)) {
      return true
    }
    if (multi) {
      for (const val of value) {
        if (!(allowedValues.includes(val))) {
          return false
        }
      }
      return true
    } else {
      return allowedValues.includes(value)
    }
  }
}
