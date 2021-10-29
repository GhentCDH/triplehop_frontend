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

      const formData = new FormData()
      formData.append('username', userInfo.username)
      formData.append('password', userInfo.password)

      try {
        await this.$auth.loginWith('local', {
          data: formData
        })
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
      if (this.$nuxt.context.from != null) {
        this.$router.push(this.prev)
      }

      this.busy = false
    }
  }
}
</script>
