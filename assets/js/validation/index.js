import { helpers, required } from 'vuelidate/lib/validators'

import { edtf, edtfYear } from '~/assets/js/validation/edtf'
import { geometryPoint } from '~/assets/js/validation/geometry'
import { list } from '~/assets/js/validation/list'
import { table } from '~/assets/js/validation/table'

export const generateValidations = function (validators, multi = false) {
  const validation = {}
  if (validators) {
    for (const validator of validators) {
      if (validator.type === 'required') {
        validation.required = required
        continue
      }
      if (validator.type === 'regex') {
        validation.regex = helpers.regex('regex', new RegExp(validator.regex))
        continue
      }
      if (validator.type === 'edtf') {
        validation.edtf = edtf
        continue
      }
      if (validator.type === 'edtf_year') {
        validation.edtfYear = edtfYear
        continue
      }
      if (validator.type === 'geometry_point') {
        validation.geometryPoint = geometryPoint
        continue
      }
      if (validator.type === 'list') {
        validation.list = list(validator.allowed_values)
        continue
      }
      if (validator.type === 'table') {
        validation.table = table
        continue
      }
      // Don't allow submits with unimplemented validators
      validation.notImplemented = () => false
      console.error(`Validator of type ${validator.type} not yet implemented.`)
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
