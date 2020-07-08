<template>
  <b-container fluid="lg">
    <header>
      <b-navbar toggleable="lg" type="light" variant="light" class="mb-4">
        <b-navbar-brand :to="homeUrl">
          {{ brand }}
        </b-navbar-brand>

        <b-navbar-toggle target="nav-collapse" />

        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav class="ml-auto">
            <b-nav-item-dropdown v-if="$auth.loggedIn">
              <template v-slot:button-content>
                <b-icon icon="person-fill" />
                {{ $auth.user.display_name }}
              </template>
              <b-dropdown-item
                v-if="hasGlobalAdminAccess($auth.user)"
                to="/admin"
              >
                <b-icon
                  icon="gear-fill"
                />
                Global admin dashboard
              </b-dropdown-item>
              <b-dropdown-item
                v-if="hasProjectAdminAccess($auth.user, $route.params.project_name)"
                :to="'/' + $route.params.project_name + '/admin'"
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
import { hasGlobalAdminAccess, hasProjectAdminAccess } from '@/assets/js/auth'

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
        return 'CRDB'
      }
      return this.$store.state.config.project_def.display_name ?? 'CRDB'
    },
    homeUrl () {
      return `/${this.$route.params.project_name ?? ''}`
    }
  },
  methods: {
    hasGlobalAdminAccess,
    hasProjectAdminAccess,
    logout () {
      this.$auth.logout()
      this.$store.dispatch(
        'notifications/create',
        {
          title: 'Logout successfull',
          variant: 'success'
        }
      )
    }
  }
}
</script>
