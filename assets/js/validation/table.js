import { helpers } from 'vuelidate/lib/validators'

export const table = (value) => {
  // Don't validate if empty value
  if (!helpers.req(value)) {
    return true
  }
  let parsed
  try {
    parsed = JSON.parse(value)
  } catch (error) {
    return false
  }
  // Table must be an array; at least header row must be present
  if (
    !(Array.isArray(parsed)) ||
    parsed.length < 2
  ) {
    return false
  }
  const rowLength = parsed[0].length
  for (const row of parsed) {
    // All rows in the table must be arrays and be of equal length
    if (
      !(Array.isArray(row)) ||
      row.length !== rowLength
    ) {
      return false
    }
    for (const cell in row) {
      // All cells in a row must be strings
      if (typeof cell !== 'string') {
        return false
      }
    }
  }
  return true
}
