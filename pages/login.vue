<template>
  <LoginForm @login="login" />
</template>
<script>
import LoginForm from '@/components/LoginForm'

export default {
  components: {
    LoginForm
  },
  data () {
    return {
      username: '',
      password: '123',
      error: null
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
    }
  }
}
</script>
