<template>
  <b-form-group
    :label="filter.displayName"
    :label-for="`i_${filter.systemName}`"
  >
    <vue-typeahead-bootstrap
      v-if="
        filter.type === 'autocomplete' &&
          autocompleteData[filter.systemName] != null
      "
      :id="`i_${filter.systemName}`"
      v-model="form[filter.systemName]"
      :data="autocompleteData[filter.systemName]"
      :disable-sort="true"
      :show-all-results="true"
      :disabled="disableFormElements"
      @input="autocompleteLookup(filter.systemName)"
      @hit="searchQueryChanged"
      @keyup.enter.prevent="searchQueryChanged"
    />
    <template
      v-if="
        filter.type === 'histogram_slider' &&
          aggs != null &&
          aggs[`${filter.systemName}_hist`] != null
      "
    >
      <vue-slider
        v-if="
          fullRangeData[`${filter.systemName}_min`] != null &&
            fullRangeData[`${filter.systemName}_max`] != null
        "
        v-model="form[filter.systemName]"
        class="mt-5"
        :min="fullRangeData[`${filter.systemName}_min`]"
        :max="fullRangeData[`${filter.systemName}_max`]"
        :dot-options="sliderDotOptions"
        :process-style="sliderProcessStyle"
        :tooltip-style="sliderTooltipStyle"
        tooltip="always"
        @drag-end="searchQueryChanged"
      />
      <vue-slider v-else class="mt-5" />
      <histogram :chart-data="aggs[`${filter.systemName}_hist`]" />
    </template>
    <multiselect
      v-if="
        filter.type === 'nested' &&
          aggs != null &&
          aggs[filter.systemName] != null
      "
      v-model="form[filter.systemName]"
      :clear-on-select="false"
      :close-on-select="false"
      :disabled="disableFormElements"
      label="name"
      :multiple="true"
      :options="aggs[filter.systemName]"
      :preserve-search="true"
      :show-labels="false"
      track-by="id"
      @close="multiselectClose(filter.systemName)"
      @input="multiselectInput(filter.systemName)"
      @open="multiselectOpen(filter.systemName)"
    >
      <template slot="option" slot-scope="props">
        {{ props.option.name }}
        <b-badge :pill="true">
          {{ props.option.count }}
        </b-badge>
      </template>
    </multiselect>
    <multiselect
      v-if="
        filter.type === 'dropdown' &&
          aggs != null &&
          aggs[filter.systemName] != null
      "
      v-model="form[filter.systemName]"
      :clear-on-select="false"
      :close-on-select="false"
      :disabled="disableFormElements"
      label="key"
      :multiple="true"
      :options="aggs[filter.systemName]"
      :preserve-search="true"
      :show-labels="false"
      track-by="key"
      @close="multiselectClose(filter.systemName)"
      @input="multiselectInput(filter.systemName)"
      @open="multiselectOpen(filter.systemName)"
    >
      <template slot="option" slot-scope="props">
        {{ props.option.key }}
        <b-badge :pill="true">
          {{ props.option.count }}
        </b-badge>
      </template>
    </multiselect>
  </b-form-group>
</template>

<script>
import Multiselect from 'vue-multiselect'
import VueSlider from 'vue-slider-component/dist-css/vue-slider-component.umd.min.js'
import VueTypeaheadBootstrap from 'vue-typeahead-bootstrap'
import Histogram from '~/components/Histogram'

export default {
  components: {
    Histogram,
    Multiselect,
    VueSlider,
    VueTypeaheadBootstrap
  },
  props: {
    autocompleteData: {
      type: Object,
      required: true
    },
    filter: {
      type: Object,
      required: true
    }
  }
}
</script>
