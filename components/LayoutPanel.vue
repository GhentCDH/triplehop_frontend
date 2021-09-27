<template>
  <b-card
    :title="panel.label"
    class="bg-light border-0 mb-3"
  >
    <dl
      v-if="'fields' in panel"
      class="row mb-0"
    >
      <panel-item
        v-for="(field, fieldIndex) in panel.fields"
        :key="fieldIndex"
        :config="config"
        :data="data"
        :field="field"
        :source-titles-config="sourceTitlesConfig"
      />
    </dl>
  </b-card>
</template>
<script>
import PanelItem from '~/components/PanelItem.vue'

export default {
  components: {
    PanelItem
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
  }
}
</script>
