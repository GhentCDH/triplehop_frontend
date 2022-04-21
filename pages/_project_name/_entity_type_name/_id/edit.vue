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
              <h2 id="entity">
                Entity
              </h2>
              <edit-panel
                v-for="(panel, panelIndex) in layout"
                :key="`panel-${panelIndex}`"
                :panel="panel"
                :config="entityTypeConfig"
                :form-data="formData.entity"
                :disabled="disableFormElements"
                :vuelidate="$v.formData.entity"
                @input="formInput('entity', $event)"
              />
              <h2 id="relations">
                Relations
              </h2>
              <relation-edit-panel
                v-for="domainRelationTypeName in domainRelationTypeNames"
                :key="`panel-${domainRelationTypeName}`"
                :config="relationTypesConfig[domainRelationTypeName]"
                side="domain"
                @input="formInput"
              />
              <b-button
                id="actions"
                type="submit"
                variant="primary"
                :disabled="!formDataChanged || disableFormElements || $v.$invalid"
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
            v-b-scrollspy:edit
            class="d-none d-sm-block col-sm-3 sticky-top border-left border-secondary toc"
          >
            <b-navbar-brand href="#">
              Quick navigation
            </b-navbar-brand>
            <b-nav
              vertical
            >
              <b-nav-item href="#entity">
                Entity
              </b-nav-item>
              <b-nav-item href="#relations">
                Relations
              </b-nav-item>
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
import { validationMixin } from 'vuelidate'
import { helpers, required } from 'vuelidate/lib/validators'

import { constructFieldFromData, isNumber } from '~/assets/js/utils'
import { edtfYear } from '~/assets/js/validators'
import EditPanel from '~/components/Edit/EditPanel.vue'
import RelationEditPanel from '~/components/Edit/RelationEditPanel.vue'

export default {
  components: {
    EditPanel,
    RelationEditPanel
  },
  mixins: [validationMixin],
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
      oldFormData: {}
    }
  },
  validations () {
    const validations = {
      formData: {
        entity: {}
      }
    }
    for (const panel of this.entityTypeConfig.edit.layout) {
      for (const field of panel.fields) {
        const systemName = field.field.replace('$', '')
        const fieldValidation = {}
        const validators = this.entityTypeConfig.data[systemName].validators
        if (validators) {
          for (const validator of validators) {
            if (validator.type === 'required') {
              fieldValidation.required = required
            }
            if (validator.type === 'edtf_year') {
              fieldValidation.edtfYear = edtfYear
            }
            if (validator.type === 'regex') {
              fieldValidation.regex = helpers.regex('regex', new RegExp(validator.regex))
            }
          }
        }
        if (field.multi) {
          validations.formData.entity[systemName] = {
            $each: fieldValidation
          }
        } else {
          validations.formData.entity[systemName] = fieldValidation
        }
      }
    }
    return validations
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
  methods: {
    constructFieldFromData,
    formInput (path, { systemName, value }) {
      // Determine which part of the formdata and validation need to be updated
      let formData = this.formData
      let oldFormData = this.oldFormData
      let vuelidate = this.$v.formData
      for (const p of path.split('.')) {
        formData = formData[p]
        oldFormData = oldFormData[p]
        vuelidate = vuelidate[p]
      }

      // Update formdata
      formData[systemName] = value

      // Revalidate
      if (JSON.stringify(formData[systemName]) === JSON.stringify(oldFormData[systemName])) {
        vuelidate[systemName].$reset()
      } else {
        vuelidate[systemName].$touch()
      }
    },
    async onSubmit () {
      this.$v.$touch()
      if (this.$v.$invalid) {
        return
      }
      this.disableFormElements = true
      const submitData = {}
      for (const [key, value] of Object.entries(this.formData)) {
        if (JSON.stringify(value) !== JSON.stringify(this.oldFormData[key])) {
          submitData[key] = JSON.parse(JSON.stringify(value))
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
          this.$v.$reset()
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
        this.$v.formData.entity[key].$reset()
      }
      // Relations
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
      // for (const [relationTypeName, relationConfig] of Object.entries(this.relationTypesConfig)) {
      //   if (
      //     (
      //       relationConfig.domain_names.includes(this.entityTypeName) ||
      //       relationConfig.range_names.includes(this.entityTypeName)
      //     ) &&
      //     relationConfig.edit != null
      //   ) {
      //     // const relationDataName = `${relationConfig.domain_names.includes(this.entityTypeName) ? 'r' : 'ri'}_${relationTypeName}_s`
      //     // for (const relationData of this.entityData[relationDataName]) {
      //     //   const relationFormData = {
      //     //     entity:
      //     //   }
      //     //   // TODO: fix relation data
      //     //   if ('layout' in relationConfig.edit) {
      //     //     for (const panel of relationConfig.edit.layout) {
      //     //       for (const field of panel.fields) {
      //     //         const systemName = field.field.replace('$', '')

      //     //       }
      //     //     }
      //     //   }
      //     //   this.formData[relationTypeName]
      //     // }
      //   }
      // }
      // Set oldFormData
      this.oldFormData = JSON.parse(JSON.stringify(this.formData))
    }
  }
}
</script>
