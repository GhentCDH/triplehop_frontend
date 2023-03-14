import { helpers, required } from 'vuelidate/lib/validators'

import { edtfYear } from '~/assets/js/validation/edtf'
import { geometryPoint } from '~/assets/js/validation/geometry'

export const generateValidations = function (validators, multi = false) {
  const validation = {}
  if (validators) {
    for (const validator of validators) {
      if (validator.type === 'required') {
        validation.required = required
      }
      if (validator.type === 'regex') {
        validation.regex = helpers.regex('regex', new RegExp(validator.regex))
      }
      if (validator.type === 'edtf_year') {
        validation.edtfYear = edtfYear
      }
      if (validator.type === 'geometry_point') {
        validation.geometryPoint = geometryPoint
      }
    }
  }
  if (multi) {
    return {
      values: {
        $each: validation
      }
    }
  }
  return {
    value: validation
  }
}
