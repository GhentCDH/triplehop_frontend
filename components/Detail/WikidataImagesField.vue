<template>
  <div>
    <b-row
      v-for="(image, index) in images"
      :key="index"
    >
      <b-col md="3">
        <b-img
          v-if="!image.error"
          fluid
          :src="image.thumbUrl"
          @error="image.error = true"
          @load="image.loaded = true"
        />
        <template v-if="image.error">
          There was a problem while loading this image.
        </template>
      </b-col>
      <b-col md="9">
        <b-link
          v-if="image.loaded || image.error"
          :href="image.linkUrl"
          target="_blank"
        >
          <b-icon icon="box-arrow-up-right" />
          View complete source
        </b-link>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import MD5 from 'crypto-js/md5'

const baseURL = 'https://query.wikidata.org/sparql?query='
export default {
  props: {
    valueAndSources: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      images: []
    }
  },
  computed: {
    wikidataId () {
      return this.valueAndSources.value
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
          delete headers.Authorization
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
            const url = result[binding].value.replace('http://', 'https://')
            const fileName = decodeURIComponent(url.substr(url.lastIndexOf('/') + 1)).replaceAll(' ', '_')
            const hash = MD5(fileName).toString()
            this.images.push({
              error: false,
              linkUrl: `https://commons.wikimedia.org/wiki/File:${fileName}`,
              loaded: false,
              thumbUrl: `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash.substr(0, 1)}/${hash.substr(0, 2)}/${fileName}/200px-${fileName}`
            })
          }
        }
      }
    }
  }
}
</script>
