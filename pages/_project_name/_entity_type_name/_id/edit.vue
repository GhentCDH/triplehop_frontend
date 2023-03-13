<template>
  <div :class="`${projectName}__${entityTypeName}__${id}__edit page-edit`">
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
          v-if="id"
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
          <b-icon icon="eye-fill" />
          View
        </b-link>
      </div>
      <b-overlay
        :show="disableFormElements"
        spinner-variant="primary"
      >
        <b-form
          @submit.prevent="onSubmit"
          @reset.prevent="onReset"
        >
          <b-row>
            <b-col
              id="edit"
              md="9"
              class="mb-3"
            >
              <h2 id="entity" class="text-primary">
                Entity
              </h2>
              <!-- TODO: add uuid to panel so it can be used as key? -->
              <edit-panel
                v-for="(panel, panelIndex) in layout"
                :key="`panel-${panelIndex}`"
                ref="entityPanels"
                :disabled="disableFormElements"
                :form-data="formData.entity"
                :panel="panel"
                @input="formInput('entity', $event)"
              />
              <h2 id="relations" class="text-primary">
                Relations
              </h2>
              <relation-edit-panel
                v-for="relationTypeName in editableRelationTypeNames"
                :key="`panel-${relationTypeName}`"
                ref="relationPanels"
                :disabled="disableFormElements"
                :form-data="formData[relationTypeName]"
                :project-name="projectName"
                :relation-type-config="getRelationConfig(relationTypeName)"
                :relation-type-name="relationTypeName"
                :entity-types-config="entityTypesConfig"
                @input="formInput(relationTypeName, $event)"
              />
              <div class="d-md-none">
                <h2 id="actions" class="text-primary">
                  Actions
                </h2>
                <b-button
                  type="submit"
                  variant="primary"
                  :disabled="!formDataChanged || disableFormElements || invalid"
                >
                  Submit <b-icon icon="save" />
                </b-button>
                <b-button
                  type="reset"
                  variant="danger"
                  :disabled="!formDataChanged || disableFormElements"
                >
                  Reset <b-icon icon="arrow-counterclockwise" />
                </b-button>
                <b-button
                  type="reset"
                  @click="$router.go(-1)"
                >
                  Cancel <b-icon icon="x" />
                </b-button>
              </div>
            </b-col>
            <!-- TODO: display navbar before refs are loaded -->
            <b-navbar
              v-if="refsLoaded"
              v-b-scrollspy:edit
              class="d-none d-md-block col-md-3 sticky-top toc"
            >
              <div class="border-left border-secondary nav-border-left">
                <b-nav vertical>
                  <b-nav-text class="text-dark">
                    Actions
                  </b-nav-text>
                  <b-nav-text>
                    <b-button-group vertical>
                      <b-button
                        type="submit"
                        variant="primary"
                        :disabled="!formDataChanged || disableFormElements || invalid"
                      >
                        Submit <b-icon icon="save" />
                      </b-button>
                      <b-button
                        type="reset"
                        variant="danger"
                        :disabled="!formDataChanged || disableFormElements"
                      >
                        Reset <b-icon icon="arrow-counterclockwise" />
                      </b-button>
                      <b-button
                        type="reset"
                        @click="$router.go(-1)"
                      >
                        Cancel <b-icon icon="x" />
                      </b-button>
                    </b-button-group>
                  </b-nav-text>
                  <b-nav-text class="text-dark">
                    Quick navigation
                  </b-nav-text>
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
                        <li
                          :key="`nav-entity-${panelIndex}`"
                          :class="['nav-item', {'text-danger': $refs.entityPanels[panelIndex].invalid}]"
                        >
                          <b-link
                            :href="`#entity-${panel.label}`"
                            :class="['nav-link', {'text-danger': $refs.entityPanels[panelIndex].invalid}]"
                          >
                            <b-icon
                              icon="arrow-90deg-down"
                              rotate="270"
                              shift-v="4"
                            />
                            {{ panel.label }}
                          </b-link>
                        </li>
                      </template>
                    </b-nav>
                  </li>
                  <li class="nav-item">
                    <b-link
                      href="#relations"
                      :class="['nav-link']"
                    >
                      Relations
                    </b-link>
                    <b-nav>
                      <template
                        v-for="(relationTypeName, panelIndex) in editableRelationTypeNames"
                      >
                        <li
                          :key="`nav-relation-${relationTypeName}`"
                          :class="['nav-item', {'text-danger': $refs.relationPanels[panelIndex].invalid}]"
                        >
                          <b-link
                            :href="`#${relationTypeName}`"
                            :class="['nav-link']"
                          >
                            <b-icon
                              :key="`icon-relation-${relationTypeName}`"
                              icon="arrow-90deg-down"
                              rotate="270"
                              shift-v="4"
                            />
                            {{ getRelationConfig(relationTypeName).edit.domain_title }}
                          </b-link>
                        </li>
                      </template>
                    </b-nav>
                  </li>
                </b-nav>
              </div>
            </b-navbar>
          </b-row>
        </b-form>
      </b-overlay>
      <b-modal
        :visible="leaveRoute != null"
        @cancel="leaveRoute(false); leaveRoute = null"
        @ok="leaveRoute()"
      >
        You have unsaved changes. Do you want to leave the page?
      </b-modal>
    </template>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid'

import { hasEntityTypePermission } from '~/assets/js/auth'
import { constructFieldFromData, isNumber, isArray } from '~/assets/js/utils'
import EditPanel from '~/components/Edit/EditPanel.vue'
import RelationEditPanel from '~/components/Edit/RelationEditPanel.vue'

function addToStructure (element, structure, value) {
  const lastStructurePart = structure.pop()

  let currentElement = element
  for (const structurePart of structure) {
    if (!(structurePart in currentElement)) {
      currentElement[structurePart] = {}
    }
    currentElement = currentElement[structurePart]
  }
  if (isArray(value)) {
    // Entity or relation data changes in the form of [key, value]
    if (!(lastStructurePart in currentElement)) {
      currentElement[lastStructurePart] = {}
    }
    currentElement[lastStructurePart][value[0]] = JSON.parse(JSON.stringify(value[1]))
    return
  }
  // Deletion or addition of relations
  if (!(lastStructurePart in currentElement)) {
    currentElement[lastStructurePart] = []
  }
  currentElement[lastStructurePart].push(JSON.parse(JSON.stringify(value)))
}

export default {
  components: {
    EditPanel,
    RelationEditPanel
  },
  beforeRouteLeave (to, from, next) {
    if (this.redirectAfterAdd) {
      return next()
    }
    if (!(this.formDataChanged)) {
      return next()
    }
    this.leaveRoute = next
  },
  validate ({ params, $auth }) {
    // Make sure id is undefined (add) or a number (edit)
    if ('id' in params && !isNumber(params.id)) {
      return false
    }
    // Make sure user had post or edit permissions
    if ('id' in params) {
      if (!(hasEntityTypePermission($auth.user, params.project_name, params.entity_type_name, 'data', 'put'))) {
        return false
      }
    } else if (!(hasEntityTypePermission($auth.user, params.project_name, params.entity_type_name, 'data', 'post'))) {
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
      leaveRoute: null,
      oldFormData: {},
      redirectAfterAdd: false,
      refsLoaded: false
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

      if (!('id' in this.$route.params)) {
        this.$store.dispatch(
          'data/loadAdd',
          {
            entityTypeName: this.entityTypeName,
            entityTypesConfig: this.entityTypesConfig,
            id: this.$route.params.id,
            projectName: this.projectName,
            relationTypesConfig: this.relationTypesConfig
          }
        )
      } else {
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
      }
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
    editableRelationTypeNames () {
      const editableRelationTypeNames = []
      for (const [relationTypeName, relationConfig] of Object.entries(this.relationTypesConfig)) {
        if (relationConfig.edit == null) {
          continue
        }
        if (relationConfig.domain_names.includes(this.entityTypeName)) {
          editableRelationTypeNames.push(`r_${relationTypeName}_s`)
        }
        if (relationConfig.range_names.includes(this.entityTypeName)) {
          editableRelationTypeNames.push(`ri_${relationTypeName}_s`)
        }
      }
      return editableRelationTypeNames
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
      const layout = JSON.parse(JSON.stringify(this.entityTypeConfig.edit.layout))
      for (const panel of layout) {
        for (const field of panel.fields) {
          const systemName = field.field.replace('$', '')
          field.validators = this.entityTypeConfig.data[systemName].validators
          field.label = this.label ?? this.entityTypeConfig.data[systemName].display_name
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
      // TODO: use form data
      // problem: for related entities, not all data is available (only title)
      // posible solution: update entityData with unsaved data
      // * when data of entities changes
      // * when relevant (used in title) relations change
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
  created () {
    if (process.browser) {
      // eslint-disable-next-line nuxt/no-globals-in-created
      window.addEventListener('beforeunload', this.beforeWindowUnload)
    }
  },
  beforeDestroy () {
    window.removeEventListener('beforeunload', this.beforeWindowUnload)
  },
  mounted () {
    const interval = setInterval(() => {
      if (
        this.$refs.entityPanels != null &&
        this.$refs.relationPanels != null
      ) {
        this.refsLoaded = true
        clearInterval(interval)
      }
    }, 50)
  },
  methods: {
    beforeWindowUnload (event) {
      if (this.formDataChanged) {
        event.preventDefault()
        event.returnValue = 'You have unsaved changes. Do you want to leave the page?'
        return 'You have unsaved changes. Do you want to leave the page?'
      }
    },
    constructFieldFromData,
    formInput (path, { action, relationId, systemName, value }) {
      // Determine which part of the formdata needs to be updated
      let formData = this.formData
      let oldFormData = this.oldFormData
      for (const p of path.split('.')) {
        formData = formData[p]
        oldFormData = oldFormData[p]
      }

      // Update formdata
      if (action === 'add_relation') {
        const newRelationId = uuidv4()
        this.$set(
          formData,
          newRelationId,
          {
            entity: {
              entityTypeName: value,
              id: null,
              title: null
            },
            relation: {}
          }
        )
      } else if (action === 'delete_relation') {
        this.$delete(formData, relationId)
      } else if (action === 'edit_relation') {
        // Relation data
        formData[relationId].relation[systemName] = value
      } else if (action === 'edit_relation_entity') {
        // Relation entity data
        formData[relationId].entity.id = value?.key
        formData[relationId].entity.title = value?.value
      } else {
        // entity
        formData[systemName] = value
      }
    },
    getRelationConfig (relationTypeName) {
      // Remove r(i)_ and _s from relationTypeName
      return this.relationTypesConfig[relationTypeName.split('_').slice(1, -1).join('_')]
    },
    async onSubmit () {
      for (const entityPanel of this.$refs.entityPanels) {
        entityPanel.touch()
      }
      for (const relationPanel of this.$refs.relationPanels) {
        relationPanel.touch()
      }
      if (this.invalid) {
        return
      }
      this.disableFormElements = true
      const submitData = {}
      // Entity
      for (const [key, value] of Object.entries(this.formData.entity)) {
        if (JSON.stringify(value) !== JSON.stringify(this.oldFormData.entity[key])) {
          addToStructure(
            submitData,
            ['entity'],
            [key, value]
          )
        }
      }
      // Relations
      for (const relationTypeName of this.editableRelationTypeNames) {
        for (const relationId in this.oldFormData[relationTypeName]) {
          if (!(relationId in this.formData[relationTypeName])) {
            addToStructure(
              submitData,
              [relationTypeName, 'delete'],
              relationId
            )
          }
        }
        for (const [relationId, relationData] of Object.entries(this.formData[relationTypeName])) {
          // add new relation
          if (!(relationId in this.oldFormData[relationTypeName])) {
            addToStructure(
              submitData,
              [relationTypeName, 'post'],
              relationData
            )
            continue
          }
          // update existing relation
          for (const [key, value] of Object.entries(relationData)) {
            if (JSON.stringify(value) !== JSON.stringify(this.oldFormData[relationTypeName][relationId][key])) {
              addToStructure(
                submitData,
                [relationTypeName, 'put', relationId],
                [key, value]
              )
            }
          }
        }
      }
      if (Object.keys(submitData).length !== 0) {
        const saveObject = {
          entityTypeName: this.entityTypeName,
          entityTypesConfig: this.entityTypesConfig,
          projectName: this.projectName,
          relationTypesConfig: this.relationTypesConfig,
          data: submitData
        }
        if ('id' in this.$route.params) {
          saveObject.id = this.$route.params.id
        }
        try {
          await this.$store.dispatch(
            'data/save',
            saveObject
          )
          this.$store.dispatch(
            'notifications/create',
            {
              message: 'Changes successfully saved.',
              variant: 'success'
            }
          )
          if (!('id' in this.$route.params)) {
            this.redirectAfterAdd = true
            this.$router.push({
              name: 'project_name-entity_type_name-id-edit',
              params: {
                project_name: this.projectName,
                entity_type_name: this.entityTypeName,
                id: this.entityData.id
              }
            })
          }
          this.setFormData()
          this.resetValidation()
        } catch (error) {
          console.error(error)
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
      for (const relationTypeName of this.editableRelationTypeNames) {
        this.formData[relationTypeName] = {}
        for (const [relationId, relationFormData] of Object.entries(this.oldFormData[relationTypeName])) {
          this.formData[relationTypeName][relationId] = {
            entity: {}
          }
          for (const [key, value] of Object.entries(relationFormData.entity)) {
            this.formData[relationTypeName][relationId].entity[key] = JSON.parse(JSON.stringify(value))
          }
          if ('relation' in relationFormData) {
            this.formData[relationTypeName][relationId].relation = {}
            for (const [key, value] of Object.entries(relationFormData.relation)) {
              this.formData[relationTypeName][relationId].relation[key] = JSON.parse(JSON.stringify(value))
            }
          }
        }
      }
      // Wait untill components are updated (or removed) before resetting validation
      this.$nextTick(() => {
        this.resetValidation()
      })
    },
    resetValidation () {
      for (const entityPanel of this.$refs.entityPanels) {
        entityPanel.reset()
      }
      for (const relationPanel of this.$refs.relationPanels) {
        relationPanel.reset()
      }
    },
    setFormData () {
      // Entity
      for (const panel of this.entityTypeConfig.edit.layout) {
        for (const field of panel.fields) {
          const systemName = field.field.replace('$', '')
          this.$set(this.formData.entity, systemName, this.entityData[systemName])
        }
      }
      // Relations
      for (const relationTypeName of this.editableRelationTypeNames) {
        this.$set(this.formData, relationTypeName, {})
        for (const relationData of this.entityData[relationTypeName]) {
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
          const relationConfig = this.getRelationConfig(relationTypeName)
          if (relationConfig.edit.layout != null) {
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
          this.$set(this.formData[relationTypeName], relationData.id, relationFormData)
        }
      }
      // Set oldFormData
      this.oldFormData = JSON.parse(JSON.stringify(this.formData))
    }
  }
}
</script>
