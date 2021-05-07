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
          :key="`field-term-${fieldIndex}`"
          :config="config"
          :field="field"
          :field-value="fieldValues[field.field]"
        />
        <panel-field-details
          :key="`field-details-${fieldIndex}`"
          :field="field"
          :field-value="fieldValues[field.field]"
        />
      </template>
    </dl>
  </b-card>
</template>
<script>
import { constructFieldFromData } from '~/assets/js/utils'
import PanelFieldTerm from '~/components/PanelFieldTerm.vue'
import PanelFieldDetails from '~/components/PanelFieldDetails.vue'

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
    panelIndex: {
      type: Number,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  },
  computed: {
    fieldValues () {
      const fieldValues = {}
      for (const field of this.panel.fields) {
        fieldValues[field.field] = this.constructFieldFromData(field.field, this.data)
      }
      return fieldValues
    }
  },
  methods: {
    constructFieldFromData
  }
}
</script>
