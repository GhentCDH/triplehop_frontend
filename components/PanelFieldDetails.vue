<template>
  <dd
    class="col-sm-9 col-lg-10"
  >
    <template
      v-if="fieldValue.length !== 0"
    >
      <geometry-field
        v-if="field.type === 'geometry'"
        :geometry="cleanFieldValue"
      />
      <b-link
        v-else-if="field.type === 'online_identifier'"
        :href="`${field.base_url}${cleanFieldValue}`"
        target="_blank"
      >
        {{ cleanFieldValue }}
      </b-link>
      <template
        v-else-if="field.type === 'list'"
      >
        <ul
          v-if="cleanFieldValue.length > 1"
        >
          <li
            v-for="(item, index) in cleanFieldValue"
            :key="index"
          >
            {{ item }}
          </li>
        </ul>
        <template v-else>
          {{ cleanFieldValue[0] }}
        </template>
      </template>
      <table-field
        v-else-if="field.type === 'table'"
        :data="cleanFieldValue"
      />
      <!-- TODO: move client-only to wikidata-images-field component (process.browser?)-->
      <client-only
        v-else-if="field.type === 'wikidata_images' || field.type === 'vooruit_image'"
      >
        <wikidata-images-field
          v-if="field.type === 'wikidata_images'"
          :wikidata-id="cleanFieldValue"
        />
        <vooruit-image-field
          v-if="field.type === 'vooruit_image'"
          :image-url="cleanFieldValue"
        />
      </client-only>
      <template v-else>
        {{ cleanFieldValue }}
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
    cleanFieldValue () {
      switch (this.field.type) {
        case 'geometry':
        case 'table':
          return JSON.parse(this.fieldValue[0])
        case 'online_identifier':
        case 'wikidata_images':
        case 'vooruit_image':
          return this.fieldValue[0]
        case 'list': {
          const cleanValue = []
          for (const value of this.fieldValue) {
            for (const dataValue of JSON.parse(value)) {
              cleanValue.push(dataValue)
            }
          }
          return cleanValue
        }
      }
      return this.fieldValue.join(', ')
    }
  }
}
</script>
