<template>
  <div v-frag>
    <b-form-input
      :id="id"
      :value="value"
      :state="validateState"
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
// TODO: edit other geometry types
// Currently only point geometries are supported
import frag from 'vue-frag'
import { validationMixin } from 'vuelidate'
import { required } from 'vuelidate/lib/validators'

import FormFeedback from '~/components/Edit/FormFeedback.vue'
import { geometryPoint } from '~/assets/js/validators/geometry'

export default {
  directives: {
    frag
  },
  components: {
    FormFeedback
  },
  mixins: [
    validationMixin
  ],
  props: {
    id: {
      type: String,
      required: true
    },
    field: {
      type: Object,
      required: true
    },
    initialValue: {
      // JSON representation
      type: String,
      required: true
    }
  },
  data () {
    return {
      value: this.getValue(this.initialValue)
    }
  },
  validations () {
    const validations = {
      value: {}
    }
    const validators = this.field.validators
    if (validators) {
      for (const validator of validators) {
        if (validator.type === 'required') {
          validations.value.required = required
        }
        if (validator.type === 'geometry_point') {
          validations.value.geometryPoint = geometryPoint
        }
      }
    }
    return validations
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
        this.value = JSON.parse(this.initialValue)
        this.$v.$reset()
      }
    }
  },
  methods: {
    getValue (value) {
      const formValue = JSON.parse(value)
      if (formValue == null || formValue === '') {
        return null
      }
      return `${formValue.coordinates[1]},${formValue.coordinates[0]}`
    },
    onInput (value) {
      this.value = value
      this.$v.value.$touch()

      if (this.value === '') {
        this.$emit(
          'input',
          {
            systemName: this.id,
            value: this.value
          }
        )
        return
      }

      const coordinates = this.value.split(',')
      this.$emit(
        'input',
        {
          systemName: this.id,
          value: {
            type: 'Point',
            coordinates: [
              parseFloat(coordinates[1]),
              parseFloat(coordinates[0])
            ]
          }
        }
      )
    }
  }
}
</script>
