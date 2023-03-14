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
      <relation-entity-edit-panel
        ref="entityPanels"
        :disabled="disabled"
        :form-data="relationData.entity"
        :label="entityTypesConfig[relationData.entity.entityTypeName].display_name"
        :project-name="projectName"
        :select-entity="isNaN(relationId)"
        @input="onEntityInput(relationId, $event)"
      />
      <relation-edit-panel-panel
        v-for="(panel, panelIndex) in layout"
        :key="`${relationTypeName}-panel-${panelIndex}`"
        ref="relationPanels"
        :panel="panel"
        :form-data="formData[relationId].relation"
        :disabled="disabled"
        @input="onInput(relationId, $event)"
      />
      <b-button
        variant="danger"
        size="sm"
        title="Delete this relation"
        @click="onDelete(relationId)"
      >
        <b-icon icon="trash" /> Delete this relation
      </b-button>
    </b-card>
    <b-button
      v-for="side_name in relationTypeConfig[side === 'domain' ? 'range_names' : 'domain_names']"
      :key="side_name"
      variant="primary"
      size="sm"
      class="mt-3"
      @click="onAdd(side_name)"
    >
      <b-icon icon="plus" />
      Add {{ panelTitle }} relation to a(n) {{ entityTypesConfig[side_name].display_name }}
    </b-button>
  </b-card>
</template>
<script>
import RelationEditPanelPanel from '~/components/Edit/RelationEditPanelPanel.vue'
import RelationEntityEditPanel from '~/components/Edit/RelationEntityEditPanel.vue'

export default {
  components: {
    RelationEditPanelPanel,
    RelationEntityEditPanel
  },
  props: {
    disabled: {
      type: Boolean,
      required: true
    },
    entityTypesConfig: {
      type: Object,
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
      if (this.$refs.entityPanels == null) {
        return false
      }
      for (const entityPanel of this.$refs.entityPanels) {
        if (entityPanel.invalid) {
          return true
        }
      }
      if (this.$refs.relationPanels == null) {
        return false
      }
      for (const relationPanel of this.$refs.relationPanels) {
        if (relationPanel.invalid) {
          return true
        }
      }
      return false
    },
    layout () {
      const layout = JSON.parse(JSON.stringify(this.relationTypeConfig.edit.layout))
      if (layout == null) {
        return []
      }
      for (const panel of layout) {
        for (const field of panel.fields) {
          const systemName = field.field.replace('$', '')
          field.validators = this.relationTypeConfig.data[systemName].validators
          field.label = field.label ?? this.relationTypeConfig.data[systemName].display_name
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
    getInitialEntityValue (relationId) {
      if (this.formData[relationId].entity.id == null) {
        return null
      }
      return {
        key: this.formData[relationId].entity.id,
        value: this.formData[relationId].entity.title
      }
    },
    getInitialEntityOptions (relationId) {
      if (this.formData[relationId].entity.id == null) {
        return null
      }
      return [
        {
          key: this.formData[relationId].entity.id,
          value: this.formData[relationId].entity.title
        }
      ]
    },
    onAdd (entityTypeName) {
      this.$emit(
        'input',
        {
          action: 'add_relation',
          value: entityTypeName
        }
      )
    },
    onDelete (relationId) {
      this.$emit(
        'input',
        {
          action: 'delete_relation',
          relationId
        }
      )
    },
    onEntityInput (relationId, event) {
      this.$emit(
        'input',
        {
          action: 'edit_relation_entity',
          ...event,
          relationId
        }
      )
    },
    onInput (relationId, event) {
      this.$emit(
        'input',
        {
          action: 'edit_relation',
          ...event,
          relationId
        }
      )
    },
    reset () {
      if (this.$refs.entityPanels != null) {
        for (const entityPanel of this.$refs.entityPanels) {
          entityPanel.reset()
        }
      }
      if (this.$refs.relationPanels != null) {
        for (const relationPanel of this.$refs.relationPanels) {
          relationPanel.reset()
        }
      }
    },
    touch () {
      if (this.$refs.entityPanels != null) {
        for (const entityPanel of this.$refs.entityPanels) {
          entityPanel.touch()
        }
      }
      if (this.$refs.relationPanels != null) {
        for (const relationPanel of this.$refs.relationPanels) {
          relationPanel.touch()
        }
      }
    }
  }
}
</script>
