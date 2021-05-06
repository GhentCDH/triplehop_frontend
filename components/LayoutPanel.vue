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
        <!-- TODO: don't call constructFieldFromData multiple types -->
        <dt
          :key="`field-label-${panelIndex}-${fieldIndex}`"
          class="col-sm-3 col-lg-2"
          :class="{'text-muted': constructFieldFromData(field.field, data).length === 0}"
        >
          {{ field.label ? field.label : config.data[field.field.replace('$', '')].display_name }}
        </dt>
        <dd
          :key="`field-value-${panelIndex}-${fieldIndex}`"
          class="col-sm-9 col-lg-10"
        >
          <template
            v-if="constructFieldFromData(field.field, data).length !== 0"
          >
            <geometry-field
              v-if="field.type === 'geometry'"
              :geometry="constructFieldFromData(field.field, data)[0]"
            />
            <b-link
              v-else-if="field.type === 'online_identifier'"
              :href="`${field.base_url}${constructFieldFromData(field.field, data)}`"
              target="_blank"
            >
              {{ constructFieldFromData(field.field, data) }}
            </b-link>
            <template
              v-else-if="field.type === 'list'"
            >
              <ul
                v-if="constructFieldFromData(field.field, data).length > 1"
              >
                <li
                  v-for="(item, index) in constructFieldFromData(field.field, data)"
                  :key="index"
                >
                  {{ item }}
                </li>
              </ul>
              <template v-else>
                {{ constructFieldFromData(field.field, data)[0] }}
              </template>
            </template>
            <!-- TODO: move client-only to wikidata-images-field component (process.browser?)-->
            <client-only
              v-else-if="field.type === 'wikidata_images' || field.type === 'vooruit_image'"
            >
              <wikidata-images-field
                v-if="field.type === 'wikidata_images'"
                :wikidata-id="constructFieldFromData(field.field, data)"
              />
              <vooruit-image-field
                v-if="field.type === 'vooruit_image'"
                :image-url="constructFieldFromData(field.field, data)"
              />
            </client-only>
            <template v-else>
              {{ constructFieldFromData(field.field, data).join(', ') }}
            </template>
          </template>
        </dd>
      </template>
    </dl>
  </b-card>
</template>
<script>
import { constructFieldFromData } from '~/assets/js/utils'
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
  },
  methods: {
    constructFieldFromData
  }
}
</script>
