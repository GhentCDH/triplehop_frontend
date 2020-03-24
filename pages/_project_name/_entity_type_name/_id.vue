<template>
  <div>
    <h1>
      {{ constructTitle(entity_type_config.display.title, entity_data) }}
    </h1>

    <b-card
      v-for="(panel, panelIndex) in entity_type_config.display.layout"
      :key="`panel-${panelIndex}`"
      :title="panel.label"
      class="bg-light border-0 mb-3"
    >
      <dl
        v-if="'fields' in panel"
        class="row mb-0"
      >
        <template
          v-for="field in panel.fields"
        >
          <dt
            :key="`field-label-${field.field}`"
            class="col-sm-3 col-lg-2"
          >
            {{ field.label ? field.label : entity_type_config.data[field.field].display_name }}
          </dt>
          <GeometryField
            v-if="field.type === 'geometry'"
            :key="`field-value-${field.field}`"
            :geometry="entity_data[field.field]"
            class="col-sm-9 col-lg-10"
          />
          <dd
            v-else
            :key="`field-value-${field.field}`"
            class="col-sm-9 col-lg-10"
          >
            {{ entity_data[field.field] }}
          </dd>
        </template>
      </dl>
    </b-card>

    <template
      v-for="(relationTypeConfig, relationTypeName) in domain_relation_types_config"
    >
      <b-card
        v-if="entity_data[`r_${relationTypeName}_s`]"
        :key="relationTypeName"
        :title="relationTypeConfig.display.domain_title"
        class="border-0 bg-light mb-3"
      >
        <b-card
          v-for="relation in entity_data[`r_${relationTypeName}_s`]"
          :key="relation.id"
          class="border-0 bg-white mb-1"
        >
          <nuxt-link
            :to="{
              name: 'project_name-entity_type_name-id',
              params: {
                project_name: project_name,
                entity_type_name: relation.entity.__typename.toLowerCase(),
                id: relation.entity.id
              }
            }"
          >
            {{ constructTitle(entity_types_config[relation.entity.__typename.toLowerCase()].display.title, relation.entity) }}
          </nuxt-link>
        </b-card>
      </b-card>
    </template>
    <template
      v-for="(relationTypeConfig, relationTypeName) in range_relation_types_config"
    >
      <b-card
        v-if="entity_data[`ri_${relationTypeName}_s`]"
        :key="relationTypeName"
        :title="relationTypeConfig.display.range_title"
        class="border-0 bg-light mb-3"
      >
        <b-card
          v-for="relation in entity_data[`ri_${relationTypeName}_s`]"
          :key="relation.id"
          class="border-0 bg-white mb-1"
        >
          <nuxt-link
            :to="{
              name: 'project_name-entity_type_name-id',
              params: {
                project_name: project_name,
                entity_type_name: relation.entity.__typename.toLowerCase(),
                id: relation.entity.id
              }
            }"
          >
            {{ constructTitle(entity_types_config[relation.entity.__typename.toLowerCase()].display.title, relation.entity) }}
          </nuxt-link>
        </b-card>
      </b-card>
    </template>
  </div>
</template>

<script>
import { capitalizeFirstLetter, filterObject, isNumber } from '~/assets/js/utils'
import GeometryField from '~/components/GeometryField.vue'

export default {
  auth: false,
  components: {
    GeometryField
  },
  validate ({ params }) {
    // TODO: validate project_name based on cached config
    // Make sure id is a number
    if (!isNumber(params.id)) {
      return false
    }
    return true
  },
  async fetch ({ $axios, params, store, error }) {
    // TODO (backend): allow fields to be ordered
    // TODO (backend): allow display widget configuration
    // TODO https://github.com/superwf/vuex-cache -> how to reset cache (subscriptions?)?

    await store.dispatch('config/load_entity_types', params.project_name)
    if (!(params.entity_type_name in store.state.config.entity_types)) {
      return error({ statusCode: 404, message: `Entity type "${params.entity_type_name}" not found.` })
    }
    await store.dispatch('config/load_relation_types', params.project_name)

    await store.dispatch(
      'data/load',
      {
        entityTypeName: params.entity_type_name,
        entityTypesConfig: store.state.config.entity_types,
        relationTypesConfig: store.state.config.relation_types,
        params
      }
    )
  },
  computed: {
    domain_relation_types_config () {
      return filterObject(
        this.$store.state.config.relation_types,
        relationConfig => relationConfig.domain_names.includes(this.entity_type_name)
      )
    },
    entity_data () {
      return this.$store.state.data.data
    },
    entity_type_config () {
      return this.$store.state.config.entity_types[this.entity_type_name]
    },
    entity_types_config () {
      return this.$store.state.config.entity_types
    },
    entity_type_display_name () {
      return capitalizeFirstLetter(this.entity_type_name)
    },
    entity_type_name () {
      return this.$route.params.entity_type_name
    },
    project_name () {
      return this.$route.params.project_name
    },
    range_relation_types_config () {
      return filterObject(
        this.$store.state.config.relation_types,
        relationConfig => relationConfig.range_names.includes(this.entity_type_name)
      )
    }
  },
  methods: {
    constructTitle (title, data) {
      return title.replace(/(?<![$])[$]([a-z_]+)/g, m => data[m.slice(1)])
    }
  },
  head () {
    // TODO: set Meta Tags for this Page
  }
}
</script>
