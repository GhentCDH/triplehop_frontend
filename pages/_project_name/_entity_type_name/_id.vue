<template>
  <b-container>
    <h1 v-if="title">
      {{ title }}
    </h1>
    <h1 v-else>
      {{ entity_type_display_name }} {{ $root.params.id }}
    </h1>

    <template v-if="'display' in entity_type_config && 'layout' in entity_type_config.display">
      <b-card
        v-for="(panel, panelIndex) in entity_type_config.display.layout"
        :key="`panel-${panelIndex}`"
        :title="panel.label"
      >
        <dl
          v-if="'fields' in panel"
          class="row"
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
            <dd
              :key="`field-value-${field.field}`"
              class="col-sm-9 col-lg-10"
            >
              {{ entity_data[field.field] }}
            </dd>
          </template>
        </dl>
      </b-card>
    </template>
  </b-container>
</template>

<script>
import { capitalizeFirstLetter, isNumber } from '~/assets/js/utils'

export default {
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

    await store.dispatch(
      'data/load',
      {
        entityTypeConfig: store.state.config.entity_types[params.entity_type_name],
        params
      }
    )
  },
  computed: {
    entity_type_config () {
      return this.$store.state.config.entity_types[this.$route.params.entity_type_name]
    },
    entity_type_display_name () {
      return capitalizeFirstLetter(this.$root.params.entity_type_name)
    },
    entity_data () {
      return this.$store.state.data.data
    },
    title () {
      if (!('display' in this.entity_type_config)) {
        return null
      }

      // Replace all fields
      return this.entity_type_config.display.title.replace(/(?<![$])[$]([a-z_]+)/g, m => this.entity_data[m.slice(1)])
    }
  },
  head () {
    // TODO: set Meta Tags for this Page
  }
}
</script>
