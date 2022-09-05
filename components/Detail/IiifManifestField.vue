<template>
  <b-row>
    <b-col md="3">
      <b-img
        v-if="!imageError"
        :src="displayUrl"
        @error="imageError = true"
      />
      <template v-if="imageError">
        This content can only be viewed from the Ghent University network.
      </template>
    </b-col>
    <b-col md="9">
      <template v-if="attribution || hosted">
        <strong>Attribution</strong>
        <br>
      </template>
      <template v-if="attribution">
        {{ attribution }}
        <br>
      </template>
      <template v-if="hosted">
        {{ hosted }}
        <br>
      </template>
      <b-link
        :href="linkUrl"
        target="_blank"
      >
        <b-icon icon="box-arrow-up-right" />
        View complete source
      </b-link>
    </b-col>
  </b-row>
</template>

<script>

export default {
  props: {
    valueAndSources: {
      type: Object,
      required: true
    },
    size: {
      type: Number,
      default: 200
    }
  },
  data () {
    return {
      attribution: null,
      displayUrl: null,
      imageError: false,
      hosted: null,
      linkUrl: null
    }
  },
  computed: {
    manifestUrl () {
      return decodeURIComponent(this.valueAndSources.value)
    }
  },
  async created () {
    if (this.manifestUrl.includes('https://api.collectie.gent/iiif/presentation/v2/manifest/archiefgent:')) {
      this.linkUrl = this.manifestUrl.replace(
        'https://api.collectie.gent/iiif/presentation/v2/manifest/archiefgent:',
        'https://data.collectie.gent/entity/archiefgent:'
      )
      this.hosted = 'Hosted by Collectie van de Gentenaar'
    } else if (this.manifestUrl.includes('https://adore.ugent.be/IIIF/manifests/archive.ugent.be:')) {
      this.linkUrl = this.manifestUrl.replace(
        'https://adore.ugent.be/IIIF/manifests/archive.ugent.be:',
        'https://lib.ugent.be/viewer/archive.ugent.be:'
      )
      this.hosted = 'Hosted by Ghent University Library'
    }
    const response = await this.$axios.get(
      this.manifestUrl, {
        transformRequest: (data, headers) => {
          delete headers.Authorization
          delete headers.common.Authorization
        }
      }
    )
    if (
      response.status === 200 &&
      'sequences' in response.data &&
      response.data.sequences.length &&
      'canvases' in response.data.sequences[0] &&
      response.data.sequences[0].canvases.length
    ) {
      if ('thumbnail' in response.data.sequences[0].canvases[0]) {
        this.displayUrl = response.data.sequences[0].canvases[0].thumbnail['@id']
      } else {
        this.displayUrl = response.data.sequences[0].canvases[0].images[0].resource['@id'].replace('full/full', 'full/226,')
      }
      if ('attribution' in response.data.sequences[0].canvases[0]) {
        this.attribution = response.data.sequences[0].canvases[0].attribution
      }
      if ('attribution' in response.data.sequences[0].canvases[0].images[0]) {
        this.attribution = response.data.sequences[0].canvases[0].images[0].attribution
      }
    }
  }
}
</script>
