<template>
  <b-container>
    {{ data.Film.title }}
  </b-container>
</template>

<script>
import axios from 'axios'
import { capitalizeFirstLetter, isNumber } from '~/assets/js/utils'

export default {
  validate ({ params }) {
    // Make sure id is a number
    if (!isNumber(params.id)) {
      return false
    }
    return true
  },
  async asyncData ({ params }) {
    // TODO: get project config (from cache), get fields from project config
    // TODO (backend): allow fields to be ordered
    const response = await axios.post(
      `http://localhost:8000/v1/${params.project_name}`,
      {
        query: `
            {
              ${capitalizeFirstLetter(params.entity_type_name)}(id: ${params.id}) {
                title
                year
              }
            }
          `
      }
    )
    return response.data.data
  },
  head () {
    // Set Meta Tags for this Page
  }
}
</script>
