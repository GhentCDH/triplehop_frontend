<template>
  <b-carousel
    controls
    indicators
    fade
    :interval="0"
  >
    <b-carousel-slide
      v-for="imageURL in imageURLs"
      :key="imageURL"
      :img-src="imageURL"
    />
  </b-carousel>
</template>
<script>
const baseURL = 'https://query.wikidata.org/sparql?query='
export default {
  props: {
    wikidataId: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      imageURLs: []
    }
  },
  async created () {
    const query = `
      SELECT ?image ?poster WHERE {
        OPTIONAL{wd:${this.wikidataId} wdt:P18 ?image.}
        OPTIONAL{wd:${this.wikidataId} wdt:P3383 ?poster.}
      }
    `
    const response = await this.$axios.get(
      `${baseURL}${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: 'application/sparql-results+json'
        },
        transformRequest: (data, headers) => {
          delete headers.common.Authorization
        }
      }
    )
    if (
      response.status === 200 &&
      'results' in response.data &&
      'bindings' in response.data.results
    ) {
      this.imageURLs = []
      for (const result of response.data.results.bindings) {
        for (const binding of ['image', 'poster']) {
          if (
            binding in result &&
            'type' in result[binding] &&
            result[binding].type === 'uri' &&
            'value' in result[binding]
          ) {
            this.imageURLs.push(result[binding].value.replace('http://', 'https://'))
          }
        }
      }
    }
  }
}
</script>
