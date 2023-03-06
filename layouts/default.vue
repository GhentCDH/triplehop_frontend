<template>
  <b-overlay
    :show="busy"
    spinner-variant="primary"
  >
    <b-container
      fluid="xl"
      class="flex-container"
    >
      <header>
        <b-navbar toggleable="xl" type="light" variant="light" class="mb-3">
          <b-navbar-brand :to="projectPrefix">
            {{ brand }}
          </b-navbar-brand>

          <b-navbar-toggle target="nav-collapse" />

          <b-collapse
            id="nav-collapse"
            is-nav
            class="text-primary"
          >
            <b-navbar-nav>
              <b-nav-item
                v-for="link in links"
                :key="link.systemName"
                :to="`${projectPrefix}${link.systemName}`"
                :active="link.active"
              >
                {{ link.displayName }}
              </b-nav-item>
            </b-navbar-nav>
            <b-navbar-nav class="ml-auto">
              <b-nav-item-dropdown
                v-if="$auth.loggedIn"
                id="person-actions"
              >
                <template #button-content>
                  <b-icon icon="person-fill" />
                </template>
                <b-dropdown-header>Logged in as {{ $auth.user.display_name }}</b-dropdown-header>
                <b-dropdown-item @click="logout">
                  <b-icon
                    icon="upload"
                    rotate="90"
                  />
                  Logout
                </b-dropdown-item>
              </b-nav-item-dropdown>
              <b-nav-item-dropdown
                v-if="hasAtLeastOneEntityTypeWithPermission($auth.user, projectName, 'es_data', 'index')"
                id="elasticsearch-reindex"
              >
                <template #button-content>
                  <b-icon icon="arrow-clockwise" />
                </template>
                <b-dropdown-header>Re-index in elasticsearch</b-dropdown-header>
                <!-- <b-dropdown-item
                  v-for="entityTypeName in sortedReindexableEntityTypeNames"
                  :key="entityTypeName"
                  @click="reindex(entityTypeName)"
                >
                  {{ entityTypesConfig[entityTypeName].display_name }}
                </b-dropdown-item> -->
              </b-nav-item-dropdown>
              <b-nav-item
                v-else
                to="/login"
              >
                <b-icon
                  icon="download"
                  rotate="270"
                />
                Login
              </b-nav-item>
            </b-navbar-nav>
          </b-collapse>
        </b-navbar>
      </header>
      <main class="d-md-flex overflow-y">
        <notifications />
        <nuxt />
      </main>
    </b-container>
  </b-overlay>
</template>
<script>
import Notifications from '@/components/Notifications'
import { hasProjectAdminAccess, hasAtLeastOneEntityTypeWithPermission } from '@/assets/js/auth'

export default {
  components: {
    Notifications
  },
  data () {
    return {
      busy: false
    }
  },
  computed: {
    brand () {
      if (
        this.$store.state.config.project_def == null ||
        this.$store.state.config.project_def.display_name == null
      ) {
        return 'TripleHop'
      }
      return this.$store.state.config.project_def.display_name ?? 'TripleHop'
    },
    entityTypesConfig () {
      return this.$store.state.config.entity_types
    },
    links () {
      const links = []
      if (
        this.$store.state.config.entity_types != null
      ) {
        for (const [entityTypeName, entityTypeConfig] of Object.entries(this.$store.state.config.entity_types)) {
          if ('elasticsearch' in entityTypeConfig) {
            const link = {
              systemName: entityTypeName,
              displayName: entityTypeConfig.display_name
            }
            if (
              this.$route.name === 'project_name-entity_type_name' &&
              this.$route.params.entity_type_name === entityTypeName
            ) {
              link.active = true
            }
            links.push(link)
          }
        }
      }
      return links
    },
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    },
    projectPrefix () {
      return this.$config.projectName == null ? `/${this.projectName}/` : '/'
    }
    // sortedReindexableEntityTypeNames () {
    //   const sortedReindexableEntityTypeNames = Object.keys(this.entityTypesConfig)
    //   sortedReindexableEntityTypeNames.sort()
    //   return sortedReindexableEntityTypeNames
    // }
  },
  methods: {
    hasProjectAdminAccess,
    hasAtLeastOneEntityTypeWithPermission,
    async logout () {
      this.busy = true
      try {
        await this.$auth.logout()
        this.$store.dispatch(
          'notifications/create',
          {
            message: 'Logout successfull',
            variant: 'success'
          }
        )
        this.busy = false
      } catch (error) {
        // TODO: check why errors aren't propagated to here
        this.$store.dispatch(
          'notifications/create',
          {
            message: 'There was an issue logging out.  Please try again.',
            title: 'Logout unsuccessfull',
            variant: 'danger'
          }
        )
        this.busy = false
      }
    },
    async reindex (entityTypeName) {
      this.busy = true

      try {
        const response = await this.$axios.get(
          `/es/${this.projectName}/${entityTypeName}/reindex`
        )
        this.$router.push(`${this.projectPrefix}admin/job/${response.data.id}`)
      } catch (error) {
        this.$store.dispatch(
          'notifications/create',
          {
            message: 'There was an issue creating the re-index job.  Please try again.',
            title: 'Re-index unsuccessfull',
            variant: 'danger'
          }
        )
        this.busy = false
      }
    }
  }
}
</script>
