<template>
  <b-card
    :title="panelTitle"
    class="bg-light border-0 mb-3"
  >
    <b-card
      v-for="(fd, index) in formData"
      :key="index"
      class="border-0 bg-white mb-1"
    >
      <p>
        [{{ fd.entity.id }}] {{ fd.entity.title }}
        <!-- TODO: check edit permission on entity type -->
        <b-link
          class="float-right"
        >
          <b-icon-pencil-fill />
          Edit entity
        </b-link>
      </p>
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
