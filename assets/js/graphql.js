import { capitalizeFirstLetter } from '~/assets/js/utils'

export function createEntityQuery (entityTypeName, id, fieldNames) {
  const queryParts = [
    '{',
    `${capitalizeFirstLetter(entityTypeName)}(id: ${id}){`
  ]
  queryParts.push(...fieldNames)
  queryParts.push(
    '}',
    '}'
  )
  return queryParts.join('\n')
}
