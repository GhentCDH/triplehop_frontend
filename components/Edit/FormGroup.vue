<template>
  <b-form-group
    :label="field.label ? field.label : config.data[id].display_name"
    :label-for="id"
  >
    <component
      :is="component_type(field)"
      :id="id"
      :field="field"
      :value="value"
      :vuelidate-element="vuelidate.formData[id]"
      @input="$emit('input', $event)"
    />
    <slot
      v-if="field.help_message"
      name="description"
    >
      <b-form-text v-html="marked(field.help_message)"/>
    </slot>
  </b-form-group>
</template>
<script>
import { marked } from 'marked'

import FormInput from '~/components/Edit/FormInput.vue'
import FormMultiInput from '~/components/Edit/FormMultiInput.vue'

export default {
  components: {
    FormInput,
    FormMultiInput
  },
  props: {
    config: {
      type: Object,
      required: true
    },
    field: {
      type: Object,
      required: true
    },
    value: {
      type: [Array, String],
      required: true
    },
    vuelidate: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      id: this.field.field.replace('$', '')
    }
  },
  methods: {
    component_type (field) {
      if (field.multi) {
        return 'form-multi-input'
      }
      return 'form-input'
    },
    marked (markdown) {
      return marked(markdown)
    }
  }
}
</script>
