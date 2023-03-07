<template>
  <div class="mb-2">
    <b-row>
      <b-col cols="10">
        <form-group
          v-if="selectEntity"
          ref="formGroup"
          :disabled="disabled"
          :field="{
            field: '$edit_relation_title',
            label: label,
            type: 'nested',
            validators: [{type: 'required'}]
          }"
          :component-props="{
            'search-url': `/es/${projectName}/${formData.entityTypeName}/aggregation_suggest`
          }"
          :initial-value="JSON.stringify(formData)"
          @input="$emit('input', $event)"
        />
        <template v-else>
          [{{ formData.id }}] {{ formData.title }}
        </template>
      </b-col>
      <b-col
        v-if="formData.id"
        cols="2"
        :class="{'select-entity-icon-wrapper': selectEntity}"
      >
        <b-link
          target="_blank"
          title="View entity"
          :to="{
            name: 'project_name-entity_type_name-id',
            params: {
              project_name: projectName,
              entity_type_name: formData.entityTypeName,
              id: formData.id
            }
          }"
        >
          <b-icon icon="eye-fill" />
        </b-link>
        <!-- TODO: check edit permission on entity type -->
        <b-link
          target="_blank"
          title="Edit entity"
          :to="{
            name: 'project_name-entity_type_name-id-edit',
            params: {
              project_name: projectName,
              entity_type_name: formData.entityTypeName,
              id: formData.id
            }
          }"
        >
          <b-icon icon="pencil-fill" />
        </b-link>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import FormGroup from '~/components/Edit/FormGroup.vue'

export default {
  components: {
    FormGroup
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
    label: {
      type: String,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    selectEntity: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    invalid () {
      if (this.$refs.formGroup == null) {
        return false
      }
      return this.$refs.formGroup.invalid
    }
  },
  methods: {
    reset () {
      if (this.$refs.formGroup != null) {
        this.$refs.formGroup.reset()
      }
    },
    touch () {
      if (this.$refs.formGroup != null) {
        this.$refs.formGroup.touch()
      }
    }
  }
}
</script>
