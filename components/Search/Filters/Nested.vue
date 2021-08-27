<template>
  <multiselect
    v-if="aggregationData != null"
    v-model="compValue"
    :clear-on-select="false"
    :disabled="disabled"
    label="name"
    :multiple="true"
    :options="aggregationData"
    :preserve-search="true"
    :show-labels="false"
    track-by="id"
    @close="multiselectClose"
    @input="multiselectInput"
    @open="multiselectOpen"
  >
    <template slot="option" slot-scope="props">
      {{ props.option.name }}
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
      type: Array,
      default: null
    }
  },
  data () {
    return {
      state: null
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
  },
  methods: {
    multiselectClose () {
      this.state = 'closed'
      this.$emit('changed')
    },
    multiselectInput () {
      if (this.state !== 'open') {
        this.$emit('changed')
      }
    },
    multiselectOpen () {
      this.state = 'open'
    }
  }
}
</script>
