<template>
  <multiselect
    v-if="aggregationData != null"
    v-model="compValue"
    :disabled="disabled"
    label="value"
    :options="aggregationData"
    :show-labels="false"
    track-by="id"
    @input="$emit('changed')"
  >
    <template slot="option" slot-scope="props">
      {{ props.option.value }}
      <b-badge :pill="true">
        {{ props.option.count }}
      </b-badge>
    </template>
  </multiselect>
</template>
<script>
import Multiselect from 'vue-multiselect'

export default {
  components: {
    Multiselect
  },
  props: {
    aggregationData: {
      type: Array,
      default: () => {
        return null
      }
    },
    disabled: {
      type: Boolean,
      required: true
    },
    systemName: {
      type: String,
      required: true
    },
    value: {
      type: Object,
      default: null
    }
  },
  computed: {
    compValue: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    }
  }
}
</script>
