<template>
  <div v-frag>
    <b-badge
      v-if="sources.length !== 0"
      :id="id"
      variant="primary"
    >
      {{ `Source${sources.length === 1 ? '' : 's'}` }}
    </b-badge>
    <b-tooltip
      v-if="sources.length !== 0"
      :target="id"
    >
      <ul
        v-if="sources.length > 1"
      >
        <li
          v-for="(item, index) in sources"
          :key="index"
        >
          <source-link :source="source" />
        </li>
      </ul>
      <source-link
        v-else
        :source="sources[0]"
      />
    </b-tooltip>
  </div>
</template>
<script>
import frag from 'vue-frag'
import { v4 as uuidv4 } from 'uuid'

import SourceLink from '~/components/SourceLink.vue'

export default {
  directives: {
    frag
  },
  components: {
    SourceLink
  },
  props: {
    sources: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      id: uuidv4()
    }
  }
}
</script>
