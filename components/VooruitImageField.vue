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
      <template v-if="attribution">
        <strong>Attribution</strong>
        <br>
        {{ attribution }}
        <br>
        Hosted by Ghent University Library
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
    imageUrl: {
      type: String,
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
      linkUrl: null
    }
  },
  async created () {
    const urlRegexp = /^https:[/][/]adore[.]ugent[.]be[/]IIIF[/]images[/]archive[.]ugent[.]be:(?<id>[A-F0-9-]+):DS[.]0_(?<page>[0-9])+[/](?<x>[0-9]*)%2C(?<y>[0-9]*)%2C(?<w>[0-9]*)%2C(?<h>[0-9]*)[/]full[/]0[/]default[.]jpg$/
    const groups = urlRegexp.exec(this.imageUrl).groups

    const response = await this.$axios.get(
      `https://adore.ugent.be/IIIF/manifests/archive.ugent.be:${groups.id}/canvases/DS.0_${groups.page}`, {
        transformRequest: (data, headers) => {
          delete headers.common.Authorization
        }
      }
    )
    if (
      response.status === 200 &&
      '@id' in response.data
    ) {
      if ('attribution' in response.data) {
        this.attribution = response.data.attribution
      }
      this.displayUrl = `https://adore.ugent.be/IIIF/images/archive.ugent.be:${groups.id}:DS.0_${groups.page}/${groups.x},${groups.y},${groups.w},${groups.h}/${this.size},/0/default.jpg`
      const cv = parseInt(groups.page) - 1
      this.linkUrl = `https://adore.ugent.be/IIIF/internal/viewer/archive.ugent.be:${groups.id}#?c=&m=&s=&cv=${cv}&xywh=${groups.x},${groups.y},${groups.w},${groups.h}`
    }
  }
}
</script>
