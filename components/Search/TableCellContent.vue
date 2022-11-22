<template>
  <div v-frag>
    <nuxt-link
      v-if="field.mainLink"
      :to="`${projectPrefix}${entityTypeName}/${entityId}`"
    >
      <template v-if="field.type === 'main_link'">
        <b-icon-box-arrow-right />
      </template>
      <template v-else-if="field.type === 'edtf'">
        {{ nameOrNA(value) }}
      </template>
      <template v-else-if="field.type === 'uncertain_centuries'">
        {{ nameOrNA(value.display) }}
      </template>
      <template v-else>
        {{ nameOrNA(value) }}
      </template>
    </nuxt-link>
    <template
      v-else-if="field.type === 'nested' || field.type === 'nested_multi_type'"
    >
      <template v-if="value.id == null" />
      <nuxt-link
        v-else-if="field.link"
        :to="`${projectPrefix}${value.entity_type_name}/${value.id}`"
      >
        {{ nameOrNA(value.value) }}
      </nuxt-link>
      <template v-else>
        {{ nameOrNA(value.value) }}
      </template>
    </template>
    <template v-else-if="field.type === 'edtf'">
      {{ nameOrNA(value) }}
    </template>
    <template v-else-if="field.type === 'uncertain_centuries'">
      {{ nameOrNA(value.display) }}
    </template>
    <template v-else>
      {{ value }}
    </template>
    <template v-if="field.searchable">
      <nuxt-link
        v-if="field.type === 'nested' || field.type === 'nested_multi_type'"
        :to="`${projectPrefix}${entityTypeName}?filter[${field.key}][0]=${value.id}`"
      >
        <b-icon-search font-scale="0.5" shift-v="10" />
      </nuxt-link>
      <nuxt-link
        v-else-if="field.type === 'uncertain_centuries'"
        :to="`${projectPrefix}${entityTypeName}?filter[${field.key}][0]=${value.withoutUncertain}`"
      >
        <b-icon-search font-scale="0.5" shift-v="10" />
      </nuxt-link>
    </template>
  </div>
</template>

<script>
import frag from 'vue-frag'

export default {
  directives: {
    frag
  },
  props: {
    entityId: {
      type: String,
      required: true
    },
    entityTypeName: {
      type: String,
      required: true
    },
    field: {
      type: Object,
      required: true
    },
    projectPrefix: {
      type: String,
      required: true
    },
    value: {
      type: null,
      required: true
    }
  },
  methods: {
    nameOrNA (name) {
      if (name == null) {
        return 'N/A'
      }
      if (name === '') {
        return 'N/A'
      }
      return name
    }
  }
}
</script>
