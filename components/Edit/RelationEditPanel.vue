<template>
  <b-card
    :id="`${relationTypeName}`"
    :title="panelTitle"
    class="bg-light border-0"
  >
    <!-- todo: use relation type and relation id as key below (what to do with new relations?) -->
    <b-card
      v-for="(relationData, relationId) in formData"
      :key="relationId"
      class="border-0 bg-white mb-1"
    >
      <b-row>
        <b-col
          sm="12"
          class="mb-1"
        >
          [{{ relationData.entity.id }}] {{ relationData.entity.title }}
          <!-- TODO: check edit permission on entity type -->
          <b-link
            target="_blank"
            title="Edit entity"
            :to="{
              name: 'project_name-entity_type_name-id-edit',
              params: {
                project_name: projectName,
                entity_type_name: relationData.entity.entityTypeName,
                id: relationData.entity.id
              }
            }"
          >
            <b-icon-pencil-fill />
          </b-link>
          <b-button
            class="float-right"
            variant="danger"
            title="Delete this relation"
            @click="onDelete(relationId)"
          >
            <b-icon-trash />
          </b-button>
        </b-col>
      </b-row>
      <relation-edit-panel-panel
        v-for="(panel, panelIndex) in layout"
        :key="`${relationTypeName}-panel-${panelIndex}`"
        ref="panels"
        :panel="panel"
        :relation-type-config="relationTypeConfig"
        :form-data="formData[relationId].relation"
        :disabled="disabled"
        @input="onInput(relationId, $event)"
      />
    </b-card>
  </b-card>
</template>
<script>
import RelationEditPanelPanel from '~/components/Edit/RelationEditPanelPanel.vue'

export default {
  components: {
    RelationEditPanelPanel
  },
  props: {
    disabled: {
      type: Boolean,
      required: true
    },
    formData: {
      type: Object,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    relationTypeConfig: {
      type: Object,
      required: true
    },
    relationTypeName: {
      type: String,
      required: true
    }
  },
  computed: {
    invalid () {
      if (this.$refs.panels == null) {
        return false
      }
      for (const panel of this.$refs.panels) {
        if (panel.invalid) {
          return true
        }
      }
      return false
    },
    layout () {
      const layout = this.relationTypeConfig.edit.layout
      if (layout == null) {
        return []
      }
      for (const panel of layout) {
        for (const field of panel.fields) {
          const systemName = field.field.replace('$', '')
          field.validators = this.relationTypeConfig.data[systemName].validators
        }
      }
      return layout
    },
    panelTitle () {
      return this.relationTypeConfig.edit[`${this.side}_title`]
    },
    side () {
      return this.relationTypeName.split('_')[0] === 'r' ? 'domain' : 'range'
    }
  },
  methods: {
    onDelete (relationId) {
      this.$emit(
        'input',
        {
          action: 'delete',
          relationId
        }
      )
    },
    onInput (relationId, event) {
      this.$emit(
        'input',
        {
          ...event,
          relationId
        }
      )
    },
    reset () {
      if (this.layout.length !== 0) {
        for (const panel of this.$refs.panels) {
          panel.reset()
        }
      }
    },
    touch () {
      if (this.layout.length !== 0) {
        for (const panel of this.$refs.panels) {
          panel.touch()
        }
      }
    }
  }
}
</script>
