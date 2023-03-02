<template>
  <b-card
    :id="`entity-${panel.label}`"
    :title="panel.label"
    class="bg-light border-0 mb-3"
  >
    <!-- TODO: sources edit (collapsible) -->
    <form-group
      v-for="field in panel.fields"
      :key="field.field"
      ref="formGroups"
      :field="field"
      :initial-value="JSON.stringify(formData[field.field.replace('$', '')])"
      :disabled="disabled"
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
    disabled: {
      type: Boolean,
      required: true
    },
    formData: {
      type: Object,
      required: true
    },
    panel: {
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
    invalid () {
      for (const formGroup of this.$refs.formGroups) {
        if (formGroup.invalid) {
          return true
        }
      }
      return false
    }
  },
  methods: {
    reset () {
      for (const formGroup of this.$refs.formGroups) {
        formGroup.reset()
      }
    },
    touch () {
      for (const formGroup of this.$refs.formGroups) {
        formGroup.touch()
      }
    }
  }
}
</script>
