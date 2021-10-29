<template>
  <LoginForm
    :busy="busy"
    @login="login"
  />
</template>
<script>
import LoginForm from '@/components/LoginForm'

export default {
  components: {
    LoginForm
  },
  data () {
    return {
      busy: false,
      prev: null
    }
  },
  mounted () {
    this.prev = this.$nuxt.context.from
  },
  methods: {
    async login (userInfo) {
      this.busy = true

      try {
        await this.$auth.loginWith(
          'local',
          {
            data: userInfo
          }
        )
        this.$store.dispatch(
          'notifications/create',
          {
            message: 'Login successfull',
            variant: 'success'
          }
        )
        if (this.$nuxt.context.from != null) {
          this.$router.push(this.prev)
        }
      } catch (error) {
        this.$store.dispatch(
          'notifications/create',
          {
            message: 'There was an issue logging in.  Please try again.',
            title: 'Login unsuccessfull',
            variant: 'danger'
          }
        )
      }

      this.busy = false
    }
  }
}
</script>
