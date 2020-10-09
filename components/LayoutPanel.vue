<template>
  <b-card
    :title="panel.label"
    class="bg-light border-0 mb-3"
  >
    <dl
      v-if="'fields' in panel"
      class="row mb-0"
    >
      <template
        v-for="(field, fieldIndex) in panel.fields"
      >
        <!-- TODO: let component update text-muted class (idea: emit loaded event) -->
        <dt
          :key="`field-label-${panelIndex}-${fieldIndex}`"
          class="col-sm-3 col-lg-2"
          :class="{'text-muted': data[field.field] == null}"
        >
          {{ field.label ? field.label : config.data[field.field].display_name }}
        </dt>
        <dd
          :key="`field-value-${panelIndex}-${fieldIndex}`"
          class="col-sm-9 col-lg-10"
        >
          <template
            v-if="data[field.field] != null"
          >
            <geometry-field
              v-if="field.type === 'geometry'"
              :geometry="data[field.field]"
            />
            <b-link
              v-else-if="field.type === 'online_identifier'"
              :href="`${field.base_url}${data[field.field]}`"
              target="_blank"
            >
              {{ data[field.field] }}
            </b-link>
            <template
              v-else-if="field.type === 'list'"
            >
              <ul
                v-if="data[field.field].length > 1"
              >
                <li
                  v-for="(item, index) in data[field.field]"
                  :key="index"
                >
                  {{ item }}
                </li>
              </ul>
              <template v-else>
                {{ data[field.field][0] }}
              </template>
            </template>
            <!-- TODO: move client-only to wikidata-images-field component (process.browser?)-->
            <client-only
              v-else-if="field.type === 'wikidata_images' || field.type === 'vooruit_image'"
            >
              <wikidata-images-field
                v-if="field.type === 'wikidata_images'"
                :wikidata-id="data[field.field]"
              />
              <vooruit-image-field
                v-if="field.type === 'vooruit_image'"
                :image-url="data[field.field]"
              />
            </client-only>
            <template v-else>
              {{ data[field.field] }}
            </template>
          </template>
        </dd>
      </template>
    </dl>
  </b-card>
</template>
<script>
import GeometryField from '~/components/GeometryField.vue'
import VooruitImageField from '~/components/VooruitImageField.vue'
import WikidataImagesField from '~/components/WikidataImagesField.vue'

export default {
  components: {
    GeometryField,
    VooruitImageField,
    WikidataImagesField
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    panel: {
      type: Object,
      required: true
    },
    panelIndex: {
      type: Number,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  }
}
</script>
