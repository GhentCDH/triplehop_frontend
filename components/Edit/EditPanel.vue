<template>
  <b-card
    :title="panel.label"
    class="bg-light border-0 mb-3"
  >
    <form-group
      v-for="field in panel.fields"
      :key="field.field"
      :config="config"
      :field="field"
      :value="formData[field.field.replace('$', '')]"
      :disabled="disabled"
      :vuelidate="vuelidate[field.field.replace('$', '')]"
      @input="$emit('input', $event)"
    />
  </b-card>
</template>
<script>
import FormGroup from '~/components/Edit/FormGroup.vue'

export default {
  components: {
    FormGroup
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
    },
    vuelidate: {
      type: Object,
      required: true
    }
  }
}
</script>
