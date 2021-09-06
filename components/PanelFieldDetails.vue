<template>
  <dd
    class="col-sm-9 col-lg-10"
  >
    <template
      v-if="fieldValue.length !== 0"
    >
      <geometry-field
        v-if="field.type === 'geometry'"
        :geometry="cleanValueAndSources.value"
      />
      <b-link
        v-else-if="field.type === 'online_identifier'"
        :href="`${field.base_url}${cleanValueAndSources}`"
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
            {{ cleanValueAndSources.value }}
          </li>
        </ul>
        <template v-else>
          {{ cleanValueAndSources[0].value }}
        </template>
      </template>
      <table-field
        v-else-if="field.type === 'table'"
        :data="cleanValueAndSources.value"
      />
      <!-- TODO: move client-only to wikidata-images-field component (process.browser?)-->
      <client-only
        v-else-if="field.type === 'wikidata_images' || field.type === 'vooruit_image'"
      >
        <wikidata-images-field
          v-if="field.type === 'wikidata_images'"
          :wikidata-id="cleanValueAndSources.value"
        />
        <vooruit-image-field
          v-if="field.type === 'vooruit_image'"
          :image-url="cleanValueAndSources.value"
        />
      </client-only>
      <template v-else>
        {{ cleanValueAndSources.value }}
      </template>
    </template>
  </dd>
</template>

<script>
import GeometryField from '~/components/GeometryField.vue'
import TableField from '~/components/TableField.vue'
import VooruitImageField from '~/components/VooruitImageField.vue'
import WikidataImagesField from '~/components/WikidataImagesField.vue'

export default {
  components: {
    GeometryField,
    TableField,
    VooruitImageField,
    WikidataImagesField
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
      console.log(this.fieldValue)
      switch (this.field.type) {
        case 'geometry':
        case 'table':
          return {
            value: JSON.parse(this.fieldValue[0].value),
            sources: this.fieldValue[0].sources
          }
        case 'online_identifier':
        case 'wikidata_images':
        case 'vooruit_image':
          return this.fieldValue[0]
        case 'list': {
          const cleanValue = []
          for (const value of this.fieldValue) {
            cleanValue.push(value)
          }
          return cleanValue
        }
      }
      return this.fieldValue
    }
  }
}
</script>
