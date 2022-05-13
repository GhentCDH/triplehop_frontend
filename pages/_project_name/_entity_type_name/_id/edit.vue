<template>
  <div>
    <div
      v-if="$fetchState.pending"
      class="text-center"
    >
      <b-spinner variant="primary" />
    </div>
    <!-- TODO: style error -->
    <p v-else-if="$fetchState.error">
      {{ $fetchState.error.message }}
    </p>
    <template v-else>
      <b-breadcrumb
        class="bg-light"
        :items="breadcrumbs"
      />
      <div
        class="title-wrapper"
      >
        <h1>
          {{ titleValue }}
        </h1>
        <!-- TODO: title sources? -->
        <b-link
          class="title-link"
          :to="{
            name: 'project_name-entity_type_name-id',
            params: {
              project_name: projectName,
              entity_type_name: entityTypeName,
              id: id
            }
          }"
        >
          <b-icon-eye-fill />
          View
        </b-link>
      </div>
      <b-overlay
        :show="disableFormElements"
        spinner-variant="primary"
      >
        <b-row>
          <b-col
            id="edit"
            sm="9"
            class="mb-3"
          >
            <b-form
              @submit.prevent="onSubmit"
              @reset.prevent="onReset"
            >
              <h2 id="entity" class="text-primary">
                Entity
              </h2>
              <edit-panel
                v-for="(panel, panelIndex) in layout"
                :key="`panel-${panelIndex}`"
                ref="entityPanels"
                :panel="panel"
                :config="entityTypeConfig"
                :form-data="formData.entity"
                :disabled="disableFormElements"
                @input="formInput('entity', $event)"
              />
              <!-- <h2 id="relations" class="text-primary">
                Relations
              </h2>
              <relation-edit-panel
                v-for="domainRelationTypeName in domainRelationTypeNames"
                :key="`panel-${domainRelationTypeName}`"
                :config="relationTypesConfig[domainRelationTypeName]"
                :form-data="formData[domainRelationTypeName]"
                :project-name="projectName"
                :relation-type-name="domainRelationTypeName"
                side="domain"
                @input="formInput"
              /> -->
              <h2 id="actions" class="text-primary">
                Actions
              </h2>
              <b-button
                type="submit"
                variant="primary"
                :disabled="!formDataChanged || disableFormElements || invalid"
              >
                Submit
              </b-button>
              <b-button
                type="reset"
                variant="danger"
                :disabled="!formDataChanged || disableFormElements"
              >
                Reset
              </b-button>
            </b-form>
          </b-col>
          <b-navbar
            v-if="isLoaded"
            v-b-scrollspy:edit
            class="d-none d-sm-block col-sm-3 sticky-top border-left border-secondary toc"
          >
            <b-navbar-brand href="#">
              Quick navigation
            </b-navbar-brand>
            <b-nav
              vertical
            >
              <li class="nav-item">
                <b-link
                  href="#entity"
                  :class="['nav-link', {'text-danger': anyEntityPanelInvalid}]"
                >
                  Entity
                </b-link>
                <b-nav>
                  <template
                    v-for="(panel, panelIndex) in layout"
                  >
                    <b-icon-arrow-90deg-down
                      :key="`icon-entity-${panelIndex}`"
                      rotate="270"
                      shift-v="-8"
                    />
                    <li
                      :key="`nav-entity-${panelIndex}`"
                      class="nav-item"
                    >
                      <b-link
                        :href="`#entity-${panel.label}`"
                        :class="['nav-link', {'text-danger': $refs.entityPanels[panelIndex].invalid}]"
                      >
                        {{ panel.label }}
                      </b-link>
                    </li>
                  </template>
                </b-nav>
              </li>
              <li class="nav-item">
                <b-link href="#relations" class="nav-link">
                  Relations
                </b-link>
                <b-nav>
                  <template
                    v-for="domainRelationTypeName in domainRelationTypeNames"
                  >
                    <b-icon-arrow-90deg-down
                      :key="`icon-relation-${domainRelationTypeName}`"
                      rotate="270"
                      shift-v="-8"
                    />
                    <b-nav-item
                      :key="`nav-relation-${domainRelationTypeName}`"
                      :href="`#relation-domain-${domainRelationTypeName}`"
                    >
                      {{ relationTypesConfig[domainRelationTypeName].edit.domain_title }}
                    </b-nav-item>
                  </template>
                </b-nav>
              </li>
              <b-nav-item href="#actions">
                Actions
              </b-nav-item>
            </b-nav>
          </b-navbar>
        </b-row>
      </b-overlay>
    </template>
  </div>
</template>

<script>

import { constructFieldFromData, isNumber } from '~/assets/js/utils'
import EditPanel from '~/components/Edit/EditPanel.vue'
// import RelationEditPanel from '~/components/Edit/RelationEditPanel.vue'

export default {
  components: {
    EditPanel
    // RelationEditPanel
  },
  validate ({ params }) {
    // Make sure id is a number
    if (!isNumber(params.id)) {
      return false
    }
    return true
  },
  data () {
    return {
      disableFormElements: false,
      formData: {
        entity: {}
      },
      isLoaded: false,
      oldFormData: {}
    }
  },
  async fetch () {
    // TODO store state invalidation (websockets / subscriptions?)
    // after login, nuxtServerInit is not called
    if (!this.$store.state.initialized) {
      await this.$store.dispatch('nuxtServerInit', this.$nuxt.context)
    }

    if (!(this.entityTypeName in this.entityTypesConfig)) {
      if (process.server) {
        this.$nuxt.context.res.statusCode = 404
      }
      throw new Error(`Entity type "${this.entityTypeName}" cannot be found.`)
    }
    try {
      await this.$store.dispatch('config/load_relation_types', this.projectName)

      await this.$store.dispatch(
        'data/loadEdit',
        {
          entityTypeName: this.entityTypeName,
          entityTypesConfig: this.entityTypesConfig,
          id: this.$route.params.id,
          projectName: this.projectName,
          relationTypesConfig: this.relationTypesConfig
        }
      )
    } catch (e) {
      throw new Error('Error while fetching data.')
    }
    if (this.$store.state.data.data == null) {
      if (process.server) {
        this.$nuxt.context.res.statusCode = 404
      }
      throw new Error(`Entity of type "${this.entityTypeName}" with id "${this.$route.params.id}" cannot be found.`)
    }

    this.setFormData()
  },
  head () {
    // TODO: set Meta Tags for this Page
  },
  computed: {
    anyEntityPanelInvalid () {
      for (const entityPanel of this.$refs.entityPanels) {
        if (entityPanel.invalid) {
          return true
        }
      }
      return false
    },
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
        text: this.titleValue,
        active: true
      })
      return breadcrumbs
    },
    domainRelationTypeNames () {
      return Object.keys(this.relationTypesConfig)
        .filter(
          (relationTypeName) => {
            const relationConfig = this.relationTypesConfig[relationTypeName]
            return relationConfig.domain_names.includes(this.entityTypeName) &&
              relationConfig.edit != null
          }
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
    formDataChanged () {
      return JSON.stringify(this.formData) !== JSON.stringify(this.oldFormData)
    },
    id () {
      return this.$route.params.id
    },
    invalid () {
      if (this.anyEntityPanelInvalid) {
        return true
      }
      return false
    },
    layout () {
      const layout = this.entityTypeConfig.edit.layout
      for (const panel of layout) {
        for (const field of panel.fields) {
          const systemName = field.field.replace('$', '')
          field.validators = this.entityTypeConfig.data[systemName].validators
        }
      }
      return layout
    },
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    },
    projectPrefix () {
      return this.$config.projectName == null ? `/${this.projectName}/` : '/'
    },
    relationTypesConfig () {
      return this.$store.state.config.relation_types
    },
    title () {
      return this.constructFieldFromData(
        this.entityTypeConfig.display.title,
        this.entityData,
        {},
        {},
        true
      )
    },
    titleValue () {
      return this.title.map(title => title.value).join(', ')
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.isLoaded = true
    })
  },
  methods: {
    constructFieldFromData,
    formInput (path, { systemName, value }) {
      // Determine which part of the formdata needs to be updated
      let formData = this.formData
      let oldFormData = this.oldFormData
      for (const p of path.split('.')) {
        formData = formData[p]
        oldFormData = oldFormData[p]
      }

      // Update formdata
      formData[systemName] = value
    },
    async onSubmit () {
      for (const entityPanel of this.$refs.entityPanels) {
        entityPanel.touch()
      }
      if (this.invalid) {
        return
      }
      this.disableFormElements = true
      const submitData = {}
      // Entity
      for (const [key, value] of Object.entries(this.formData.entity)) {
        if (JSON.stringify(value) !== JSON.stringify(this.oldFormData.entity[key])) {
          if (!('entity' in submitData)) {
            submitData.entity = {}
          }
          submitData.entity[key] = JSON.parse(JSON.stringify(value))
        }
      }
      if (Object.keys(submitData).length !== 0) {
        try {
          await this.$store.dispatch(
            'data/save',
            {
              entityTypeName: this.entityTypeName,
              entityTypesConfig: this.entityTypesConfig,
              id: this.$route.params.id,
              projectName: this.projectName,
              relationTypesConfig: this.relationTypesConfig,
              data: submitData
            }
          )
          this.setFormData()
          // this.$v.$reset()
          this.$store.dispatch(
            'notifications/create',
            {
              message: 'Changes successfully saved.',
              variant: 'success'
            }
          )
        } catch (error) {
          this.$store.dispatch(
            'notifications/create',
            {
              message: 'There was an issue saving your data.  Please verify your input.',
              title: 'Saving unsuccessfull',
              variant: 'danger'
            }
          )
        }
      }
      this.disableFormElements = false
    },
    onReset () {
      // Entity
      for (const [key, value] of Object.entries(this.oldFormData.entity)) {
        this.formData.entity[key] = JSON.parse(JSON.stringify(value))
      }
      // Relations
      // for (const [key, value] of Object.entries(this.oldFormData.relation)
    },
    setFormData () {
      // Entity
      for (const panel of this.entityTypeConfig.edit.layout) {
        for (const field of panel.fields) {
          const systemName = field.field.replace('$', '')
          this.formData.entity[systemName] = this.entityData[systemName]
        }
      }
      // Relations
      for (const [relationTypeName, relationConfig] of Object.entries(this.relationTypesConfig)) {
        if (
          (
            relationConfig.domain_names.includes(this.entityTypeName) ||
            relationConfig.range_names.includes(this.entityTypeName)
          ) &&
          relationConfig.edit != null
        ) {
          const relationDataName = `${relationConfig.domain_names.includes(this.entityTypeName) ? 'r' : 'ri'}_${relationTypeName}_s`
          this.formData[relationDataName] = []
          for (const relationData of this.entityData[relationDataName]) {
            const relationFormData = {
              entity: {
                id: relationData.entity.id,
                title: this.constructFieldFromData(
                  this.entityTypesConfig[relationData.entity.__typename.toLowerCase()].display.title,
                  relationData.entity,
                  {},
                  {},
                  true
                )[0].value,
                entityTypeName: relationData.entity.__typename.toLowerCase()
              }
            }
            // TODO: test if code below works
            if ('layout' in relationConfig.edit) {
              for (const panel of relationConfig.edit.layout) {
                for (const field of panel.fields) {
                  const systemName = field.field.replace('$', '')
                  if (!('relation' in relationFormData)) {
                    relationFormData.relation = {}
                  }
                  relationFormData.relation[systemName] = relationData[systemName]
                }
              }
            }
            this.formData[relationDataName].push(relationFormData)
          }
        }
      }
      // Set oldFormData
      this.oldFormData = JSON.parse(JSON.stringify(this.formData))
    }
  }
}
</script>
