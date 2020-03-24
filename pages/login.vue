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
      await this.$auth.loginWith('local', {
        data: formData
      })
        .catch((e) => {
          // TODO: set error in message system
        })
    }
  }
}
</script>
