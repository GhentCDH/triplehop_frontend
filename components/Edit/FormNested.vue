<template>
  <div v-frag>
    <multiselect
      :id="id"
      :value="value"
      :clear-on-select="false"
      label="value"
      :disabled="disabled"
      :multiple="false"
      :options="options"
      :internal-search="false"
      :loading="isLoading"
      :show-labels="false"
      track-by="key"
      :class="validateClass"
      @search-change="loadOptions"
      @input="onInput"
    />
    <form-feedback
      v-for="validator of validatorsWithError"
      :key="validator.type"
      :validator="validator"
    />
  </div>
</template>
<script>
import frag from 'vue-frag'
import Multiselect from 'vue-multiselect'
import { validationMixin } from 'vuelidate'

import { isArray } from '~/assets/js/utils'
import { generateValidations } from '~/assets/js/validation'
import FormFeedback from '~/components/Edit/FormFeedback.vue'

export default {
  directives: {
    frag
  },
  components: {
    FormFeedback,
    Multiselect
  },
  mixins: [
    validationMixin
  ],
  props: {
    id: {
      type: String,
      required: true
    },
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
      default: null
    },
    searchUrl: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      isLoading: true,
      options: [],
      value: this.getValue(this.initialValue)
    }
  },
  validations () {
    return generateValidations(this.field)
  },
  computed: {
    validatorsWithError () {
      if (this.field.validators == null) {
        return []
      }
      return this.field.validators.filter(v => !this.$v.value[v.type])
    },
    validateState () {
      // Only markup touched fields as correct or incorrect
      const { $dirty, $invalid } = this.$v.value
      return $dirty ? !$invalid : null
    },
    validateClass () {
      if (this.validateState == null) {
        return ''
      }
      return this.validateState ? 'is-valid' : 'is-invalid'
    }
  },
  watch: {
    initialValue () {
      const newValue = this.getValue(this.initialValue)
      if (
        (this.value == null && newValue.key != null) ||
        (this.value != null && newValue.key !== this.value.key)
      ) {
        // Reset
        this.value = newValue
        this.$v.$reset()
      }
    }
  },
  created () {
    this.loadOptions()
  },
  methods: {
    async loadOptions (input) {
      this.isLoading = true
      const response = await this.$axios.post(
        this.searchUrl,
        {
          field: this.id,
          value: input ?? ''
        }
      )
      if (
        response.status === 200 &&
        isArray(response.data)
      ) {
        this.options = response.data
      } else {
        this.options = []
      }
      this.isLoading = false
    },
    getValue (value) {
      const formValue = JSON.parse(value)
      return {
        key: formValue.id,
        value: formValue.title
      }
    },
    onInput (value) {
      this.value = value
      this.$v.value.$touch()
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: this.value
        }
      )
    }
  }
}
</script>
