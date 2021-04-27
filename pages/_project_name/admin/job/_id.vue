<template>
  <div>
    <h1>
      Job {{ $route.params.id }}
    </h1>
    <p v-if="$fetchState.error">
      Error while fetching data...
    </p>
    <b-overlay
      :show="$fetchState.pending"
      spinner-variant="primary"
    >
      <dl
        v-if="!($fetchState.pending)"
        class="row"
      >
        <dt class="col-sm-3">
          Entity type name
        </dt>
        <dd class="col-sm-9">
          {{ jobData.entity_type_display_name }}
        </dd>
        <dt class="col-sm-3">
          Relation type name
        </dt>
        <dd class="col-sm-9">
          {{ jobData.relation_type_display_name }}
        </dd>
        <dt class="col-sm-3">
          Type
        </dt>
        <dd class="col-sm-9">
          {{ jobData.type }}
        </dd>
        <dt class="col-sm-3">
          Status
        </dt>
        <dd class="col-sm-9">
          {{ jobData.status }}
        </dd>
        <dt class="col-sm-3">
          Counter
        </dt>
        <dd class="col-sm-9">
          {{ jobData.counter }}
        </dd>
        <dt class="col-sm-3">
          Total
        </dt>
        <dd class="col-sm-9">
          {{ jobData.total }}
        </dd>
        <dt class="col-sm-3">
          Created
        </dt>
        <dd class="col-sm-9">
          {{ formatDateTime(jobData.created) }}
        </dd>
        <dt class="col-sm-3">
          Started
        </dt>
        <dd class="col-sm-9">
          {{ formatDateTime(jobData.started) }}
        </dd>
        <dt class="col-sm-3">
          Ended
        </dt>
        <dd class="col-sm-9">
          {{ formatDateTime(jobData.ended) }}
        </dd>
      </dl>
    </b-overlay>
  </div>
</template>

<script>
import { formatDateTime, isUUID } from '~/assets/js/utils'

export default {
  validate ({ params }) {
    // TODO: validate project_name based on cached config
    // Make sure id is a uuid
    if (!isUUID(params.id)) {
      return false
    }
    return true
  },
  async fetch () {
    await this.$store.dispatch(
      'job/load_single_by_project',
      {
        id: this.$route.params.id,
        projectName: this.projectName
      }
    )
    if (!(this.$route.params.id in this.$store.state.job.jobs)) {
      return this.$nuxt.error({
        statusCode: 404,
        message: `Job with id "${this.$route.params.id}" cannot be found.`
      })
    }
  },
  computed: {
    jobData () {
      return this.$store.state.job.jobs[this.$route.params.id]
    },
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    }
  },
  methods: {
    formatDateTime
  }
}
</script>
