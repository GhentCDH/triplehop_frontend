<template>
  <multiselect
    v-if="aggregationData != null"
    v-model="compValue"
    :clear-on-select="false"
    :disabled="disabled"
    label="value"
    :multiple="true"
    :options="options"
    :internal-search="false"
    :loading="isLoading"
    :show-labels="false"
    track-by="key"
    @close="multiselectClose"
    @input="multiselectInput"
    @open="multiselectOpen"
    @search-change="updateOptions"
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

import { isArray } from '~/assets/js/utils'

export default {
  components: {
    Multiselect
  },
  props: {
    aggregationData: {
      type: Array,
      default: () => {
        return []
      }
    },
    disabled: {
      type: Boolean,
      required: true
    },
    filters: {
      type: Object,
      default: () => {
        return null
      }
    },
    searchUrl: {
      type: String,
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
      options: this.aggregationData,
      isLoading: false,
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
  watch: {
    aggregationData () {
      this.options = this.aggregationData
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
    },
    async updateOptions (input) {
      if (input === '') {
        this.options = this.aggregationData
        return
      }
      this.isLoading = true
      const response = await this.$axios.post(
        this.searchUrl,
        {
          filters: this.filters,
          field: this.systemName,
          value: input
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
    }
  }
}
</script>
