<template>
  <dd
    class="col-sm-9 col-lg-10"
  >
    <template
      v-if="fieldValue.length !== 0"
    >
      <geometry-field
        v-if="field.type === 'geometry'"
        :value-and-sources="cleanValueAndSources.value"
      />
      <b-link
        v-else-if="field.type === 'online_identifier'"
        :href="`${field.base_url}${cleanValueAndSources.value}`"
        target="_blank"
      >
        {{ cleanValueAndSources.value }}
      </b-link>
      <template
        v-else-if="field.type === 'list'"
      >
        <ul
          v-if="cleanValueAndSources.length > 1"
        >
          <li
            v-for="(item, index) in cleanValueAndSources"
            :key="index"
          >
            {{ item.value }}
            <sources :sources="item.sources" />
          </li>
        </ul>
        <template v-else>
          {{ cleanValueAndSources[0].value }}
          <sources :sources="cleanValueAndSources[0].sources" />
        </template>
      </template>
      <table-field
        v-else-if="field.type === 'table'"
        :value-and-sources="cleanValueAndSources"
      />
      <!-- TODO: move client-only to wikidata-images-field component (process.browser?)-->
      <client-only
        v-else-if="field.type === 'iiif_manifest' || field.type === 'vooruit_image' || field.type === 'wikidata_images'"
      >
        <iiif-manifest-field
          v-if="field.type === 'iiif_manifest'"
          :value-and-sources="cleanValueAndSources"
        />
        <vooruit-image-field
          v-if="field.type === 'vooruit_image'"
          :value-and-sources="cleanValueAndSources"
        />
        <wikidata-images-field
          v-if="field.type === 'wikidata_images'"
          :value-and-sources="cleanValueAndSources"
        />
      </client-only>
      <filmmagie-field
        v-else-if="field.type === 'filmmagie'"
        :value-and-sources="cleanValueAndSources"
      />
      <template
        v-else-if="field.type === 'link'"
      >
        <b-link
          v-if="cleanValueAndSources.value !== 'n/a'"
          :href="cleanValueAndSources.value"
          target="_blank"
        >
          {{ cleanValueAndSources.value }}
        </b-link>
        <template v-else>
          {{ cleanValueAndSources.value }}
        </template>
      </template>
      <template
        v-else-if="field.type === 'text_flatten'"
      >
        <span
          v-for="(item, index) in cleanValueAndSources"
          :key="index"
        >
          {{ item.value }}<sources :sources="item.sources" /><template v-if="index != cleanValueAndSources.length -1">, </template>
        </span>
      </template>
      <span v-else>
        <span class="preserve-whitespace">{{ cleanValueAndSources.value }}</span>
        <sources :sources="cleanValueAndSources.sources" />
      </span>
    </template>
  </dd>
</template>

<script>
import IiifManifestField from '~/components/Detail/IiifManifestField.vue'
import FilmmagieField from '~/components/Detail/FilmmagieField.vue'
import GeometryField from '~/components/Detail/GeometryField.vue'
import TableField from '~/components/Detail/TableField.vue'
import VooruitImageField from '~/components/Detail/VooruitImageField.vue'
import WikidataImagesField from '~/components/Detail/WikidataImagesField.vue'
import Sources from '~/components/Detail/Sources.vue'

export default {
  components: {
    IiifManifestField,
    FilmmagieField,
    GeometryField,
    TableField,
    VooruitImageField,
    WikidataImagesField,
    Sources
  },
  props: {
    field: {
      type: Object,
      required: true
    },
    fieldValue: {
      type: Array,
      required: true
    }
  },
  computed: {
    cleanValueAndSources () {
      switch (this.field.type) {
        case 'geometry':
        case 'table':
          return {
            value: JSON.parse(this.fieldValue[0].value),
            sources: this.fieldValue[0].sources
          }
        case 'iiif_manifest':
        case 'online_identifier':
        case 'wikidata_images':
        case 'vooruit_image':
        case 'link':
          return this.fieldValue[0]
        case 'filmmagie':
        case 'list':
        case 'text_flatten':
          return this.fieldValue
      }
      return this.fieldValue[0]
    }
  }
}
</script>
