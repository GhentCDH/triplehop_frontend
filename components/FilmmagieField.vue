<template>
  <div>
    <b-row
      v-for="(valueAndSource, index) in valueAndSources"
      :key="index"
    >
      <b-col md="3">
        <b-img
          fluid
          :src="`https://resolver.libis.be/${valueAndSource.value}/thumbnail`"
        />
      </b-col>
      <b-col md="3">
        <b-link
          :href="`https://resolver.libis.be/${valueAndSource.value}/representation`"
          target="_blank"
        >
          <b-icon icon="box-arrow-up-right" />
          View complete source
        </b-link>
      </b-col>
      <b-col md="6">
        <sources :sources="valueAndSource.sources" />
      </b-col>
    </b-row>
  </div>
</template>
<script>
import frag from 'vue-frag'
import Sources from '~/components/Sources.vue'
export default {
  directives: {
    frag
  },
  components: {
    Sources
  },
  props: {
    valueAndSources: {
      type: Array,
      required: true
    }
  }
}
</script>
