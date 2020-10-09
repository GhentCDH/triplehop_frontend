<template>
  <b-card
    class="border-0 bg-white mb-1"
  >
    <b-link
      :to="{
        name: 'project_name-entity_type_name-id',
        params: {
          project_name: projectName,
          entity_type_name: relation.entity.__typename.toLowerCase(),
          id: relation.entity.id
        }
      }"
    >
      {{ constructTitle(entityTypesConfig[relation.entity.__typename.toLowerCase()].display.title, relation.entity) }}
    </b-link>

    <layout-panel
      v-for="(panel, panelIndex) in relationTypeConfig.display.layout"
      :key="`panel-${panelIndex}`"
      :panel="panel"
      :panel-index="panelIndex"
      :config="relationTypeConfig"
      :data="props"
    />
  </b-card>
</template>
<script>
import { constructTitle } from '~/assets/js/utils'
import LayoutPanel from '~/components/LayoutPanel.vue'

export default {
  components: {
    LayoutPanel
  },
  props: {
    entityTypesConfig: {
      type: Object,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    relation: {
      type: Object,
      required: true
    },
    relationTypeConfig: {
      type: Object,
      required: true
    }
  },
  computed: {
    props () {
      const { id, entity, ...props } = this.relation
      return props
    }
  },
  methods: {
    constructTitle
  }
}
</script>
