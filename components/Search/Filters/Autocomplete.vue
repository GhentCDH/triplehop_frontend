<template>
  <vue-typeahead-bootstrap
    :id="`i_${systemName}`"
    v-model="compValue"
    :data="autocompleteData"
    :disable-sort="true"
    :show-all-results="true"
    :disabled="disabled"
    @input="autocompleteLookup"
    @hit="$emit('changed')"
    @keyup.enter.prevent="$emit('changed')"
  />
</template>

<script>
import VueTypeaheadBootstrap from 'vue-typeahead-bootstrap'

import { isArray, isObject } from '~/assets/js/utils'

export default {
  components: {
    VueTypeaheadBootstrap
  },
  props: {
    disabled: {
      type: Boolean,
      required: true
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
      type: String,
      default: null
    }
  },
  data () {
    return {
      autocompleteData: []
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
    isArray,
    isObject,
    async autocompleteLookup (val) {
      if (val == null) {
        this.autocompleteData = []
      }
      const response = await this.$axios.post(
        this.searchUrl,
        {
          suggest: {
            autocomplete: {
              prefix: val,
              completion: {
                field: `${this.systemName}.completion`,
                skip_duplicates: true,
                size: 10
              }
            }
          }
        }
      )
      if (
        response.status === 200 &&
        'suggest' in response.data &&
        'autocomplete' in response.data.suggest &&
        isArray(response.data.suggest.autocomplete) &&
        isObject(response.data.suggest.autocomplete[0]) &&
        'options' in response.data.suggest.autocomplete[0] &&
        isArray(response.data.suggest.autocomplete[0].options)
      ) {
        this.autocompleteData = response.data.suggest.autocomplete[0].options.map(o => o.text)
      } else {
        this.autocompleteData = []
      }
    }
  }
}
</script>
