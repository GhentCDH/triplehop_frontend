<template>
  <div v-frag>
    <b-form-invalid-feedback
      v-if="validator.error_message"
      v-html="marked(validator.error_message)"
    />
    <b-form-invalid-feedback v-else-if="validator.type === 'required'">
      This field is required.
    </b-form-invalid-feedback>
    <b-form-invalid-feedback v-else>
      The value provided for this field is invalid.
    </b-form-invalid-feedback>
  </div>
</template>
<script>
import frag from 'vue-frag'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

export default {
  directives: {
    frag
  },
  props: {
    validator: {
      type: Object,
      required: true
    }
  },
  methods: {
    marked (markdown) {
      return sanitizeHtml(marked(markdown))
    }
  }
}
</script>
