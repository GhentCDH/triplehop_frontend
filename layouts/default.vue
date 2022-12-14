<template>
  <b-container fluid="lg">
    <header>
      <b-navbar toggleable="lg" type="light" variant="light" class="mb-3">
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
            <b-nav-item v-if="$config.homepage != null" :href="$config.homepage">
              Home
            </b-nav-item>
            <b-nav-item v-else :to="projectPrefix">
              Home
            </b-nav-item>
            <b-nav-item
              v-for="link in links"
              :key="link.systemName"
              :to="`${projectPrefix}${link.systemName}`"
            >
              {{ link.displayName }}
            </b-nav-item>
          </b-navbar-nav>
          <b-navbar-nav class="ml-auto">
            <b-nav-item-dropdown v-if="$auth.loggedIn">
              <template #button-content>
                <b-icon icon="person-fill" />
                {{ $auth.user.display_name }}
              </template>
              <b-dropdown-item
                v-if="hasProjectAdminAccess($auth.user, projectName)"
                :to="`${projectPrefix}admin`"
              >
                <b-icon
                  icon="gear-fill"
                />
                Project admin dashboard
              </b-dropdown-item>
              <b-dropdown-item @click="logout">
                <b-icon
                  icon="upload"
                  rotate="90"
                />
                Logout
              </b-dropdown-item>
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
    <main>
      <notifications />
      <nuxt />
    </main>
  </b-container>
</template>
<script>
import Notifications from '@/components/Notifications'
import { hasProjectAdminAccess } from '@/assets/js/auth'

export default {
  components: {
    Notifications
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
    links () {
      const result = []
      if (
        this.$store.state.config.entity_types != null
      ) {
        for (const [entityTypeName, entityTypeConfig] of Object.entries(this.$store.state.config.entity_types)) {
          if ('elasticsearch' in entityTypeConfig) {
            result.push({
              systemName: entityTypeName,
              displayName: entityTypeConfig.display_name
            })
          }
        }
      }
      return result
    },
    projectName () {
      return this.$config.projectName ?? this.$route.params.project_name
    },
    projectPrefix () {
      return this.$config.projectName == null ? `/${this.projectName}/` : '/'
    }
  },
  methods: {
    hasProjectAdminAccess,
    async logout () {
      try {
        await this.$auth.logout()
        this.$store.dispatch(
          'notifications/create',
          {
            message: 'Logout successfull',
            variant: 'success'
          }
        )
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
      }
    }
  }
}
</script>
