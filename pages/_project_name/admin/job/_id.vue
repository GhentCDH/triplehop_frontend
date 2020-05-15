<template>
  <div>
    <h1>
      Job {{ $route.params.id }}
    </h1>
    <dl class="row">
      <dt class="col-sm-3">
        Entity type name
      </dt>
      <dd class="col-sm-9">
        {{ jobData.entity_type_display_name }}
      </dd>
    </dl>
    <dl class="row">
      <dt class="col-sm-3">
        Relation type name
      </dt>
      <dd class="col-sm-9">
        {{ jobData.relation_type_display_name }}
      </dd>
    </dl>
    <dl class="row">
      <dt class="col-sm-3">
        Type
      </dt>
      <dd class="col-sm-9">
        {{ jobData.type }}
      </dd>
    </dl>
    <dl class="row">
      <dt class="col-sm-3">
        Status
      </dt>
      <dd class="col-sm-9">
        {{ jobData.status }}
      </dd>
    </dl>
    <dl class="row">
      <dt class="col-sm-3">
        Counter
      </dt>
      <dd class="col-sm-9">
        {{ jobData.counter }}
      </dd>
    </dl>
    <dl class="row">
      <dt class="col-sm-3">
        Total
      </dt>
      <dd class="col-sm-9">
        {{ jobData.total }}
      </dd>
    </dl>
    <dl class="row">
      <dt class="col-sm-3">
        Created
      </dt>
      <dd class="col-sm-9">
        {{ formatDateTime(jobData.created) }}
      </dd>
    </dl>
    <dl class="row">
      <dt class="col-sm-3">
        Started
      </dt>
      <dd class="col-sm-9">
        {{ formatDateTime(jobData.started) }}
      </dd>
    </dl>
    <dl class="row">
      <dt class="col-sm-3">
        Ended
      </dt>
      <dd class="col-sm-9">
        {{ formatDateTime(jobData.ended) }}
      </dd>
    </dl>
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
  async fetch ({ params, store, error }) {
    await store.dispatch(
      'job/load_single_by_project',
      {
        id: params.id,
        projectName: params.project_name
      }
    )
    if (!(params.id in store.state.job.jobs)) {
      return error({
        statusCode: 404,
        message: `Job with id "${params.id}" cannot be found.`
      })
    }
  },
  computed: {
    jobData () {
      return this.$store.state.job.jobs[this.$route.params.id]
    }
  },
  methods: {
    formatDateTime
  }
}
</script>
