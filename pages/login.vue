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
      busy: false
    }
  },
  computed: {
    redirect () {
      return (
        this.$route.query.redirect &&
        decodeURIComponent(this.$route.query.redirect)
      )
    },
    isCallback () {
      return Boolean(this.$route.query.callback)
    }
  },
  methods: {
    async login (userInfo) {
      this.busy = true

      const formData = new FormData()
      formData.append('username', userInfo.username)
      formData.append('password', userInfo.password)

      try {
        await this.$auth.loginWith('local', {
          data: formData
        })
        this.$store.dispatch(
          'notifications/create',
          {
            message: `Logged in as ${this.$auth.user.display_name}`,
            title: 'Login successfull',
            variant: 'success'
          }
        )
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
