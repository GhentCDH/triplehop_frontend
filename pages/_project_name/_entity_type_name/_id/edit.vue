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
        <b-form
          @submit.prevent="onSubmit"
          @reset.prevent="onReset"
        >
          <edit-panel
            v-for="(panel, panelIndex) in entityTypeConfig.edit.layout"
            :key="`panel-${panelIndex}`"
            :panel="panel"
            :config="entityTypeConfig"
            :form-data="formData"
            :disabled="disableFormElements"
            :vuelidate="$v"
            @input="formInput"
          />
          <b-button
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

export default {
  components: {
    EditPanel
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
      formData: {},
      oldFormData: {}
    }
  },
  validations () {
    const validations = {
      formData: {}
    }
    for (const panel of this.entityTypeConfig.edit.layout) {
      for (const field of panel.fields) {
        const systemName = field.field.replace('$', '')
        const fieldValidation = {}
        if (field.validators) {
          for (const validator of field.validators) {
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
          validations.formData[systemName] = {
            $each: fieldValidation
          }
        } else {
          validations.formData[systemName] = fieldValidation
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
    formInput ({ systemName, value }) {
      this.formData[systemName] = value
      if (JSON.stringify(this.formData[systemName]) === JSON.stringify(this.oldFormData[systemName])) {
        this.$v.formData[systemName].$reset()
      } else {
        this.$v.formData[systemName].$touch()
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
      for (const [key, value] of Object.entries(this.oldFormData)) {
        this.formData[key] = JSON.parse(JSON.stringify(value))
        this.$v.formData[key].$reset()
      }
    },
    setFormData () {
      for (const panel of this.entityTypeConfig.edit.layout) {
        for (const field of panel.fields) {
          const systemName = field.field.replace('$', '')
          this.formData[systemName] = this.entityData[systemName]
        }
      }
      this.oldFormData = JSON.parse(JSON.stringify(this.formData))
    }
  }
}
</script>
