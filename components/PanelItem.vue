<template>
  <div v-frag>
    <panel-field-term
      :config="config"
      :field="field"
      :field-value="fieldValue"
    />
    <panel-field-details
      :field="field"
      :field-value="fieldValue"
    />
  </div>
</template>
<script>
import frag from 'vue-frag'

import { constructFieldFromData } from '~/assets/js/utils'
import PanelFieldTerm from '~/components/PanelFieldTerm.vue'
import PanelFieldDetails from '~/components/PanelFieldDetails.vue'

export default {
  directives: {
    frag
  },
  components: {
    PanelFieldTerm,
    PanelFieldDetails
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    field: {
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
  computed: {
    fieldValue () {
      return this.constructFieldFromData(this.field.field, this.data, this.sourceTitlesConfig)
    }
  },
  methods: {
    constructFieldFromData
  }
}
</script>
