<template>
  <b-form-invalid-feedback>
    <template v-if="validator.error_message">
      {{ validator.error_message }}
    </template>
    <template v-else-if="validatorType === 'required'">
      This field is required.
    </template>
    <template v-else>
      The value provided for this field is invalid.
    </template>
  </b-form-invalid-feedback>
</template>
<script>
export default {
  props: {
    validator: {
      type: Object,
      required: true
    },
    validatorType: {
      type: String,
      required: true
    }
  }
}
</script>
