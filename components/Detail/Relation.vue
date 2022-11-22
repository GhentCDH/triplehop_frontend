<template>
  <b-card
    class="border-0 bg-white mb-1"
  >
    <h5>
      <b-link
        v-if="entityTypesConfig[entityTypeName].detail"
        :to="{
          name: 'project_name-entity_type_name-id',
          params: {
            project_name: projectName,
            entity_type_name: entityTypeName,
            id: relation.entity.id
          }
        }"
      >
        <b-icon-link />
        {{ titleValue }}
      </b-link>
      <template v-else>
        {{ titleValue }}
      </template>
    </h5>
    <sources :sources="relationSources" />

    <layout-panel
      v-for="(panel, panelIndex) in panelsToShow"
      :key="`panel-${panelIndex}`"
      :panel="panel"
      :config="relationTypeConfig"
      :data="props"
      :extra-data="extraData"
      :source-titles-config="sourceTitlesConfig"
    />
  </b-card>
</template>
<script>
import { constructFieldFromData, constructRelationSources } from '~/assets/js/utils'
import LayoutPanel from '~/components/Detail/LayoutPanel.vue'
import Sources from '~/components/Detail/Sources.vue'

export default {
  components: {
    LayoutPanel,
    Sources
  },
  props: {
    relation: {
      type: Object,
      required: true
    },
    relationTypeName: {
      type: String,
      required: true
    },
    sourceTitlesConfig: {
      type: Object,
      default: () => {
        return null
      }
    }
  },
  computed: {
    entityTypesConfig () {
      return this.$store.state.config.entity_types
    },
    entityTypeName () {
      return this.relation.entity.__typename.toLowerCase()
    },
    extraData () {
      return {
        range: this.entityTypeName
      }
    },
    panelsToShow () {
      const panelsToShow = []
      if (this.relationTypeConfig.display.layout == null) {
        return panelsToShow
      }
      for (const panel of this.relationTypeConfig.display.layout) {
        const fieldsToShow = this.fieldsToShow(panel)
        if (fieldsToShow.length === 0) {
          continue
        }
        const panelCopy = JSON.parse(JSON.stringify(panel))
        panelCopy.fields = fieldsToShow
        panelsToShow.push(panelCopy)
      }
      return panelsToShow
    },
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    },
    props () {
      const { id, entity, ...props } = this.relation
      return props
    },
    relationTypeConfig () {
      return this.$store.state.config.relation_types[this.relationTypeName]
    },
    title () {
      return constructFieldFromData(
        this.entityTypesConfig[this.relation.entity.__typename.toLowerCase()].display.title,
        this.relation.entity,
        this.sourceTitlesConfig,
        this.relation,
        true
      )
    },
    titleValue () {
      return this.title.map(title => title.value).join(', ')
    },
    relationSources () {
      return constructRelationSources(this.sourceTitlesConfig, this.relation, '_rel_')
    }
  },
  methods: {
    fieldsToShow (panel) {
      const fieldsToShow = []
      if (!('fields' in panel)) {
        return fieldsToShow
      }

      for (const field of panel.fields) {
        if (field.show_condition == null) {
          fieldsToShow.push(field)
          continue
        }
        if (this.extraData == null) {
          continue
        }

        const [conditionKey, conditionValue] = field.show_condition.split(':')
        if (conditionValue === `$${this.extraData[conditionKey]}`) {
          fieldsToShow.push(field)
        }
      }
      return fieldsToShow
    }
  }
}
</script>
