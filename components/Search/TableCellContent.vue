<template>
  <div v-frag>
    <nuxt-link
      v-if="field.mainLink"
      :to="`${projectPrefix}${entityTypeName}/${entityId}`"
    >
      <template v-if="value !== ''">
        {{ value }}
      </template>
      <template v-else>
        N/A
      </template>
    </nuxt-link>
    <template
      v-else-if="field.type === 'nested'"
    >
      <nuxt-link
        v-if="field.link"
        :to="`${projectPrefix}${value.entity_type_name}/${value.id}`"
      >
        {{ nameOrNA(value.name) }}
      </nuxt-link>
      <template v-else>
        {{ nameOrNA(value.name) }}
      </template>
    </template>
    <template
      v-else-if="field.type === 'edtf'"
    >
      {{ nameOrNA(value.text) }}
    </template>
    <template v-else>
      {{ value }}
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
