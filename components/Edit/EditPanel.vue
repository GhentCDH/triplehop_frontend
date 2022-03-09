<template>
  <b-card
    :title="panel.label"
    class="bg-light border-0 mb-3"
  >
    <form-element
      v-for="field in panel.fields"
      :id="field.field"
      :key="field.field"
      :config="config"
      :field="field"
      :value="formData[field.field.replace('$', '')]"
      :disabled="disabled"
      @input="$emit('input', $event)"
    />
  </b-card>
</template>
<script>
import FormElement from '~/components/Edit/FormElement.vue'

export default {
  components: {
    FormElement
  },
  props: {
    formData: {
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
    },
    disabled: {
      type: Boolean,
      required: true
    }
  }
}
</script>
