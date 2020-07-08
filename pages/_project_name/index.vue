<template>
  <div>
    <h1>
      {{ projectDisplayName }} home page
    </h1>
  </div>
</template>

<script>
export default {
  auth: false,
  computed: {
    projectDisplayName () {
      return this.$store.state.config.project_def.display_name
    }
  }
}
</script>
