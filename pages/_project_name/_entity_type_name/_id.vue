<template>
  <div>
    <b-breadcrumb
      class="bg-light"
      :items="breadcrumbs"
    />

    <h1>
      {{ title }}
    </h1>

    <b-card
      v-for="(panel, panelIndex) in entityTypeConfig.display.layout"
      :key="`panel-${panelIndex}`"
      :title="panel.label"
      class="bg-light border-0 mb-3"
    >
      <dl
        v-if="'fields' in panel"
        class="row mb-0"
      >
        <template
          v-for="(field, fieldIndex) in panel.fields"
        >
          <!-- TODO: let component update text-muted class (idea: emit loaded event) -->
          <dt
            :key="`field-label-${panelIndex}-${fieldIndex}`"
            class="col-sm-3 col-lg-2"
            :class="{'text-muted': entityData[field.field] == null}"
          >
            {{ field.label ? field.label : entityTypeConfig.data[field.field].display_name }}
          </dt>
          <dd
            :key="`field-value-${panelIndex}-${fieldIndex}`"
            class="col-sm-9 col-lg-10"
          >
            <template
              v-if="entityData[field.field] != null"
            >
              <geometry-field
                v-if="field.type === 'geometry'"
                :geometry="entityData[field.field]"
              />
              <b-link
                v-else-if="field.type === 'online_identifier'"
                :href="`${field.base_url}${entityData[field.field]}`"
                target="_blank"
              >
                {{ entityData[field.field] }}
              </b-link>
              <template
                v-else-if="field.type === 'list'"
              >
                <ul
                  v-if="entityData[field.field].length > 1"
                >
                  <li
                    v-for="(item, index) in entityData[field.field]"
                    :key="index"
                  >
                    {{ item }}
                  </li>
                </ul>
                <template v-else>
                  {{ entityData[field.field][0] }}
                </template>
              </template>
              <!-- TODO: move client-only to wikidata-images-field component (process.browser?)-->
              <client-only
                v-else-if="field.type === 'wikidata_images' || field.type === 'vooruit_image'"
              >
                <wikidata-images-field
                  v-if="field.type === 'wikidata_images'"
                  :wikidata-id="entityData[field.field]"
                />
                <vooruit-image-field
                  v-if="field.type === 'vooruit_image'"
                  :image-url="entityData[field.field]"
                />
              </client-only>
              <template v-else>
                {{ entityData[field.field] }}
              </template>
            </template>
          </dd>
        </template>
      </dl>
    </b-card>

    <template
      v-for="(relationTypeConfig, relationTypeName) in domainRelationTypesConfig"
    >
      <b-card
        v-if="entityData[`r_${relationTypeName}_s`]"
        :key="relationTypeName"
        :title="relationTypeConfig.display.domain_title"
        class="border-0 bg-light mb-3"
      >
        <b-card
          v-for="relation in entityData[`r_${relationTypeName}_s`]"
          :key="relation.id"
          class="border-0 bg-white mb-1"
        >
          <nuxt-link
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
          </nuxt-link>
        </b-card>
      </b-card>
    </template>
    <template
      v-for="(relationTypeConfig, relationTypeName) in rangeRelationTypesConfig"
    >
      <b-card
        v-if="entityData[`ri_${relationTypeName}_s`]"
        :key="relationTypeName"
        :title="relationTypeConfig.display.range_title"
        class="border-0 bg-light mb-3"
      >
        <b-card
          v-for="relation in entityData[`ri_${relationTypeName}_s`]"
          :key="relation.id"
          class="border-0 bg-white mb-1"
        >
          <nuxt-link
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
          </nuxt-link>
        </b-card>
      </b-card>
    </template>
  </div>
</template>

<script>
import { filterObject, isNumber } from '~/assets/js/utils'
import GeometryField from '~/components/GeometryField.vue'
import VooruitImageField from '~/components/VooruitImageField.vue'
import WikidataImagesField from '~/components/WikidataImagesField.vue'

export default {
  auth: false,
  components: {
    GeometryField,
    VooruitImageField,
    WikidataImagesField
  },
  validate ({ params }) {
    // TODO: validate project_name based on cached config
    // Make sure id is a number
    if (!isNumber(params.id)) {
      return false
    }
    return true
  },
  async fetch () {
    // TODO (backend): allow fields to be ordered
    // TODO (backend): allow display widget configuration
    // TODO https://github.com/superwf/vuex-cache -> how to reset cache (subscriptions?)?

    if (!(this.entityTypeName in this.entityTypesConfig)) {
      return this.$nuxt.error({
        statusCode: 404,
        message: `Entity type "${this.entityTypeName}" cannot be found.`
      })
    }
    await this.$store.dispatch('config/load_relation_types', this.projectName)

    await this.$store.dispatch(
      'data/load',
      {
        entityTypeName: this.entityTypeName,
        entityTypesConfig: this.entityTypesConfig,
        id: this.$route.params.id,
        projectName: this.projectName,
        relationTypesConfig: this.relationTypesConfig
      }
    )
    if (this.$store.state.data.data == null) {
      return this.$nuxt.error({
        statusCode: 404,
        message: `Entity of type "${this.entityTypeName}" with id "${this.$route.params.id}" cannot be found.`
      })
    }
  },
  computed: {
    breadcrumbs () {
      const breadcrumbs = []
      // project home
      if (this.$config.homepage != null) {
        breadcrumbs.push({
          text: 'Home',
          href: this.$config.homepage
        })
      } else {
        breadcrumbs.push({
          text: 'Home',
          to: this.projectPrefix
        })
      }
      // entity search
      if ('elasticsearch' in this.entityTypeConfig) {
        breadcrumbs.push({
          text: this.entityTypeConfig.display_name,
          to: `${this.projectPrefix}${this.entityTypeName}`
        })
      } else {
        breadcrumbs.push({
          text: this.entityTypeConfig.display_name,
          active: true
        })
      }
      // current entity
      breadcrumbs.push({
        text: this.title,
        active: true
      })
      return breadcrumbs
    },
    // TODO: camelCase
    domainRelationTypesConfig () {
      return filterObject(
        this.relationTypesConfig,
        relationConfig => relationConfig.domain_names.includes(this.entityTypeName)
      )
    },
    entityData () {
      return this.$store.state.data.data
    },
    entityTypeConfig () {
      return this.$store.state.config.entity_types[this.entityTypeName]
    },
    entityTypesConfig () {
      return this.$store.state.config.entity_types
    },
    entityTypeName () {
      return this.$route.params.entity_type_name
    },
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    },
    projectPrefix () {
      return this.$config.projectName == null ? `/${this.projectName}/` : '/'
    },
    rangeRelationTypesConfig () {
      return filterObject(
        this.relationTypesConfig,
        relationConfig => relationConfig.range_names.includes(this.entityTypeName)
      )
    },
    relationTypesConfig () {
      return this.$store.state.config.relation_types
    },
    title () {
      return this.constructTitle(this.entityTypeConfig.display.title, this.entityData)
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
