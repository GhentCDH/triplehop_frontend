import { helpers } from 'vuelidate/lib/validators'

export const list = (list) => {
  return (value) => {
    // Don't validate if empty value
    if (!helpers.req(value)) {
      return true
    }
    if (list.includes(value)) {
      return true
    }
    return false
  }
}
