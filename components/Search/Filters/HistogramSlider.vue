<template>
  <div
    v-if="histogramData != null"
    v-frag
  >
    <vue-slider
      v-if="valid"
      v-model="compValue"
      class="mt-5"
      :min="range.min"
      :max="range.max"
      :dot-options="sliderDotOptions"
      :process-style="sliderProcessStyle"
      :tooltip-style="sliderTooltipStyle"
      tooltip="always"
      @drag-end="$emit('changed')"
    />
    <vue-slider v-else class="mt-5" />
    <histogram
      :chart-data="histogramData"
    />
  </div>
</template>

<script>
import 'vue-slider-component/dist-css/vue-slider-component.css'
import 'vue-slider-component/theme/default.css'
import frag from 'vue-frag'

import VueSlider from 'vue-slider-component/dist-css/vue-slider-component.umd.min.js'
import Histogram from '~/components/Histogram'
import { COLOR_PRIMARY } from '~/assets/js/variables'

export default {
  directives: {
    frag
  },
  components: {
    Histogram,
    VueSlider
  },
  props: {
    disabled: {
      type: Boolean,
      required: true
    },
    histogramData: {
      type: Object,
      default: () => {
        return null
      }
    },
    range: {
      type: Object,
      default: () => {
        return {
          min: null,
          max: null
        }
      }
    },
    systemName: {
      type: String,
      required: true
    },
    value: {
      type: Array,
      default: () => {
        return null
      }
    }
  },
  data () {
    return {
      sliderDotOptions: {
        focusStyle: {
          'box-shadow': `0px 0px 1px 2px ${COLOR_PRIMARY}`
        }
      },
      sliderProcessStyle: {
        backgroundColor: COLOR_PRIMARY
      },
      sliderTooltipStyle: {
        backgroundColor: COLOR_PRIMARY,
        borderColor: COLOR_PRIMARY
      }
    }
  },
  computed: {
    compValue: {
      get () {
        const val = []
        if (this.value == null || this.value[0] == null) {
          val[0] = this.range.min
        } else {
          val[0] = this.value[0]
        }
        if (this.value == null || this.value[1] == null) {
          val[1] = this.range.max
        } else {
          val[1] = this.value[1]
        }
        return val
      },
      set (val) {
        if (val == null) {
          val = []
        }
        if (val[0] == null || val[0] < this.range.min) {
          val[0] = this.range.min
        }
        if (val[1] == null || val[1] > this.range.max) {
          val[1] = this.range.max
        }
        if (JSON.stringify(val) !== JSON.stringify(this.value)) {
          this.$emit('input', val)
        }
      }
    },
    valid () {
      if (this.range == null) {
        return false
      }
      if (this.range.min == null) {
        return false
      }
      if (this.range.max == null) {
        return false
      }
      if (this.value != null) {
        if (this.value[0] != null && this.value[0] < this.range.min) {
          return false
        }
        if (this.value[0] != null && this.value[0] > this.range.max) {
          return false
        }
      }
      return true
    }
  }
}
</script>
