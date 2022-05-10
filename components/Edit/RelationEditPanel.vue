<template>
  <b-card
    :title="panelTitle"
    class="bg-light border-0 mb-3"
  >
    <!-- todo: use relation type and relation id as key below -->
    <b-card
      v-for="(fd, index) in formData"
      :key="index"
      class="border-0 bg-white mb-1"
    >
      <b-row>
        <b-col sm="9">
          [{{ fd.entity.id }}] {{ fd.entity.title }}
          <!-- TODO: check edit permission on entity type -->
        </b-col>
        <b-col sm="3">
          <b-link
            class="float-right"
          >
            <b-icon-pencil-fill />
            Edit entity
          </b-link>
        </b-col>
      </b-row>
      <b-button
        class="float-right"
        variant="danger"
      >
        <b-icon icon="trash" />
        Delete relation
      </b-button>
    </b-card>
  </b-card>
</template>
<script>
export default {
  props: {
    config: {
      type: Object,
      required: true
    },
    formData: {
      type: Array,
      required: true
    },
    side: {
      type: String,
      required: true
    }
  },
  computed: {
    panelTitle () {
      return this.config.edit[`${this.side}_title`]
    }
  }
}
</script>
