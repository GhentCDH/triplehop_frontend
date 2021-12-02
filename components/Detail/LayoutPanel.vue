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
        <panel-field-term
          :key="`${fieldIndex}-term`"
          :config="config"
          :field="field"
          :field-value="fieldValue(field.field)"
        />
        <panel-field-details
          :key="`${fieldIndex}-details`"
          :field="field"
          :field-value="fieldValue(field.field)"
        />
      </template>
    </dl>
  </b-card>
</template>
<script>
import { constructFieldFromData } from '~/assets/js/utils'
import PanelFieldTerm from '~/components/Detail/PanelFieldTerm.vue'
import PanelFieldDetails from '~/components/Detail/PanelFieldDetails.vue'

export default {
  components: {
    PanelFieldTerm,
    PanelFieldDetails
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
    config: {
      type: Object,
      required: true
    },
    sourceTitlesConfig: {
      type: Object,
      default: () => {
        return null
      }
    }
  },
  data () {
    return {
      fieldValueCache: {}
    }
  },
  methods: {
    constructFieldFromData,
    fieldValue (field) {
      if (!(field in this.fieldValueCache)) {
        this.fieldValueCache[field] = this.constructFieldFromData(field, this.data, this.sourceTitlesConfig, {})
      }
      return this.fieldValueCache[field]
    }
  }
}
</script>
