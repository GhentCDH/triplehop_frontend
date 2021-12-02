<template>
  <b-badge
    v-if="sources.length !== 0"
    :id="id"
    pill
    variant="primary"
  >
    {{ `Source${sources.length === 1 ? '' : 's'}` }}
    <b-tooltip
      v-if="sources.length !== 0"
      :target="`#${id}`"
      custom-class="sources-tooltip"
      variant="primary"
    >
      <ul
        v-if="sources.length > 1"
      >
        <li
          v-for="(item, index) in sources"
          :key="index"
        >
          <source-link :source="item" />
        </li>
      </ul>
      <source-link
        v-else
        :source="sources[0]"
      />
    </b-tooltip>
  </b-badge>
</template>
<script>
import { v4 as uuidv4 } from 'uuid'

import SourceLink from '~/components/Detail/SourceLink.vue'

export default {
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
