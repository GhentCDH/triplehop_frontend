<template>
  <div v-frag>
    <nuxt-link
      v-if="field.mainLink"
      :to="`${projectPrefix}${entityTypeName}/${entityId}`"
    >
      <template v-if="field.type === 'main_link'">
        <b-icon icon="box-arrow-right" />
      </template>
      <template v-else-if="field.type === 'edtf'">
        {{ nameOrNA(value) }}
      </template>
      <template v-else-if="field.type === 'uncertain_centuries'">
        {{ nameOrNA(value.display) }}
      </template>
      <template v-else-if="field.type === 'nested'">
        {{ nameOrNA(value.value) }}
      </template>
      <template v-else>
        {{ nameOrNA(value) }}
      </template>
    </nuxt-link>
    <template
      v-else-if="field.type === 'nested' || field.type === 'nested_multi_type' || field.type === 'nested_flatten'"
    >
      <template v-if="value.id == null" />
      <nuxt-link
        v-else-if="field.link"
        :to="`${projectPrefix}${value.entity_type_name}/${value.id}`"
        :class="`table-cell-item__${value.entity_type_name}`"
      >
        {{ nameOrNA(value.value) }}
      </nuxt-link>
      <span
        v-else
        :class="`table-cell-item__${value.entity_type_name}`"
      >
        {{ nameOrNA(value.value) }}
      </span>
    </template>
    <template v-else-if="field.type === 'id'">
      {{ entityId }}
    </template>
    <template v-else-if="field.type === 'actions'">
      <nuxt-link
        v-if="field.actions.includes('edit')"
        :to="`${projectPrefix}${entityTypeName}/${entityId}/edit`"
        title="Edit this entity"
      >
        <b-icon icon="pencil" />
      </nuxt-link>
      <nuxt-link
        v-if="field.actions.includes('delete')"
        :to="`${projectPrefix}${entityTypeName}/${entityId}/delete`"
        title="Delete this entity"
      >
        <b-icon icon="trash" />
      </nuxt-link>
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
        v-if="field.type === 'nested' || field.type === 'nested_flatten'"
        :to="`${projectPrefix}${entityTypeName}?filter[${field.key}][0]=${value.id}`"
      >
        <b-icon icon="search" font-scale="0.5" shift-v="10" />
      </nuxt-link>
      <nuxt-link
        v-else-if="field.type === 'nested_multi_type'"
        :to="`${projectPrefix}${entityTypeName}?filter[${field.key}][0]=${value.entity_type_name}|${value.id}`"
      >
        <b-icon icon="search" font-scale="0.5" shift-v="10" />
      </nuxt-link>
      <nuxt-link
        v-else-if="field.type === 'uncertain_centuries'"
        :to="`${projectPrefix}${entityTypeName}?filter[${field.key}][0]=${value.withoutUncertain}`"
      >
        <b-icon icon="search" font-scale="0.5" shift-v="10" />
      </nuxt-link>
      <nuxt-link
        v-else-if="field.type === 'text'"
        :to="`${projectPrefix}${entityTypeName}?filter[${field.key}][0]=${value}`"
      >
        <b-icon icon="search" font-scale="0.5" shift-v="10" />
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
