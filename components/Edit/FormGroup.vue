<template>
  <b-form-group
    :label="field.label"
    :label-for="id"
  >
    <component
      :is="component_type(field)"
      :id="id"
      ref="input"
      :disabled="disabled"
      :field="field"
      :initial-value="initialValue"
      v-bind="componentProps"
      @input="$emit('input', $event)"
    />
    <slot
      v-if="field.help_message"
      name="description"
    >
      <!-- eslint-disable-next-line vue/no-v-html vue/no-v-text-v-html-on-component -->
      <b-form-text v-html="marked(field.help_message)" />
    </slot>
  </b-form-group>
</template>
<script>
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

import FormDropdown from '~/components/Edit/FormDropdown.vue'
import FormGeometry from '~/components/Edit/FormGeometry.vue'
import FormInput from '~/components/Edit/FormInput.vue'
import FormMultiInput from '~/components/Edit/FormMultiInput.vue'
import FormNested from '~/components/Edit/FormNested.vue'
import FormTextArea from '~/components/Edit/FormTextArea.vue'

export default {
  components: {
    FormDropdown,
    FormGeometry,
    FormInput,
    FormMultiInput,
    FormNested,
    FormTextArea
  },
  props: {
    disabled: {
      type: Boolean,
      required: true
    },
    field: {
      type: Object,
      required: true
    },
    initialValue: {
      // JSON representation
      type: String,
      default: () => { return null }
    },
    componentProps: {
      type: Object,
      default: () => { return {} }
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
      if (field.type === 'geometry') {
        return 'form-geometry'
      }
      if (field.type === 'nested') {
        return 'form-nested'
      }
      if (field.type === 'textarea') {
        return 'form-text-area'
      }
      if (field.multi) {
        return 'form-multi-input'
      }
      return 'form-input'
    },
    marked (markdown) {
      return sanitizeHtml(marked(markdown))
    },
    reset () {
      this.$refs.input.$v.$reset()
    },
    touch () {
      this.$refs.input.$v.$touch()
    }
  }
}
</script>
