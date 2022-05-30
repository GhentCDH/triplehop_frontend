<template>
  <b-form-group
    :label="field.label ? field.label : config.data[id].display_name"
    :label-for="id"
  >
    <component
      :is="component_type(field)"
      :id="id"
      ref="input"
      :field="field"
      :initial-value="initialValue"
      @input="$emit('input', $event)"
    />
    <slot
      v-if="field.help_message"
      name="description"
    >
      <b-form-text v-html="marked(field.help_message)" />
    </slot>
  </b-form-group>
</template>
<script>
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

import FormDropdown from '~/components/Edit/FormDropdown.vue'
import FormInput from '~/components/Edit/FormInput.vue'
import FormMultiInput from '~/components/Edit/FormMultiInput.vue'

export default {
  components: {
    FormDropdown,
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
    initialValue: {
      type: [Array, String],
      required: true
    }
  },
  data () {
    return {
      id: this.field.field.replace('$', '')
    }
  },
  computed: {
    invalid () {
      return this.$refs.input.$v.$invalid
    }
  },
  methods: {
    component_type (field) {
      if (field.type === 'dropdown') {
        return 'form-dropdown'
      }
      if (field.multi) {
        return 'form-multi-input'
      }
      return 'form-input'
    },
    marked (markdown) {
      return sanitizeHtml(marked(markdown))
    },
    touch () {
      this.$refs.input.$v.$touch()
    }
  }
}
</script>
